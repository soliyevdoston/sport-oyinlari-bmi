export type SportKey = "football" | "basketball" | "tennis" | "mma" | "volleyball";

export type MatchLifecycle = "scheduled" | "live" | "finished" | "postponed" | "canceled";

export interface TeamLite {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface MatchLite {
  id: string;
  sport: SportKey;
  league: string;
  home: TeamLite;
  away: TeamLite;
  startTime: string;
  status: MatchLifecycle;
  score?: {
    home: number;
    away: number;
  };
}

export interface PredictionResult {
  matchId: string;
  winProbabilities: {
    home: number;
    draw?: number;
    away: number;
  };
  confidence: number;
  likelyScoreRange: string;
  keyReasons: string[];
  uncertainty: string[];
}

export interface ScreenshotAnalysisResult {
  detectedContent: string[];
  matchContext: string;
  keyObservations: string[];
  interpretation: string;
  uncertainty: string[];
  summary: string;
}
