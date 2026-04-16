import type { MatchLite, SportKey } from "@aetherscore/shared";
import { allMockMatches } from "@/data/mock";

interface DensityOptions {
  sport?: SportKey;
  minimum?: number;
  limit?: number;
  alwaysMergeFallback?: boolean;
  pinLeagueKeywords?: string[];
}

const matchKey = (match: MatchLite) =>
  `${match.sport}:${match.id}:${match.home.name}:${match.away.name}:${match.startTime}`;

const byStart = (a: MatchLite, b: MatchLite) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

export const ensureDenseFeed = (input: MatchLite[], options: DensityOptions = {}) => {
  const minimum = options.minimum ?? 30;
  const source = options.sport ? input.filter((row) => row.sport === options.sport) : input;

  const fallback = options.sport
    ? allMockMatches.filter((row) => row.sport === options.sport)
    : allMockMatches;

  const shouldMerge = (options.alwaysMergeFallback ?? true) || source.length < minimum;
  const candidates = shouldMerge ? [...source, ...fallback] : source;

  const unique = candidates.reduce<Map<string, MatchLite>>((bucket, row) => {
    bucket.set(matchKey(row), row);
    return bucket;
  }, new Map());

  const rows = Array.from(unique.values()).sort(byStart);
  if (!options.limit) return rows;

  if (options.pinLeagueKeywords?.length) {
    const pinned = rows.filter((row) =>
      options.pinLeagueKeywords!.some((keyword) => row.league.toLowerCase().includes(keyword.toLowerCase()))
    );
    const others = rows.filter(
      (row) => !options.pinLeagueKeywords!.some((keyword) => row.league.toLowerCase().includes(keyword.toLowerCase()))
    );
    return [...pinned, ...others].slice(0, options.limit);
  }

  return rows.slice(0, options.limit);
};
