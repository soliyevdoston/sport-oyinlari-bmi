import type { MatchLite, SportKey } from "@aetherscore/shared";
import { apiRequest } from "@/lib/api";

export interface SportCatalogItem {
  key: SportKey;
  label: string;
  blurb: string;
  logoUrl: string;
  endpoints: string[];
}

export interface EventSummary {
  id: string;
  sport: SportCatalogItem["key"];
  headline: string;
  homeStats: Array<{ name: string; value: string }>;
  awayStats: Array<{ name: string; value: string }>;
  notes: string[];
}

export interface AiMatchInsight {
  headline: string;
  confidenceLabel: string;
  predictedScoreRange: string;
  tacticalView: string;
  formNarrative: string;
  keyFactors: string[];
  riskNotes: string[];
  finalSummary: string;
  source: "ai" | "fallback";
  model: string;
  generatedAt: string;
}

export interface NewsArticle {
  id: string;
  sport: SportKey;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  url: string;
}

const FALLBACK_CATALOG: SportCatalogItem[] = [
  {
    key: "football",
    label: "Futbol",
    blurb: "Yuqori darajadagi o'yinlar, O'zbekiston ligalari va chuqur match konteksti.",
    logoUrl: "",
    endpoints: ["soccer/eng.1", "soccer/esp.1", "soccer/ger.1", "soccer/ita.1", "soccer/fra.1"]
  },
  {
    key: "basketball",
    label: "Basketbol",
    blurb: "Pace oqimi va matchup darajasidagi scoreboard tahlili.",
    logoUrl: "",
    endpoints: ["basketball/nba", "basketball/wnba"]
  },
  {
    key: "tennis",
    label: "Tennis",
    blurb: "Turnirlar jadvali va hisobdagi momentum ko'rinishi.",
    logoUrl: "",
    endpoints: ["tennis/atp", "tennis/wta"]
  },
  {
    key: "mma",
    label: "MMA/UFC",
    blurb: "Jang kartalari va fighter darajasidagi kontekst.",
    logoUrl: "",
    endpoints: ["mma/ufc", "mma/pfl"]
  },
  {
    key: "volleyball",
    label: "Voleybol",
    blurb: "Featured matchup va jamoaviy ko'rsatkichlar.",
    logoUrl: "",
    endpoints: ["volleyball/mens-college-volleyball"]
  }
];

const CACHE_TTL_MS = 1000 * 60 * 2;
const cache = new Map<string, { expiresAt: number; matches: MatchLite[] }>();

const formatDateToken = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const scoreboardRange = (days: number) => {
  const safeDays = Math.min(Math.max(days, 1), 30);
  const from = new Date();
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + safeDays);
  return `${formatDateToken(from)}-${formatDateToken(to)}`;
};

const competitorName = (competitor: Record<string, any> | undefined, fallback: string) => {
  if (!competitor) return fallback;

  return (
    competitor.team?.displayName ??
    competitor.team?.name ??
    competitor.athlete?.displayName ??
    competitor.displayName ??
    fallback
  );
};

const competitorLogo = (competitor: Record<string, any> | undefined, fallback: string) => {
  if (!competitor) return fallback;

  return (
    competitor.team?.logo ??
    competitor.team?.logos?.[0]?.href ??
    competitor.athlete?.flag?.href ??
    competitor.athlete?.headshot?.href ??
    fallback
  );
};

const statusMap = (state?: string): MatchLite["status"] => {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
};

const fetchJsonWithTimeout = async (url: string, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as Record<string, any>;
  } finally {
    window.clearTimeout(timer);
  }
};

const normalizeEvent = (
  event: Record<string, any>,
  sport: SportCatalogItem,
  leagueFallback: string
): MatchLite => {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  const homeCompetitor =
    competitors.find((item: Record<string, any>) => item.homeAway === "home") ?? competitors[0] ?? undefined;
  const awayCompetitor =
    competitors.find((item: Record<string, any>) => item.homeAway === "away") ?? competitors[1] ?? undefined;

  const homeName = competitorName(homeCompetitor, `${sport.label} Home`);
  const awayName = competitorName(awayCompetitor, `${sport.label} Away`);

  const homeScore = Number.parseInt(String(homeCompetitor?.score ?? ""), 10);
  const awayScore = Number.parseInt(String(awayCompetitor?.score ?? ""), 10);
  const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);

  return {
    id: String(event.id),
    sport: sport.key,
    league: event.league?.name ?? leagueFallback,
    home: {
      id: String(homeCompetitor?.id ?? `${event.id}-h`),
      name: homeName,
      logoUrl: competitorLogo(homeCompetitor, sport.logoUrl)
    },
    away: {
      id: String(awayCompetitor?.id ?? `${event.id}-a`),
      name: awayName,
      logoUrl: competitorLogo(awayCompetitor, sport.logoUrl)
    },
    startTime: event.date ?? new Date().toISOString(),
    status: statusMap(event.status?.type?.state),
    score: hasScore
      ? {
          home: homeScore,
          away: awayScore
        }
      : undefined
  };
};

