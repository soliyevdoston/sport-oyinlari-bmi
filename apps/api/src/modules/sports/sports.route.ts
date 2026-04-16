import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { espnProvider, type SportKey } from "../../adapters/sports-providers/espn.provider.js";
import { db } from "../../shared/store.js";

export const sportsRouter = Router();
const newsQuerySchema = z.object({
  sport: z.enum(["football", "basketball", "tennis", "mma", "volleyball"]).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional()
});

const fallbackMatches = (sport?: SportKey) => {
  return db.matches
    .filter((item) => (sport ? item.sport === sport : true))
    .map((item) => ({
      id: item.id,
      sport: item.sport as SportKey,
      league: item.league,
      home: {
        id: `${item.id}-h`,
        name: item.homeTeam,
        logoUrl: item.homeLogoUrl
      },
      away: {
        id: `${item.id}-a`,
        name: item.awayTeam,
        logoUrl: item.awayLogoUrl
      },
      startTime: item.startTime,
      status: item.status ?? "scheduled",
      score: item.score
    }));
};

const fallbackNews = (sport?: SportKey, limit = 12) => {
  return db.matches
    .filter((item) => (sport ? item.sport === sport : true))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit)
    .map((item, index) => ({
      id: `local-news-${item.id}-${index}`,
      sport: item.sport as SportKey,
      title: `${item.homeTeam} vs ${item.awayTeam}: ${item.league} tahlili`,
      description: `${item.league} doirasidagi uchrashuv uchun forma, natija trendi va asosiy statistik signal.`,
      content:
        `${item.homeTeam} va ${item.awayTeam} o'yini uchun kontekst tahlili. ` +
        `Liga: ${item.league}. Status: ${item.status ?? "scheduled"}. ` +
        `Boshlanish vaqti: ${new Date(item.startTime).toLocaleString()}.`,
      imageUrl: item.homeLogoUrl || item.awayLogoUrl || "",
      publishedAt: item.startTime,
      source: "ScoreAI Local Feed",
      url: `/matches/${item.id}?sport=${item.sport}`
    }));
};

type FeedRow = ReturnType<typeof fallbackMatches>[number];

const mergeFeed = (provider: FeedRow[], fallback: FeedRow[]) => {
  const merged = [...provider, ...fallback].reduce<Map<string, FeedRow>>((bucket, row) => {
    bucket.set(`${row.sport}:${row.id}`, row);
    return bucket;
  }, new Map());

  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
};

sportsRouter.get("/sports/catalog", (_req, res) => {
  return res.json({ sports: espnProvider.getCatalog() });
});

sportsRouter.get("/sports/feed", async (req, res) => {
  const query = z
    .object({
      sport: z.enum(["football", "basketball", "tennis", "mma", "volleyball"]).optional(),
      days: z.coerce.number().int().min(1).max(45).optional(),
      limit: z.coerce.number().int().min(1).max(1000).optional()
    })
    .safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ message: "Invalid sport filter" });
  }

  const days = query.data.days ?? 14;
  const limit = query.data.limit;

  if (query.data.sport) {
    const sport = query.data.sport as SportKey;
    const providerMatches = await espnProvider.getFeedBySport(sport, days);
    const fallback = fallbackMatches(sport);
    const merged = mergeFeed(providerMatches as FeedRow[], fallback);

    if (!merged.length) {
      return res.json({ matches: [], source: "empty" });
    }

    return res.json({
      matches: limit ? merged.slice(0, limit) : merged,
      source: providerMatches.length ? "provider+fallback" : "fallback"
    });
  }

  const providerMatches = await espnProvider.getFeedAll(days);
  const fallback = fallbackMatches();
  const merged = mergeFeed(providerMatches as FeedRow[], fallback);

  if (!merged.length) {
    return res.json({ matches: [], source: "empty" });
  }

  return res.json({
    matches: limit ? merged.slice(0, limit) : merged,
    source: providerMatches.length ? "provider+fallback" : "fallback"
  });
});

sportsRouter.get("/sports/event/:id", async (req, res) => {
  const query = z
    .object({
      sport: z.enum(["football", "basketball", "tennis", "mma", "volleyball"]).optional()
    })
    .safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ message: "Invalid query" });
  }

  const eventId = String(req.params.id);

  if (query.data.sport) {
    const rows = await espnProvider.getFeedBySport(query.data.sport as SportKey, 45);
    const match = rows.find((row) => row.id === eventId);
    if (match) {
      return res.json({ match });
    }

    const fallback = fallbackMatches(query.data.sport as SportKey).find((row) => row.id === eventId);
    if (!fallback) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json({ match: fallback, source: "fallback" });
  }

  const all = await espnProvider.getFeedAll(45);
  const match = all.find((row) => row.id === eventId);
  if (match) {
    return res.json({ match });
  }

  const fallback = fallbackMatches().find((row) => row.id === eventId);
  if (!fallback) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json({ match: fallback, source: "fallback" });
});

sportsRouter.get("/sports/event/:id/summary", async (req, res) => {
  const query = z.object({ sport: z.enum(["football", "basketball", "tennis", "mma", "volleyball"]) }).safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ message: "sport query is required" });
  }

  const summary = await espnProvider.getEventSummary(query.data.sport as SportKey, String(req.params.id));
  if (!summary) {
    return res.status(404).json({ message: "Summary not found" });
  }

  return res.json({ summary });
});

const newsHandler = async (req: Request, res: Response) => {
  const query = newsQuerySchema.safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ message: "Invalid query" });
  }

  const limit = query.data.limit ?? 12;
  const sport = query.data.sport as SportKey | undefined;
  let articles: Awaited<ReturnType<typeof espnProvider.getNews>> = [];
  let source = "provider";

  try {
    articles = await espnProvider.getNews(sport, limit);
  } catch {
    articles = [];
  }

  if (!articles.length) {
    articles = fallbackNews(sport, limit);
    source = "fallback";
  }

  return res.json({ articles, source });
};

sportsRouter.get("/sports/news", newsHandler);
sportsRouter.get("/news", newsHandler);
