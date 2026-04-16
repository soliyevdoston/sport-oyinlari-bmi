import type { MatchLite, SportKey } from "@aetherscore/shared";

interface TeamSeed {
  id: string;
  name: string;
  logoUrl?: string;
}

interface LeagueSeed {
  sport: SportKey;
  league: string;
  teams: TeamSeed[];
  startOffsetHours: number;
}

const FOOTBALL_TEAMS: TeamSeed[] = [
  { id: "ars", name: "Arsenal", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  { id: "liv", name: "Liverpool", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
  { id: "mci", name: "Man City", logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
  { id: "che", name: "Chelsea", logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
  { id: "tot", name: "Tottenham", logoUrl: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
  { id: "mun", name: "Man United", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" },
  { id: "new", name: "Newcastle", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg" },
  { id: "avl", name: "Aston Villa", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg" }
];

const UZBEK_FOOTBALL_TEAMS: TeamSeed[] = [
  { id: "pak", name: "Pakhtakor" },
  { id: "nas", name: "Nasaf" },
  { id: "bun", name: "Bunyodkor" },
  { id: "nav", name: "Navbahor" },
  { id: "agm", name: "AGMK" },
  { id: "nef", name: "Neftchi Fargona" },
  { id: "sog", name: "Sogdiana" },
  { id: "sur", name: "Surkhon" }
];

const BASKETBALL_TEAMS: TeamSeed[] = [
  { id: "bos", name: "Celtics", logoUrl: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg" },
  { id: "mil", name: "Bucks", logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg" },
  { id: "lal", name: "Lakers", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg" },
  { id: "den", name: "Nuggets", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg" },
  { id: "gsw", name: "Warriors", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg" },
  { id: "mia", name: "Heat", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg" },
  { id: "phx", name: "Suns", logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg" },
  { id: "dal", name: "Mavericks", logoUrl: "https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg" }
];

const TENNIS_PLAYERS: TeamSeed[] = [
  { id: "alc", name: "Carlos Alcaraz" },
  { id: "sin", name: "Jannik Sinner" },
  { id: "djo", name: "Novak Djokovic" },
  { id: "med", name: "Daniil Medvedev" },
  { id: "rub", name: "Andrey Rublev" },
  { id: "zve", name: "Alexander Zverev" },
  { id: "iga", name: "Iga Swiatek" },
  { id: "sab", name: "Aryna Sabalenka" }
];

const MMA_FIGHTERS: TeamSeed[] = [
  { id: "isl", name: "Islam Makhachev" },
  { id: "cha", name: "Charles Oliveira" },
  { id: "leo", name: "Leon Edwards" },
  { id: "bel", name: "Belal Muhammad" },
  { id: "per", name: "Alex Pereira" },
  { id: "anc", name: "Magomed Ankalaev" },
  { id: "jon", name: "Jon Jones" },
  { id: "asp", name: "Tom Aspinall" }
];

const VOLLEYBALL_TEAMS: TeamSeed[] = [
  { id: "ita", name: "Italy" },
  { id: "pol", name: "Poland" },
  { id: "bra", name: "Brazil" },
  { id: "jpn", name: "Japan" },
  { id: "usa", name: "USA" },
  { id: "fra", name: "France" },
  { id: "slo", name: "Slovenia" },
  { id: "arg", name: "Argentina" }
];

const LEAGUES: LeagueSeed[] = [
  { sport: "football", league: "Premier League", teams: FOOTBALL_TEAMS, startOffsetHours: -42 },
  { sport: "football", league: "UEFA Europa League", teams: FOOTBALL_TEAMS.slice(0, 6), startOffsetHours: -28 },
  { sport: "football", league: "Uzbekistan Super League", teams: UZBEK_FOOTBALL_TEAMS, startOffsetHours: -30 },
  { sport: "football", league: "Uzbekistan Cup", teams: UZBEK_FOOTBALL_TEAMS.slice(0, 6), startOffsetHours: -16 },
  { sport: "basketball", league: "NBA", teams: BASKETBALL_TEAMS, startOffsetHours: -36 },
  { sport: "tennis", league: "ATP / WTA Masters", teams: TENNIS_PLAYERS, startOffsetHours: -26 },
  { sport: "mma", league: "UFC Main Card", teams: MMA_FIGHTERS, startOffsetHours: -20 },
  { sport: "volleyball", league: "Nations League", teams: VOLLEYBALL_TEAMS, startOffsetHours: -24 }
];

const bySportScore = (sport: SportKey, index: number) => {
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

const makeMatches = () => {
  const rows: MatchLite[] = [];
  const now = Date.now();

  LEAGUES.forEach((leagueSeed, leagueIndex) => {
    for (let i = 0; i < 12; i += 1) {
      const home = leagueSeed.teams[(i + leagueIndex) % leagueSeed.teams.length];
      const away = leagueSeed.teams[(i + leagueIndex + 3) % leagueSeed.teams.length];
      const kickoff = new Date(now + (leagueSeed.startOffsetHours + i * 4) * 3600_000);
      const isPast = kickoff.getTime() < now - 90 * 60 * 1000;
      const isLive = kickoff.getTime() <= now + 60 * 60 * 1000 && kickoff.getTime() >= now - 90 * 60 * 1000;

      const status: MatchLite["status"] = isPast ? "finished" : isLive ? "live" : "scheduled";
      const score = status === "scheduled" ? undefined : bySportScore(leagueSeed.sport, i + leagueIndex);

      rows.push({
        id: `${leagueSeed.sport}-${leagueIndex + 1}-${String(i + 1).padStart(2, "0")}`,
        sport: leagueSeed.sport,
        league: leagueSeed.league,
        home: {
          id: `${home.id}-${leagueIndex}-${i}`,
          name: home.name,
          logoUrl: home.logoUrl
        },
        away: {
          id: `${away.id}-${leagueIndex}-${i}`,
          name: away.name,
          logoUrl: away.logoUrl
        },
        startTime: kickoff.toISOString(),
        status,
        score
      });
    }
  });

  return rows.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const allMockMatches = makeMatches();

export const featuredMatches: MatchLite[] = allMockMatches
  .filter((row) => row.status === "live" || row.status === "scheduled")
  .slice(0, 24);

export const sports: Array<{ key: SportKey; label: string; blurb: string }> = [
  { key: "football", label: "Futbol", blurb: "xG, forma va taktika o'zgarishlari bir joyda." },
  { key: "basketball", label: "Basketbol", blurb: "Tempo, quarter dinamikasi va samaradorlik." },
  { key: "tennis", label: "Tennis", blurb: "Serve bosimi va break-point aniqligi." },
  { key: "mma", label: "MMA/UFC", blurb: "Uzarish, zarba hajmi va grappling nazorati." },
  { key: "volleyball", label: "Voleybol", blurb: "Rotatsiya barqarorligi va hujum samarasi." }
];

export const momentumData = [
  { minute: "15'", home: 42, away: 58 },
  { minute: "30'", home: 51, away: 49 },
  { minute: "45'", home: 63, away: 37 },
  { minute: "60'", home: 59, away: 41 },
  { minute: "75'", home: 54, away: 46 },
  { minute: "90'", home: 56, away: 44 }
];

export const pricing = [
  {
    name: "Free",
    price: "$0",
    note: "Tezkor kuzatish uchun",
    features: ["Live score (cheklangan)", "Asosiy statistika", "5 tagacha saqlangan match"]
  },
  {
    name: "Pro",
    price: "$12/oy",
    note: "Doimiy analystlar uchun",
    features: ["AI match prediction", "Kengaytirilgan statistika", "Screenshot analysis limiti"]
  },
  {
    name: "Premium",
    price: "$29/oy",
    note: "Power userlar uchun",
    features: ["Ustuvor AI insight", "To'liq history", "Premium personalizatsiya"]
  }
];

export const sportByKey = Object.fromEntries(sports.map((sport) => [sport.key, sport])) as Record<
  SportKey,
  (typeof sports)[number]
>;
