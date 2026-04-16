export type SportKey = "football" | "basketball" | "tennis" | "mma" | "volleyball";

export interface SportCatalogItem {
  key: SportKey;
  label: string;
  blurb: string;
  logoUrl: string;
  endpoints: string[];
}

export interface NormalizedMatch {
  id: string;
  sport: SportKey;
  league: string;
  home: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  away: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  startTime: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "canceled";
  score?: {
    home: number;
    away: number;
  };
}

export interface NormalizedSummary {
  id: string;
  sport: SportKey;
  headline: string;
  homeStats: Array<{ name: string; value: string }>;
  awayStats: Array<{ name: string; value: string }>;
  notes: string[];
}

export interface NormalizedNewsArticle {
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

const SPORT_CATALOG: SportCatalogItem[] = [
  {
    key: "football",
    label: "Football",
    blurb: "Top-flight fixtures including Uzbekistan league coverage and sharp match context.",
    logoUrl: "",
    endpoints: ["soccer/eng.1", "soccer/esp.1", "soccer/ger.1", "soccer/ita.1", "soccer/fra.1", "soccer/uzb.1"]
  },
  {
    key: "basketball",
    label: "Basketball",
    blurb: "Possession flow and matchup-level scoreboard intelligence.",
    logoUrl: "",
    endpoints: ["basketball/nba", "basketball/wnba"]
  },
  {
    key: "tennis",
    label: "Tennis",
    blurb: "Tour event slate and scoreboard snapshots.",
    logoUrl: "",
    endpoints: ["tennis/atp", "tennis/wta"]
  },
  {
    key: "mma",
    label: "MMA/UFC",
    blurb: "Fight cards with competitor-level context.",
    logoUrl: "",
    endpoints: ["mma/ufc", "mma/pfl"]
  },
  {
    key: "volleyball",
    label: "Volleyball",
    blurb: "Featured matchups with visual team identity.",
    logoUrl: "",
    endpoints: ["volleyball/mens-college-volleyball"]
  }
];

const TTL_MS = 1000 * 60 * 3;
const cache = new Map<string, { expiresAt: number; data: NormalizedMatch[] }>();
const newsCache = new Map<string, { expiresAt: number; data: NormalizedNewsArticle[] }>();
const newsDetailCache = new Map<string, { expiresAt: number; data: string }>();
const guardianNewsCache = new Map<string, { expiresAt: number; data: NormalizedNewsArticle[] }>();
const FETCH_TIMEOUT_MS = 7000;
const NEWS_TTL_MS = 1000 * 60 * 8;
const NEWS_DETAIL_TTL_MS = 1000 * 60 * 20;
const GUARDIAN_TTL_MS = 1000 * 60 * 12;
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY ?? "test";

const NEWS_ENDPOINTS: Record<SportKey, string[]> = {
  football: [
    "https://site.api.espn.com/apis/site/v2/sports/soccer/news",
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news",
    "https://site.api.espn.com/apis/site/v2/sports/soccer/uzb.1/news"
  ],
  basketball: [
    "https://site.api.espn.com/apis/site/v2/sports/basketball/news",
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news"
  ],
  tennis: [
    "https://site.api.espn.com/apis/site/v2/sports/tennis/news",
    "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/news"
  ],
  mma: [
    "https://site.api.espn.com/apis/site/v2/sports/mma/news",
    "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/news"
  ],
  volleyball: [
    "https://site.api.espn.com/apis/site/v2/sports/volleyball/news",
    "https://site.api.espn.com/apis/site/v2/sports/volleyball/mens-college-volleyball/news"
  ]
};

const fetchJsonWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as Record<string, any>;
  } finally {
    clearTimeout(timeout);
  }
};

const statusMap = (state?: string): NormalizedMatch["status"] => {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
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

const competitorLogo = (competitor: Record<string, any> | undefined, sportLogo: string) => {
  if (!competitor) return sportLogo;
  return (
    competitor.team?.logo ??
    competitor.team?.logos?.[0]?.href ??
    competitor.athlete?.flag?.href ??
    competitor.athlete?.headshot?.href ??
    sportLogo
  );
};

const splitVs = (eventName?: string) => {
  if (!eventName || !eventName.includes(" vs ")) {
    return null;
  }

  const [home, away] = eventName.split(" vs ");
  return {
    home,
    away
  };
};

const formatDateToken = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const scoreboardRange = (days: number) => {
  const from = new Date();
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + days);
  return `${formatDateToken(from)}-${formatDateToken(to)}`;
};

