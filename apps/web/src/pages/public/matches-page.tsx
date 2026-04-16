import { useEffect, useMemo, useState } from "react";
import type { MatchLite, SportKey } from "@aetherscore/shared";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { SectionTitle } from "@/components/ui/section-title";
import { SportIcon } from "@/components/ui/sport-icon";
import { allMockMatches } from "@/data/mock";
import { estimateWinProbability } from "@/lib/analytics";
import { ensureDenseFeed } from "@/lib/feed-density";
import { fetchSportsFeed } from "@/lib/sports-api";

const sportName: Record<SportKey, string> = {
  football: "Futbol",
  basketball: "Basketbol",
  tennis: "Tennis",
  mma: "MMA/UFC",
  volleyball: "Voleybol"
};

const statusTone: Record<MatchLite["status"], "accent" | "success" | "muted"> = {
  live: "success",
  scheduled: "accent",
  finished: "muted",
  canceled: "muted",
  postponed: "muted"
};

const statusLabel: Record<MatchLite["status"], string> = {
  live: "Live",
  scheduled: "Kutilmoqda",
  finished: "Yakunlangan",
  canceled: "Bekor qilingan",
  postponed: "Kechiktirilgan"
};

const formatWhen = (value: string) => {
  const dt = new Date(value);
  return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const decimalOdds = (p: number) => (p > 0 ? (100 / p).toFixed(2) : "-");
const isUzbekLeague = (league: string) => /uzbekistan|uzbekiston|o'zbekiston|o‘zbekiston/i.test(league);

export default function MatchesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<MatchLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState<SportKey | "all">("all");
  const [regionFilter, setRegionFilter] = useState<"all" | "uzbekistan">("all");
  const [showPrices, setShowPrices] = useState(false);

  useEffect(() => {
    fetchSportsFeed(undefined, { days: 30, limit: 1000 })
      .then((rows) =>
        setMatches(
          ensureDenseFeed(rows, {
            minimum: 90,
            limit: 1000,
            pinLeagueKeywords: ["uzbekistan", "uzbekiston", "o'zbekiston", "o‘zbekiston"]
          })
        )
      )
      .catch(() =>
        setMatches(
          ensureDenseFeed(allMockMatches, {
            minimum: 90,
            limit: 1000,
            pinLeagueKeywords: ["uzbekistan", "uzbekiston", "o'zbekiston", "o‘zbekiston"]
          })
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    return matches.filter((row) => {
      const bySport = activeSport === "all" ? true : row.sport === activeSport;
      const byRegion = regionFilter === "all" ? true : isUzbekLeague(row.league);
      const byQuery =
        !q ||
        [row.home.name, row.away.name, row.league, row.sport]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return bySport && byRegion && byQuery;
    });
  }, [activeSport, matches, query, regionFilter]);

  const grouped = useMemo(
    () =>
      rows.reduce<Record<string, MatchLite[]>>((bucket, row) => {
        if (!bucket[row.league]) bucket[row.league] = [];
        bucket[row.league].push(row);
        return bucket;
      }, {}),
    [rows]
  );

  const leagues = Object.entries(grouped).sort((a, b) => {
    const au = isUzbekLeague(a[0]) ? 1 : 0;
    const bu = isUzbekLeague(b[0]) ? 1 : 0;
    if (au !== bu) return bu - au;
    return b[1].length - a[1].length;
  });
  const liveCount = rows.filter((x) => x.status === "live").length;
  const upcomingCount = rows.filter((x) => x.status === "scheduled").length;
  const finishedCount = rows.filter((x) => x.status === "finished").length;
  const uzbekCount = matches.filter((row) => isUzbekLeague(row.league)).length;

  const sportCounts = useMemo(() => {
    const counts = {
      football: 0,
      basketball: 0,
      tennis: 0,
      mma: 0,
      volleyball: 0
    } as Record<SportKey, number>;
    rows.forEach((row) => {
      counts[row.sport] += 1;
    });
    return counts;
  }, [rows]);

  const topSignals = rows.slice(0, 14).map((match) => ({
    match,
    prediction: estimateWinProbability(match, rows)
  }));

  return (
    <section className="section-container py-6 sm:py-8">
      <SectionTitle
        eyebrow="Match Board"
        title="Live Fixtures & Results"
        subtitle="Katta jadval, liga bo'yicha guruhlash, AI ehtimol va narx ustunlari boshqaruvi bitta professional interfeysda."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="board-shell p-0">
          <div className="border-b border-surface-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-surface-500">Sport filtrlari</p>
            <p className="font-heading text-2xl font-bold text-surface-900">Categories</p>
          </div>
          <div className="space-y-1 p-2">
            <button
              onClick={() => setActiveSport("all")}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeSport === "all"
                  ? "border border-accent-400 bg-accent-100 text-accent-700"
                  : "border border-transparent text-surface-700 hover:border-surface-300 hover:bg-surface-50"
              }`}
            >
              Barchasi ({rows.length})
            </button>
            <button
              onClick={() => setRegionFilter((prev) => (prev === "uzbekistan" ? "all" : "uzbekistan"))}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                regionFilter === "uzbekistan"
                  ? "border border-accent-400 bg-accent-100 text-accent-700"
                  : "border border-transparent text-surface-700 hover:border-surface-300 hover:bg-surface-50"
              }`}
            >
              O'zbekiston ({uzbekCount})
            </button>
            {(Object.keys(sportName) as SportKey[]).map((sport) => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSport === sport
                    ? "border border-accent-400 bg-accent-100 text-accent-700"
                    : "border border-transparent text-surface-700 hover:border-surface-300 hover:bg-surface-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <SportIcon sport={sport} size="sm" className="h-6 w-6 border-surface-300 bg-surface-50 text-accent-200" />
                  {sportName[sport]}
                </span>
                <span className="text-xs text-surface-500">{sportCounts[sport]}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-surface-200 p-3 text-xs text-surface-500">
            <p>Live: {liveCount}</p>
            <p>Kutilmoqda: {upcomingCount}</p>
            <p>Yakunlangan: {finishedCount}</p>
            {regionFilter === "uzbekistan" ? <p>Filter: O'zbekiston</p> : null}
          </div>
        </aside>

        <div className="board-shell p-0">
          <div className="border-b border-surface-200 p-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <Input
                className="border-surface-300 bg-surface-50 text-surface-800 placeholder:text-surface-400"
                placeholder="Jamoa, liga, sport bo'yicha qidiring"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button variant="secondary" onClick={() => setShowPrices((v) => !v)}>
                {showPrices ? "Narxni yashirish" : "Narxni ko'rsatish"}
              </Button>
            </div>
          </div>

          {loading ? <p className="px-4 py-4 text-sm text-surface-500">Matchlar yuklanmoqda...</p> : null}
          {!loading && !rows.length ? <p className="px-4 py-4 text-sm text-surface-500">Match topilmadi.</p> : null}

          <div className="space-y-3 p-3 lg:hidden">
            {leagues.slice(0, 10).map(([league, leagueRows]) => (
              <div key={`mobile-${league}`} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-700">{league}</p>
                {leagueRows.slice(0, 8).map((match) => {
                  const pred = estimateWinProbability(match, rows);
                  return (
                    <Link
                      key={`mobile-${match.sport}-${match.id}`}
                      to={`/matches/${match.id}?sport=${match.sport}`}
                      className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-2">
                            <Logo
                              src={match.home.logoUrl}
                              name={match.home.name}
                              size="sm"
                              className="border-surface-300 bg-white text-surface-700"
                            />
                            <Logo
                              src={match.away.logoUrl}
                              name={match.away.name}
                              size="sm"
                              className="border-surface-300 bg-white text-surface-700"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-800">{match.home.name} vs {match.away.name}</p>
                            <p className="text-xs text-surface-500">{formatWhen(match.startTime)}</p>
                          </div>
                        </div>
                        <Badge tone={statusTone[match.status]}>{statusLabel[match.status]}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-surface-600">
                        <span>{pred.home}% / {pred.away}%</span>
                        {showPrices ? (
                          <span>
                            {decimalOdds(pred.home)} | {match.sport === "football" ? decimalOdds(pred.draw) : "-"} | {decimalOdds(pred.away)}
                          </span>
                        ) : (
                          <span>{pred.confidence}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="hidden max-h-[900px] overflow-auto lg:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 bg-surface-50 text-xs uppercase tracking-[0.08em] text-surface-500">
                <tr>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">League</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">AI</th>
                  {showPrices ? <th className="px-3 py-3 text-center">1</th> : null}
                  {showPrices ? <th className="px-3 py-3 text-center">X</th> : null}
                  {showPrices ? <th className="px-3 py-3 text-center">2</th> : null}
                </tr>
              </thead>
              {leagues.map(([league, leagueRows]) => (
                <tbody key={league}>
                  <tr className="bg-surface-50">
                    <td colSpan={showPrices ? 8 : 5} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-accent-200">
                      {league}
                    </td>
                  </tr>
                  {leagueRows.map((match) => {
                    const pred = estimateWinProbability(match, rows);
                    return (
                      <tr
                        key={`${match.sport}-${match.id}`}
                        role="link"
                        tabIndex={0}
                        onClick={() => navigate(`/matches/${match.id}?sport=${match.sport}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(`/matches/${match.id}?sport=${match.sport}`);
                          }
                        }}
                        className="cursor-pointer border-b border-surface-200 bg-white transition hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-2">
                              <Logo
                                src={match.home.logoUrl}
                                name={match.home.name}
                                size="sm"
                                className="border-surface-300 bg-surface-100 text-surface-700"
                              />
                              <Logo
                                src={match.away.logoUrl}
                                name={match.away.name}
                                size="sm"
                                className="border-surface-300 bg-surface-100 text-surface-700"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-surface-800">{match.home.name} vs {match.away.name}</p>
                              <p className="text-xs text-surface-500">
                                {match.score ? `${match.score.home}-${match.score.away}` : "Score pending"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-surface-700">{match.league}</td>
                        <td className="px-3 py-2.5 text-surface-500">{formatWhen(match.startTime)}</td>
                        <td className="px-3 py-2.5"><Badge tone={statusTone[match.status]}>{statusLabel[match.status]}</Badge></td>
                        <td className="px-3 py-2.5 text-xs text-surface-700">
                          {pred.home}% / {pred.away}%
                          <p className="text-surface-400">{pred.confidence}</p>
                        </td>
                        {showPrices ? (
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex min-w-14 justify-center rounded-md border border-surface-300 bg-surface-50 px-2 py-1 text-surface-800">
                              {decimalOdds(pred.home)}
                            </span>
                          </td>
                        ) : null}
                        {showPrices ? (
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex min-w-14 justify-center rounded-md border border-surface-300 bg-surface-50 px-2 py-1 text-surface-800">
                              {match.sport === "football" ? decimalOdds(pred.draw) : "-"}
                            </span>
                          </td>
                        ) : null}
                        {showPrices ? (
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex min-w-14 justify-center rounded-md border border-surface-300 bg-surface-50 px-2 py-1 text-surface-800">
                              {decimalOdds(pred.away)}
                            </span>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </div>

        <aside className="xl:col-span-2">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card tone="contrast" elevated>
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Quick Actions</p>
              <div className="mt-3 grid gap-2">
                <Button onClick={() => (window.location.href = "/upload-analysis")}>Screenshot AI</Button>
                <Button variant="secondary" onClick={() => (window.location.href = "/pricing")}>Tariflar</Button>
                <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>Dashboard</Button>
              </div>
            </Card>

            <Card elevated>
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Top AI signals</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {topSignals.slice(0, 9).map(({ match, prediction }) => (
                  <Link
                    key={`${match.sport}-${match.id}`}
                    to={`/matches/${match.id}?sport=${match.sport}`}
                    className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-accent-300"
                  >
                    <p className="text-sm font-semibold text-surface-800">{match.home.name} vs {match.away.name}</p>
                    <p className="text-xs text-surface-500">{match.league}</p>
                    <p className="text-xs text-surface-600">{prediction.home}% / {prediction.away}%</p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </section>
  );
}
