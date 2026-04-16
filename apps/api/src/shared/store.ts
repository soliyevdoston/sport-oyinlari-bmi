import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export type UserRole = "USER" | "ADMIN";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "canceled";

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  favoriteSport?: string;
  createdAt: string;
}

export interface RefreshSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  revokedAt?: number;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "TRIALING" | "CANCELED";
  createdAt: string;
}

export interface AiUsageRecord {
  date: string;
  predictionRequests: number;
  screenshotRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
}

export interface AdminMatchRecord {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  startTime: string;
  status?: MatchStatus;
  score?: {
    home: number;
    away: number;
  };
  featured: boolean;
}

export interface TicketLinkRecord {
  id: string;
  matchId: string;
  providerName: string;
  url: string;
}

interface TeamSeed {
  name: string;
  logoUrl?: string;
}

interface MatchSeed {
  sport: string;
  league: string;
  teams: TeamSeed[];
  startOffsetHours: number;
}

const bySportScore = (sport: string, index: number) => {
  if (sport === "football") {
    return {
      home: (index * 3 + 1) % 4,
      away: (index * 2 + 2) % 4
    };
  }

  if (sport === "basketball") {
    return {
      home: 82 + ((index * 9) % 28),
      away: 80 + ((index * 7 + 3) % 29)
    };
  }

  if (sport === "tennis") {
    return {
      home: 2 + (index % 2),
      away: 1 + ((index + 1) % 2)
    };
  }

  if (sport === "mma") {
    return {
      home: 1,
      away: index % 2
    };
  }

  return {
    home: 2 + (index % 3),
    away: 1 + ((index + 2) % 3)
  };
};

