import type { MatchLite } from "@aetherscore/shared";

export interface TeamHistoryItem {
  matchId: string;
  opponent: string;
  scored: number;
  conceded: number;
  result: "W" | "D" | "L";
  date: string;
}

export interface WinProbability {
  home: number;
  draw: number;
  away: number;
  confidence: "Past" | "O'rtacha" | "Yuqori";
  reasons: string[];
}

const isFinishedWithScore = (match: MatchLite) =>
  match.status === "finished" && typeof match.score?.home === "number" && typeof match.score?.away === "number";

const teamHistory = (teamName: string, matches: MatchLite[], limit = 5): TeamHistoryItem[] => {
  const rows = matches
    .filter(isFinishedWithScore)
    .filter((match) => match.home.name === teamName || match.away.name === teamName)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit)
    .map((match) => {
      const isHome = match.home.name === teamName;
      const scored = isHome ? match.score!.home : match.score!.away;
      const conceded = isHome ? match.score!.away : match.score!.home;
      const opponent = isHome ? match.away.name : match.home.name;
      const result: TeamHistoryItem["result"] = scored > conceded ? "W" : scored === conceded ? "D" : "L";

      return {
        matchId: match.id,
        opponent,
        scored,
        conceded,
        result,
        date: match.startTime
      };
    });

  return rows;
};

const teamStrength = (teamName: string, matches: MatchLite[]) => {
  const history = teamHistory(teamName, matches, 10);
  if (!history.length) return 1;

  const wins = history.filter((x) => x.result === "W").length;
  const draws = history.filter((x) => x.result === "D").length;
  const losses = history.filter((x) => x.result === "L").length;
  const goalsFor = history.reduce((acc, x) => acc + x.scored, 0);
  const goalsAgainst = history.reduce((acc, x) => acc + x.conceded, 0);
  const gd = goalsFor - goalsAgainst;

  return Math.max(0.5, 1 + wins * 0.34 + draws * 0.16 - losses * 0.08 + gd * 0.03);
};

export const estimateWinProbability = (match: MatchLite, matches: MatchLite[]): WinProbability => {
  const homeStrength = teamStrength(match.home.name, matches);
  const awayStrength = teamStrength(match.away.name, matches);

  const total = homeStrength + awayStrength;
  const rawHome = homeStrength / total;
  const rawAway = awayStrength / total;

  const drawBase = match.sport === "football" ? 0.2 : 0.08;
  const home = Math.max(0.08, rawHome * (1 - drawBase));
  const away = Math.max(0.08, rawAway * (1 - drawBase));
  const draw = Math.max(0.04, 1 - (home + away));

  const normalizedSum = home + draw + away;
  const homePct = Math.round((home / normalizedSum) * 100);
  const drawPct = Math.round((draw / normalizedSum) * 100);
  const awayPct = Math.max(0, 100 - homePct - drawPct);

  const gap = Math.abs(homePct - awayPct);
  const confidence: WinProbability["confidence"] = gap > 20 ? "Yuqori" : gap > 10 ? "O'rtacha" : "Past";

  const reasons = [
    `${match.home.name} form ko'rsatkichi: ${homeStrength.toFixed(2)}`,
    `${match.away.name} form ko'rsatkichi: ${awayStrength.toFixed(2)}`,
    match.sport === "football"
      ? "Footballda durang ehtimoli alohida inobatga olindi"
      : "Bu sportda durang ehtimoli pasaytirilgan"
  ];

  return {
    home: homePct,
    draw: drawPct,
    away: awayPct,
    confidence,
    reasons
  };
};

export const getTeamHistory = teamHistory;