const normalizeEvent = (
  event: Record<string, any>,
  sport: SportCatalogItem,
  leagueNameFallback: string
): NormalizedMatch => {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  const homeCompetitor =
    competitors.find((c: Record<string, any>) => c.homeAway === "home") ?? competitors[0] ?? undefined;
  const awayCompetitor =
    competitors.find((c: Record<string, any>) => c.homeAway === "away") ?? competitors[1] ?? undefined;

  const parsedVs = splitVs(event.name);
  const homeName = competitorName(homeCompetitor, parsedVs?.home ?? `${sport.label} Home`);
  const awayName = competitorName(awayCompetitor, parsedVs?.away ?? `${sport.label} Away`);

  const homeScoreRaw = homeCompetitor?.score;
  const awayScoreRaw = awayCompetitor?.score;

  const homeScore = Number.parseInt(homeScoreRaw, 10);
  const awayScore = Number.parseInt(awayScoreRaw, 10);
  const scoreKnown = Number.isFinite(homeScore) && Number.isFinite(awayScore);

  return {
    id: String(event.id),
    sport: sport.key,
    league: event.league?.name ?? leagueNameFallback,
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
    score: scoreKnown
      ? {
          home: homeScore,
          away: awayScore
        }
      : undefined
  };
};

const fetchEndpointFeed = async (
  sport: SportCatalogItem,
  endpoint: string,
  days: number
): Promise<NormalizedMatch[]> => {
  const range = scoreboardRange(days);
  const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/scoreboard?dates=${range}`;
  const data = await fetchJsonWithTimeout(url);
  const leagueName = data.leagues?.[0]?.name ?? sport.label;

  return Array.isArray(data.events)
    ? data.events.map((event) => normalizeEvent(event, sport, leagueName))
    : [];
};

const uniqByMatchId = (rows: NormalizedMatch[]) => {
  const bucket = new Map<string, NormalizedMatch>();

  rows.forEach((row) => {
    bucket.set(`${row.sport}:${row.id}`, row);
  });

  return Array.from(bucket.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
};

const fetchSportFeed = async (sport: SportCatalogItem, days: number): Promise<NormalizedMatch[]> => {
  const cacheKey = `${sport.key}:${days}`;
  const current = cache.get(cacheKey);

  if (current && Date.now() < current.expiresAt) {
    return current.data;
  }

  const rows = await Promise.all(
    sport.endpoints.map(async (endpoint) => {
      try {
        return await fetchEndpointFeed(sport, endpoint, days);
      } catch {
        return [];
      }
    })
  );

  const normalized = uniqByMatchId(rows.flat());

  cache.set(cacheKey, {
    expiresAt: Date.now() + TTL_MS,
    data: normalized
  });

  return normalized;
};

const imageCandidate = (article: Record<string, any>) => {
  const image =
    article.images?.find((img: Record<string, any>) => typeof img?.url === "string")?.url ??
    article.images?.[0]?.url ??
    "";
  return String(image);
};

const descriptionCandidate = (article: Record<string, any>) =>
  String(
    article.description ??
      article.story ??
      article.headline ??
      "Sport olamidagi dolzarb yangiliklar va tahlillar."
  );

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const shortText = (value: string, max = 240) => {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}...`;
};

const normalizedArticleId = (article: Record<string, any>, sport: SportKey) =>
  String(article.id ?? `${sport}:${article.headline ?? article.link ?? Math.random().toString(36).slice(2)}`);

const normalizeNews = (sport: SportKey, article: Record<string, any>): NormalizedNewsArticle => {
  const url = String(
    article.links?.web?.href ??
      article.links?.mobile?.href ??
      article.link ??
      "https://www.espn.com/"
  );

  const baseContent = normalizeWhitespace(descriptionCandidate(article));
  return {
    id: normalizedArticleId(article, sport),
    sport,
    title: String(article.headline ?? "Yangilik"),
    description: shortText(baseContent),
    content: baseContent,
    imageUrl: imageCandidate(article),
    publishedAt: String(article.published ?? article.lastModified ?? new Date().toISOString()),
    source: String(article.source ?? "ESPN"),
    url
  };
};

const extractDeepText = (value: unknown, depth = 0): string[] => {
  if (depth > 5 || value == null) return [];

  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.slice(0, 24).flatMap((item) => extractDeepText(item, depth + 1));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: string[] = [];
    const importantKeys = ["story", "description", "body", "text", "content", "summary"];
    const containerKeys = ["article", "articles", "headline", "headlines", "items", "contents", "sections", "data"];

    importantKeys.forEach((key) => {
      if (typeof record[key] === "string") {
        out.push(...extractDeepText(record[key], depth + 1));
      }
    });

    containerKeys.forEach((key) => {
      if (record[key] != null) {
        out.push(...extractDeepText(record[key], depth + 1));
      }
    });

    if (!out.length) {
      Object.values(record)
        .slice(0, 16)
        .forEach((item) => {
          out.push(...extractDeepText(item, depth + 1));
        });
    }

    return out;
  }

  return [];
};

