import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { MatchLite } from "@aetherscore/shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { SectionTitle } from "@/components/ui/section-title";
import { featuredMatches } from "@/data/mock";
import { estimateWinProbability } from "@/lib/analytics";
import { ensureDenseFeed } from "@/lib/feed-density";
import { fetchSportsFeed, type SportCatalogItem } from "@/lib/sports-api";

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

export default function SportDetailPage() {
  const { sportSlug } = useParams();
  const [items, setItems] = useState<MatchLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sportSlug) return;
    const sport = sportSlug as SportCatalogItem["key"];

    fetchSportsFeed(sport, { days: 35, limit: 600 })
      .then((rows) => {
        const dense = ensureDenseFeed(rows, {
          sport,
          minimum: 24,
          limit: 240,
          pinLeagueKeywords:
            sport === "football" ? ["uzbekistan", "uzbekiston", "o'zbekiston", "o‘zbekiston"] : undefined
        });
        if (!dense.length) {
          setItems(featuredMatches.filter((m) => m.sport === sport));
          return;
        }
        setItems(dense);
      })
      .catch(() => setItems(featuredMatches.filter((m) => m.sport === sport)))
      .finally(() => setLoading(false));
  }, [sportSlug]);

  const byLeague = useMemo(
    () =>
      items.reduce<Record<string, MatchLite[]>>((bucket, row) => {
        if (!bucket[row.league]) bucket[row.league] = [];
        bucket[row.league].push(row);
        return bucket;
      }, {}),
    [items]
  );

  const leagueEntries = Object.entries(byLeague).sort((a, b) => b[1].length - a[1].length);
  const liveCount = items.filter((x) => x.status === "live").length;
  const scheduledCount = items.filter((x) => x.status === "scheduled").length;

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Sport Hub"
        title={`${sportSlug?.toUpperCase() ?? "SPORT"} match center`}
        subtitle="Sport ichidagi live, upcoming, AI ehtimollik va liga kesimidagi to'liq jadval."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Jami event</p>
          <p className="mt-2 text-3xl font-bold text-surface-900">{items.length}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Live</p>
          <p className="mt-2 text-3xl font-bold text-surface-900">{liveCount}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Kutilmoqda</p>
          <p className="mt-2 text-3xl font-bold text-surface-900">{scheduledCount}</p>
        </Card>
      </div>

      {loading ? <p className="mt-6 text-sm text-surface-600">Yuklanmoqda...</p> : null}

      <div className="mt-6 space-y-4">
        {leagueEntries.length ? (
          leagueEntries.map(([league, leagueRows]) => (
            <Card key={league} elevated className="overflow-x-auto">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-heading text-3xl font-semibold text-surface-900">{league}</p>
                <p className="text-xs text-surface-500">{leagueRows.length} ta event</p>
              </div>
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
                    <th className="px-2 py-3">Match</th>
                    <th className="px-2 py-3">Vaqt</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Score</th>
                    <th className="px-2 py-3">AI</th>
                    <th className="px-2 py-3">Ochish</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueRows.map((match) => {
                    const prediction = estimateWinProbability(match, items);
                    return (
                      <tr key={`${match.sport}-${match.id}`} className="border-b border-surface-100">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <Logo src={match.home.logoUrl} name={match.home.name} size="sm" />
                            <p className="font-semibold text-surface-800">
                              {match.home.name} vs {match.away.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-surface-600">{formatWhen(match.startTime)}</td>
                        <td className="px-2 py-3">
                          <Badge tone={statusTone[match.status]}>{statusLabel[match.status]}</Badge>
                        </td>
                        <td className="px-2 py-3 font-semibold text-surface-700">
                          {match.score ? `${match.score.home}-${match.score.away}` : "-"}
                        </td>
                        <td className="px-2 py-3 text-xs text-surface-600">
                          {prediction.home}% / {prediction.away}%
                        </td>
                        <td className="px-2 py-3">
                          <Link
                            to={`/matches/${match.id}?sport=${match.sport}`}
                            className="font-semibold text-accent-700 hover:text-accent-800"
                          >
                            Tafsilot
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ))
        ) : (
          !loading && <p className="text-sm text-surface-600">Hozircha match topilmadi.</p>
        )}
      </div>
    </section>
  );
}