const fetchFallbackFeed = async (
  sport?: SportCatalogItem["key"],
  options?: { days?: number; limit?: number }
) => {
  const days = options?.days ?? 14;
  const cacheKey = `${sport ?? "all"}:${days}`;
  const current = cache.get(cacheKey);

  if (current && Date.now() < current.expiresAt) {
    return options?.limit ? current.matches.slice(0, options.limit) : current.matches;
  }

  const targets = sport
    ? FALLBACK_CATALOG.filter((item) => item.key === sport)
    : FALLBACK_CATALOG;

  const range = scoreboardRange(days);

  const feedGroups = await Promise.all(
    targets.map(async (item) => {
      const rows = await Promise.all(
        item.endpoints.map(async (endpoint) => {
          try {
            const data = await fetchJsonWithTimeout(
              `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/scoreboard?dates=${range}`
            );
            const league = data.leagues?.[0]?.name ?? item.label;
            return Array.isArray(data.events)
              ? data.events.map((event) => normalizeEvent(event, item, league))
              : [];
          } catch {
            return [];
          }
        })
      );

      return rows.flat();
    })
  );

  const merged = feedGroups
    .flat()
    .reduce<Map<string, MatchLite>>((acc, row) => {
      acc.set(`${row.sport}:${row.id}`, row);
      return acc;
    }, new Map());

  const matches = Array.from(merged.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    matches
  });

  return options?.limit ? matches.slice(0, options.limit) : matches;
};

export const fetchSportsCatalog = async () => {
  try {
    const payload = await apiRequest<{ sports: SportCatalogItem[] }>("/sports/catalog");
    if (payload.sports?.length) return payload.sports;
  } catch {
    // fall through to static fallback
  }

  return FALLBACK_CATALOG;
};

export const fetchSportsFeed = async (
  sport?: SportCatalogItem["key"],
  options?: { days?: number; limit?: number }
) => {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (options?.days) params.set("days", String(options.days));
  if (options?.limit) params.set("limit", String(options.limit));
  const suffix = params.size ? `?${params.toString()}` : "";

  try {
    const payload = await apiRequest<{ matches: MatchLite[] }>(`/sports/feed${suffix}`);
    if (payload.matches?.length) {
      return payload.matches;
    }
  } catch {
    // fallback below
  }

  return fetchFallbackFeed(sport, options);
};

export const fetchSportsEvent = async (id: string, sport?: SportCatalogItem["key"]) => {
  const suffix = sport ? `?sport=${sport}` : "";

  try {
    const payload = await apiRequest<{ match: MatchLite }>(`/sports/event/${id}${suffix}`);
    if (payload.match) return payload.match;
  } catch {
    // fallback below
  }

  const rows = await fetchFallbackFeed(sport, { days: 30, limit: 1200 });
  const found = rows.find((row) => row.id === id);
  if (!found) {
    throw new Error("Event not found");
  }

  return found;
};

export const fetchSportsSummary = async (id: string, sport: SportCatalogItem["key"]) => {
  const payload = await apiRequest<{ summary: EventSummary }>(`/sports/event/${id}/summary?sport=${sport}`);
  return payload.summary;
};

export const fetchAiMatchInsight = async (payload: {
  match: MatchLite;
  summary?: EventSummary | null;
  history?: {
    homeForm?: string[];
    awayForm?: string[];
    homeScored?: number;
    awayScored?: number;
    homeConceded?: number;
    awayConceded?: number;
  };
  probabilities?: {
    home: number;
    draw?: number;
    away: number;
    confidence?: string;
  };
}) => {
  const finiteNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizedPayload = {
    match: {
      id: String(payload.match.id ?? ""),
      sport: String(payload.match.sport ?? "football"),
      league: String(payload.match.league ?? ""),
      startTime: String(payload.match.startTime ?? new Date().toISOString()),
      status: payload.match.status,
      home: {
        id: payload.match.home.id ? String(payload.match.home.id) : undefined,
        name: String(payload.match.home.name ?? "Home")
      },
      away: {
        id: payload.match.away.id ? String(payload.match.away.id) : undefined,
        name: String(payload.match.away.name ?? "Away")
      },
      score:
        typeof payload.match.score?.home === "number" && typeof payload.match.score?.away === "number"
          ? {
              home: finiteNumber(payload.match.score.home, 0),
              away: finiteNumber(payload.match.score.away, 0)
            }
          : undefined
    },
    summary: payload.summary
      ? {
          headline: payload.summary.headline,
          homeStats: payload.summary.homeStats?.map((item) => ({
            name: String(item.name ?? ""),
            value: String(item.value ?? "")
          })),
          awayStats: payload.summary.awayStats?.map((item) => ({
            name: String(item.name ?? ""),
            value: String(item.value ?? "")
          })),
          notes: payload.summary.notes?.map((item) => String(item))
        }
      : undefined,
    history: payload.history
      ? {
          homeForm: payload.history.homeForm?.map((item) => String(item)),
          awayForm: payload.history.awayForm?.map((item) => String(item)),
          homeScored: finiteNumber(payload.history.homeScored, 0),
          awayScored: finiteNumber(payload.history.awayScored, 0),
          homeConceded: finiteNumber(payload.history.homeConceded, 0),
          awayConceded: finiteNumber(payload.history.awayConceded, 0)
        }
      : undefined,
    probabilities: payload.probabilities
      ? {
          home: finiteNumber(payload.probabilities.home, 50),
          draw: payload.probabilities.draw == null ? undefined : finiteNumber(payload.probabilities.draw, 0),
          away: finiteNumber(payload.probabilities.away, 50),
          confidence: payload.probabilities.confidence
        }
      : undefined
  };

  const result = await apiRequest<{ insight: AiMatchInsight }>("/matches/ai-insight", {
    method: "POST",
    body: JSON.stringify(normalizedPayload)
  });
  return result.insight;
};

export const fetchSportsNews = async (sport?: SportCatalogItem["key"], limit = 9) => {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  params.set("limit", String(limit));
  const suffix = params.size ? `?${params.toString()}` : "";

  try {
    const payload = await apiRequest<{ articles: NewsArticle[] }>(`/news${suffix}`);
    return payload.articles ?? [];
  } catch {
    try {
      const payload = await apiRequest<{ articles: NewsArticle[] }>(`/sports/news${suffix}`);
      return payload.articles ?? [];
    } catch {
      return [];
    }
  }
};