const bestTextCandidate = (rows: string[]) => {
  const filtered = rows
    .filter((item) => item.length >= 80 && item.length <= 12000)
    .filter((item) => !/^https?:\/\//i.test(item));
  if (!filtered.length) return "";
  return filtered.sort((a, b) => b.length - a.length)[0] ?? "";
};

const fetchDetailedArticleText = async (detailUrl: string): Promise<string> => {
  const current = newsDetailCache.get(detailUrl);
  if (current && Date.now() < current.expiresAt) {
    return current.data;
  }

  try {
    const detail = await fetchJsonWithTimeout(detailUrl);
    const text = bestTextCandidate(extractDeepText(detail));
    newsDetailCache.set(detailUrl, {
      expiresAt: Date.now() + NEWS_DETAIL_TTL_MS,
      data: text
    });
    return text;
  } catch {
    newsDetailCache.set(detailUrl, {
      expiresAt: Date.now() + NEWS_DETAIL_TTL_MS,
      data: ""
    });
    return "";
  }
};

const enrichNews = async (sport: SportKey, article: Record<string, any>): Promise<NormalizedNewsArticle> => {
  const normalized = normalizeNews(sport, article);
  const detailUrl = String(article.links?.api?.news?.href ?? "");
  if (!detailUrl) return normalized;

  const detailText = await fetchDetailedArticleText(detailUrl);
  if (!detailText) return normalized;

  return {
    ...normalized,
    description: shortText(detailText),
    content: detailText
  };
};

const uniqNews = (rows: NormalizedNewsArticle[]) => {
  const bucket = new Map<string, NormalizedNewsArticle>();
  rows.forEach((row) => {
    const key = row.url ? `url:${row.url}` : `${row.sport}:${row.id}`;
    const current = bucket.get(key);
    if (!current || row.content.length > current.content.length) {
      bucket.set(key, row);
    }
  });
  return Array.from(bucket.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
};

const fetchSportNews = async (sport: SportKey, limit: number): Promise<NormalizedNewsArticle[]> => {
  const cacheKey = `${sport}:${limit}`;
  const current = newsCache.get(cacheKey);
  if (current && Date.now() < current.expiresAt) {
    return current.data;
  }

  const endpoints = NEWS_ENDPOINTS[sport] ?? [];
  for (const url of endpoints) {
    try {
      const data = await fetchJsonWithTimeout(url);
      const articles = Array.isArray(data.articles) ? data.articles : [];
      if (!articles.length) continue;

      const enriched = await Promise.all(
        articles.slice(0, Math.max(limit * 2, 18)).map(async (article) => enrichNews(sport, article))
      );
      const normalized = uniqNews(enriched.filter((article) => article.title && article.url)).slice(0, limit);

      if (!normalized.length) continue;

      newsCache.set(cacheKey, {
        expiresAt: Date.now() + NEWS_TTL_MS,
        data: normalized
      });

      return normalized;
    } catch {
      continue;
    }
  }

  newsCache.set(cacheKey, {
    expiresAt: Date.now() + NEWS_TTL_MS,
    data: []
  });
  return [];
};

const guardianSportFromText = (rawText: string): SportKey => {
  const text = rawText.toLowerCase();
  if (/(nba|wnba|basketball|hoops|playoffs)/i.test(text)) return "basketball";
  if (/(tennis|wimbledon|atp|wta|grand slam|roland garros|us open|australian open)/i.test(text)) return "tennis";
  if (/(mma|ufc|octagon|fight night|welterweight|heavyweight|middleweight)/i.test(text)) return "mma";
  if (/(volleyball|fivb|volley)/i.test(text)) return "volleyball";
  return "football";
};

const fetchGuardianNews = async (limit: number, sportKey?: SportKey): Promise<NormalizedNewsArticle[]> => {
  const cacheKey = `${sportKey ?? "all"}:${limit}`;
  const current = guardianNewsCache.get(cacheKey);
  if (current && Date.now() < current.expiresAt) {
    return current.data;
  }

  const pageSize = Math.max(limit * 3, 24);
  const url =
    "https://content.guardianapis.com/search" +
    `?section=sport&page-size=${pageSize}` +
    "&show-fields=headline,trailText,bodyText,thumbnail,byline" +
    `&api-key=${encodeURIComponent(GUARDIAN_API_KEY)}`;

  try {
    const data = await fetchJsonWithTimeout(url);
    const results = Array.isArray(data.response?.results) ? data.response.results : [];
    const mapped = results
      .map((item: Record<string, any>) => {
        const title = String(item.fields?.headline ?? item.webTitle ?? "Sport news");
        const bodyText = normalizeWhitespace(
          String(item.fields?.bodyText ?? item.fields?.trailText ?? item.webTitle ?? "")
        );
        const inferredSport = guardianSportFromText(`${title} ${bodyText}`);
        return {
          id: `guardian:${String(item.id ?? item.webUrl ?? Math.random().toString(36).slice(2))}`,
          sport: inferredSport,
          title,
          description: shortText(String(item.fields?.trailText ?? bodyText ?? title)),
          content: bodyText || String(item.fields?.trailText ?? title),
          imageUrl: String(item.fields?.thumbnail ?? ""),
          publishedAt: String(item.webPublicationDate ?? new Date().toISOString()),
          source: "The Guardian",
          url: String(item.webUrl ?? "https://www.theguardian.com/sport")
        } as NormalizedNewsArticle;
      })
      .filter((item: NormalizedNewsArticle) => item.title && item.url && item.content);

    const filtered = sportKey ? mapped.filter((item: NormalizedNewsArticle) => item.sport === sportKey) : mapped;
    const normalized = uniqNews(filtered).slice(0, limit);
    guardianNewsCache.set(cacheKey, {
      expiresAt: Date.now() + GUARDIAN_TTL_MS,
      data: normalized
    });
    return normalized;
  } catch {
    guardianNewsCache.set(cacheKey, {
      expiresAt: Date.now() + GUARDIAN_TTL_MS,
      data: []
    });
    return [];
  }
};

export const espnProvider = {
  catalog: SPORT_CATALOG,
  getCatalog: () => SPORT_CATALOG,
  getFeedBySport: async (sportKey: SportKey, days = 14) => {
    const sport = SPORT_CATALOG.find((item) => item.key === sportKey);
    if (!sport) return [];

    return fetchSportFeed(sport, days);
  },
  getFeedAll: async (days = 14) => {
    const rows = await Promise.all(
      SPORT_CATALOG.map(async (sport) => {
        try {
          return await fetchSportFeed(sport, days);
        } catch {
          return [];
        }
      })
    );

    return uniqByMatchId(rows.flat());
  },
  getEventSummary: async (sportKey: SportKey, eventId: string): Promise<NormalizedSummary | null> => {
    const sport = SPORT_CATALOG.find((item) => item.key === sportKey);
    if (!sport) return null;

    for (const endpoint of sport.endpoints) {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/summary?event=${eventId}`;
      let data: Record<string, any>;
      try {
        data = await fetchJsonWithTimeout(url);
      } catch {
        continue;
      }
      const boxTeams = data.boxscore?.teams ?? [];
      const home = boxTeams.find((team: Record<string, any>) => team.homeAway === "home") ?? boxTeams[0];
      const away = boxTeams.find((team: Record<string, any>) => team.homeAway === "away") ?? boxTeams[1];

      const mapStats = (rows: Array<Record<string, any>> | undefined) =>
        (rows ?? [])
          .slice(0, 8)
          .map((item) => ({
            name: String(item.label ?? item.name ?? "Stat"),
            value: String(item.displayValue ?? item.value ?? "-")
          }));

      const notes = (data.injuries ?? [])
        .slice(0, 3)
        .map((item: Record<string, any>) => String(item.shortComment ?? item.text ?? ""));

      return {
        id: eventId,
        sport: sport.key,
        headline: String(data.header?.competitions?.[0]?.name ?? `${sport.label} summary`),
        homeStats: mapStats(home?.statistics),
        awayStats: mapStats(away?.statistics),
        notes
      };
    }

    return null;
  },
  getNews: async (sportKey?: SportKey, limit = 12): Promise<NormalizedNewsArticle[]> => {
    if (sportKey) {
      const [guardianRows, espnRows] = await Promise.all([
        fetchGuardianNews(limit, sportKey),
        fetchSportNews(sportKey, limit)
      ]);
      return uniqNews([...guardianRows, ...espnRows]).slice(0, limit);
    }

    const [guardianRows, groups] = await Promise.all([
      fetchGuardianNews(limit),
      Promise.all(
        (Object.keys(NEWS_ENDPOINTS) as SportKey[]).map(async (key) => {
          try {
            return await fetchSportNews(key, Math.max(4, Math.ceil(limit / 2)));
          } catch {
            return [];
          }
        })
      )
    ]);

    return uniqNews([...guardianRows, ...groups.flat()]).slice(0, limit);
  }
};