const matchSeeds: MatchSeed[] = [
  {
    sport: "football",
    league: "Premier League",
    teams: [
      { name: "Arsenal", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
      { name: "Liverpool", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
      { name: "Man City", logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
      { name: "Chelsea", logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
      { name: "Tottenham", logoUrl: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
      { name: "Man United", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" }
    ],
    startOffsetHours: -40
  },
  {
    sport: "football",
    league: "UEFA Europa League",
    teams: [
      { name: "Roma" },
      { name: "Atalanta" },
      { name: "Villarreal" },
      { name: "Lazio" },
      { name: "Sevilla" },
      { name: "Benfica" }
    ],
    startOffsetHours: -30
  },
  {
    sport: "football",
    league: "Uzbekistan Super League",
    teams: [
      { name: "Pakhtakor" },
      { name: "Nasaf" },
      { name: "Bunyodkor" },
      { name: "Navbahor" },
      { name: "AGMK" },
      { name: "Neftchi Fargona" },
      { name: "Sogdiana" },
      { name: "Surkhon" }
    ],
    startOffsetHours: -34
  },
  {
    sport: "football",
    league: "Uzbekistan Cup",
    teams: [
      { name: "Pakhtakor" },
      { name: "Nasaf" },
      { name: "Bunyodkor" },
      { name: "Navbahor" },
      { name: "AGMK" },
      { name: "Neftchi Fargona" }
    ],
    startOffsetHours: -18
  },
  {
    sport: "basketball",
    league: "NBA",
    teams: [
      { name: "Celtics", logoUrl: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg" },
      { name: "Bucks", logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg" },
      { name: "Lakers", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg" },
      { name: "Nuggets", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg" },
      { name: "Warriors", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg" },
      { name: "Heat", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg" }
    ],
    startOffsetHours: -36
  },
  {
    sport: "tennis",
    league: "ATP / WTA Masters",
    teams: [
      { name: "Carlos Alcaraz" },
      { name: "Jannik Sinner" },
      { name: "Novak Djokovic" },
      { name: "Daniil Medvedev" },
      { name: "Iga Swiatek" },
      { name: "Aryna Sabalenka" }
    ],
    startOffsetHours: -28
  },
  {
    sport: "mma",
    league: "UFC Main Card",
    teams: [
      { name: "Islam Makhachev" },
      { name: "Charles Oliveira" },
      { name: "Alex Pereira" },
      { name: "Magomed Ankalaev" },
      { name: "Jon Jones" },
      { name: "Tom Aspinall" }
    ],
    startOffsetHours: -20
  },
  {
    sport: "volleyball",
    league: "Nations League",
    teams: [
      { name: "Italy" },
      { name: "Poland" },
      { name: "Brazil" },
      { name: "Japan" },
      { name: "USA" },
      { name: "France" }
    ],
    startOffsetHours: -24
  }
];

const buildAdminMatches = () => {
  const now = Date.now();
  let counter = 1;
  const rows: AdminMatchRecord[] = [];

  matchSeeds.forEach((seed, seedIndex) => {
    for (let i = 0; i < 12; i += 1) {
      const home = seed.teams[(i + seedIndex) % seed.teams.length];
      const away = seed.teams[(i + seedIndex + 2) % seed.teams.length];
      const startTime = new Date(now + (seed.startOffsetHours + i * 4) * 3600_000).toISOString();
      const startedAt = new Date(startTime).getTime();
      const isPast = startedAt < now - 90 * 60 * 1000;
      const isLive = startedAt <= now + 60 * 60 * 1000 && startedAt >= now - 90 * 60 * 1000;
      const status: MatchStatus = isPast ? "finished" : isLive ? "live" : "scheduled";

      rows.push({
        id: `m-${String(counter).padStart(3, "0")}`,
        sport: seed.sport,
        league: seed.league,
        homeTeam: home.name,
        awayTeam: away.name,
        homeLogoUrl: home.logoUrl,
        awayLogoUrl: away.logoUrl,
        startTime,
        status,
        score: status === "scheduled" ? undefined : bySportScore(seed.sport, i + seedIndex),
        featured: counter <= 18
      });

      counter += 1;
    }
  });

  return rows;
};

const now = new Date().toISOString();

const adminPasswordHash = bcrypt.hashSync("Admin123!", 10);
const userPasswordHash = bcrypt.hashSync("User123!", 10);

const adminId = randomUUID();
const userId = randomUUID();
const seededMatches = buildAdminMatches();

export const db = {
  users: [
    {
      id: adminId,
      fullName: "Marina Admin",
      email: "admin@scoreai.dev",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      favoriteSport: "football",
      createdAt: now
    },
    {
      id: userId,
      fullName: "Alex User",
      email: "user@scoreai.dev",
      passwordHash: userPasswordHash,
      role: "USER",
      favoriteSport: "basketball",
      createdAt: now
    }
  ] as UserRecord[],
  refreshSessions: [] as RefreshSession[],
  subscriptions: [
    {
      id: randomUUID(),
      userId: adminId,
      plan: "PREMIUM",
      status: "ACTIVE",
      createdAt: now
    },
    {
      id: randomUUID(),
      userId,
      plan: "FREE",
      status: "TRIALING",
      createdAt: now
    }
  ] as SubscriptionRecord[],
  aiUsage: [
    { date: "2026-04-10", predictionRequests: 132, screenshotRequests: 44, failedRequests: 5, avgLatencyMs: 820 },
    { date: "2026-04-11", predictionRequests: 149, screenshotRequests: 48, failedRequests: 3, avgLatencyMs: 786 },
    { date: "2026-04-12", predictionRequests: 161, screenshotRequests: 62, failedRequests: 7, avgLatencyMs: 874 },
    { date: "2026-04-13", predictionRequests: 177, screenshotRequests: 70, failedRequests: 4, avgLatencyMs: 751 },
    { date: "2026-04-14", predictionRequests: 189, screenshotRequests: 81, failedRequests: 6, avgLatencyMs: 803 },
    { date: "2026-04-15", predictionRequests: 210, screenshotRequests: 92, failedRequests: 8, avgLatencyMs: 899 }
  ] as AiUsageRecord[],
  matches: seededMatches,
  ticketLinks: [
    {
      id: randomUUID(),
      matchId: seededMatches[0]?.id ?? "m-001",
      providerName: "Ticketmaster",
      url: "https://www.ticketmaster.com"
    },
    {
      id: randomUUID(),
      matchId: seededMatches[0]?.id ?? "m-001",
      providerName: "StubHub",
      url: "https://www.stubhub.com"
    },
    {
      id: randomUUID(),
      matchId: seededMatches[5]?.id ?? "m-006",
      providerName: "Official League",
      url: "https://www.uefa.com"
    }
  ] as TicketLinkRecord[]
};

export const sanitizeUser = (user: UserRecord) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  favoriteSport: user.favoriteSport,
  createdAt: user.createdAt
});
