import { useEffect, useMemo, useState } from "react";
import type { MatchLite } from "@aetherscore/shared";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { SectionTitle } from "@/components/ui/section-title";
import { allMockMatches } from "@/data/mock";
import { estimateWinProbability, getTeamHistory, type TeamHistoryItem } from "@/lib/analytics";
import { apiRequest } from "@/lib/api";
import { ensureDenseFeed } from "@/lib/feed-density";
import {
  fetchAiMatchInsight,
  fetchSportsEvent,
  fetchSportsFeed,
  fetchSportsSummary,
  type AiMatchInsight,
  type EventSummary,
  type SportCatalogItem
} from "@/lib/sports-api";

interface TicketLink {
  id: string;
  matchId: string;
  providerName: string;
  url: string;
}

const statusLabel: Record<MatchLite["status"], string> = {
  live: "Live",
  scheduled: "Kutilmoqda",
  finished: "Yakunlangan",
  postponed: "Kechiktirilgan",
  canceled: "Bekor qilingan"
};

const points = (rows: TeamHistoryItem[]) =>
  rows.reduce((acc, x) => {
    if (x.result === "W") return acc + 3;
    if (x.result === "D") return acc + 1;
    return acc;
  }, 0);

const winRate = (rows: TeamHistoryItem[]) => {
  if (!rows.length) return 0;
  const wins = rows.filter((row) => row.result === "W").length;
  return Math.round((wins / rows.length) * 100);
};

const numberFromStat = (value: string) => {
  const source = value.replace(",", ".");
  if (source.includes("%")) {
    const pct = Number.parseFloat(source);
    return Number.isFinite(pct) ? pct : 0;
  }
  if (source.includes("/")) {
    const left = Number.parseFloat(source.split("/")[0] ?? "0");
    return Number.isFinite(left) ? left : 0;
  }
  const match = source.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStatShare = (homeValue: number, awayValue: number) => {
  const total = Math.abs(homeValue) + Math.abs(awayValue);
  if (!total) return { home: 50, away: 50 };
  const home = Math.round((Math.abs(homeValue) / total) * 100);
  return { home, away: 100 - home };
};

const isFinishedWithScore = (row: MatchLite) =>
  row.status === "finished" && typeof row.score?.home === "number" && typeof row.score?.away === "number";

export default function MatchDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sportParam = searchParams.get("sport") as SportCatalogItem["key"] | null;
  const [remoteMatch, setRemoteMatch] = useState<MatchLite | null>(null);
  const [allMatches, setAllMatches] = useState<MatchLite[]>(allMockMatches);
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [ticketLinks, setTicketLinks] = useState<TicketLink[]>([]);
  const [aiInsight, setAiInsight] = useState<AiMatchInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hasRequestedAi, setHasRequestedAi] = useState(false);

  const match = useMemo(
    () =>
      remoteMatch ??
      allMatches.find((item) => item.id === id) ??
      allMockMatches.find((item) => item.id === id) ??
      allMockMatches[0],
    [allMatches, id, remoteMatch]
  );

  useEffect(() => {
    if (!id) return;
    fetchSportsEvent(id, sportParam ?? undefined)
      .then((row) => setRemoteMatch(row))
      .catch(() => setRemoteMatch(null));
  }, [id, sportParam]);

  useEffect(() => {
    fetchSportsFeed(sportParam ?? undefined, { days: 45, limit: 1000 })
      .then((rows) =>
        setAllMatches(
          ensureDenseFeed(rows, {
            sport: sportParam ?? undefined,
            minimum: 60,
            limit: 1000
          })
        )
      )
      .catch(() => setAllMatches(allMockMatches));
  }, [sportParam]);

  useEffect(() => {
    if (!id || !sportParam) return;
    fetchSportsSummary(id, sportParam)
      .then((row) => setSummary(row))
      .catch(() => setSummary(null));
  }, [id, sportParam]);

  useEffect(() => {
    apiRequest<{ ticketLinks: TicketLink[] }>(`/matches/${match.id}/tickets`)
      .then((payload) => setTicketLinks(payload.ticketLinks))
      .catch(() => setTicketLinks([]));
  }, [match.id]);

  const prediction = useMemo(() => estimateWinProbability(match, allMatches), [allMatches, match]);
  const homeHistory = useMemo(() => getTeamHistory(match.home.name, allMatches, 8), [allMatches, match.home.name]);
  const awayHistory = useMemo(() => getTeamHistory(match.away.name, allMatches, 8), [allMatches, match.away.name]);

  const homeScored = homeHistory.reduce((acc, row) => acc + row.scored, 0);
  const awayScored = awayHistory.reduce((acc, row) => acc + row.scored, 0);
  const homeConceded = homeHistory.reduce((acc, row) => acc + row.conceded, 0);
  const awayConceded = awayHistory.reduce((acc, row) => acc + row.conceded, 0);

  const relatedMatches = useMemo(
    () =>
      allMatches
        .filter((row) => row.league === match.league && row.id !== match.id)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 8),
    [allMatches, match.id, match.league]
  );

  const h2hMatches = useMemo(
    () =>
      allMatches
        .filter(isFinishedWithScore)
        .filter((row) => {
          const sameOrder = row.home.name === match.home.name && row.away.name === match.away.name;
          const reversed = row.home.name === match.away.name && row.away.name === match.home.name;
          return sameOrder || reversed;
        })
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 6),
    [allMatches, match.away.name, match.home.name]
  );

  const comparisonStats = useMemo(() => {
    if (summary?.homeStats?.length) {
      return summary.homeStats.slice(0, 10).map((stat, index) => {
        const awayValue = summary.awayStats[index]?.value ?? "0";
        const homeNumeric = numberFromStat(stat.value);
        const awayNumeric = numberFromStat(awayValue);
        const share = toStatShare(homeNumeric, awayNumeric);
        return {
          name: stat.name,
          homeDisplay: stat.value,
          awayDisplay: awayValue,
          homeShare: share.home,
          awayShare: share.away
        };
      });
    }

    const possessionHome = Math.max(34, Math.min(66, 50 + Math.round((prediction.home - prediction.away) / 2)));
    const possessionAway = 100 - possessionHome;
    const shotsHome = Math.max(5, Math.round(homeScored * 0.9 + 7));
    const shotsAway = Math.max(5, Math.round(awayScored * 0.9 + 7));

    return [
      {
        name: "Possession %",
        homeDisplay: `${possessionHome}%`,
        awayDisplay: `${possessionAway}%`,
        homeShare: possessionHome,
        awayShare: possessionAway
      },
      {
        name: "Total shots",
        homeDisplay: String(shotsHome),
        awayDisplay: String(shotsAway),
        homeShare: toStatShare(shotsHome, shotsAway).home,
        awayShare: toStatShare(shotsHome, shotsAway).away
      },
      {
        name: "Shots on target",
        homeDisplay: String(Math.max(2, Math.round(shotsHome * 0.42))),
        awayDisplay: String(Math.max(2, Math.round(shotsAway * 0.42))),
        homeShare: toStatShare(Math.round(shotsHome * 0.42), Math.round(shotsAway * 0.42)).home,
        awayShare: toStatShare(Math.round(shotsHome * 0.42), Math.round(shotsAway * 0.42)).away
      },
      {
        name: "Expected goals",
        homeDisplay: (homeScored / Math.max(homeHistory.length, 1)).toFixed(2),
        awayDisplay: (awayScored / Math.max(awayHistory.length, 1)).toFixed(2),
        homeShare: toStatShare(
          homeScored / Math.max(homeHistory.length, 1),
          awayScored / Math.max(awayHistory.length, 1)
        ).home,
        awayShare: toStatShare(
          homeScored / Math.max(homeHistory.length, 1),
          awayScored / Math.max(awayHistory.length, 1)
        ).away
      },
      {
        name: "Corners projection",
        homeDisplay: String(Math.max(2, Math.round(shotsHome * 0.45))),
        awayDisplay: String(Math.max(2, Math.round(shotsAway * 0.45))),
        homeShare: toStatShare(Math.round(shotsHome * 0.45), Math.round(shotsAway * 0.45)).home,
        awayShare: toStatShare(Math.round(shotsHome * 0.45), Math.round(shotsAway * 0.45)).away
      }
    ];
  }, [awayHistory.length, awayScored, homeHistory.length, homeScored, prediction, summary]);

  const momentumSeries = useMemo(() => {
    const checkpoints = [0, 15, 30, 45, 60, 75, 90];
    const bias = prediction.home - prediction.away;
    return checkpoints.map((minute, index) => {
      const phase = index / (checkpoints.length - 1);
      const drift = (phase - 0.5) * 10;
      const homeRaw = 50 + bias * 0.34 + drift + (homeScored - homeConceded) * 0.35;
      const home = Math.max(8, Math.min(92, Number(homeRaw.toFixed(1))));
      const away = Math.max(8, Math.min(92, Number((100 - home + (awayScored - awayConceded) * 0.15).toFixed(1))));
      return {
        minute: `${minute}'`,
        home,
        away
      };
    });
  }, [awayConceded, awayScored, homeConceded, homeScored, prediction.away, prediction.home]);

  const formChart = useMemo(() => {
    const maxRows = Math.max(homeHistory.length, awayHistory.length, 1);
    return Array.from({ length: maxRows }).map((_, index) => {
      const home = homeHistory[maxRows - 1 - index];
      const away = awayHistory[maxRows - 1 - index];
      return {
        turn: `M${index + 1}`,
        homeScored: home?.scored ?? 0,
        homeConceded: home?.conceded ?? 0,
        awayScored: away?.scored ?? 0,
        awayConceded: away?.conceded ?? 0
      };
    });
  }, [awayHistory, homeHistory]);

  const timeline = useMemo(() => {
    const rows: Array<{ minute: string; label: string }> = [];

    if (match.status === "live" || match.status === "finished") {
      rows.push({
        minute: "12'",
        label:
          prediction.home >= prediction.away
            ? `${match.home.name} press bosqichida yuqori zonada to'pni ko'proq qaytarayapti.`
            : `${match.away.name} tez transition hujumlar bilan xavf yaratayapti.`
      });
      rows.push({
        minute: "31'",
        label: `Markaziy zonada duel keskin: ${prediction.confidence} ishonchli model signal.`
      });
    }

    if (summary?.notes?.length) {
      summary.notes.slice(0, 3).forEach((note, index) => {
        rows.push({
          minute: `${55 + index * 10}'`,
          label: note
        });
      });
    }

    if (match.score) {
      rows.push({
        minute: match.status === "finished" ? "FT" : "Now",
        label: `Joriy hisob: ${match.home.name} ${match.score.home} - ${match.score.away} ${match.away.name}`
      });
    }

    return rows.slice(0, 6);
  }, [match.away.name, match.home.name, match.score, match.status, prediction, summary?.notes]);

  const loadAiInsight = () => {
    setHasRequestedAi(true);
    setAiLoading(true);
    setAiError("");
    fetchAiMatchInsight({
      match,
      summary,
      history: {
        homeForm: homeHistory.map((x) => x.result),
        awayForm: awayHistory.map((x) => x.result),
        homeScored,
        awayScored,
        homeConceded,
        awayConceded
      },
      probabilities: {
        home: prediction.home,
        draw: prediction.draw,
        away: prediction.away,
        confidence: prediction.confidence
      }
    })
      .then((insight) => setAiInsight(insight))
      .catch((err) => setAiError(err instanceof Error ? err.message : "AI insight yuklanmadi"))
      .finally(() => setAiLoading(false));
  };

  useEffect(() => {
    setAiInsight(null);
    setAiError("");
    setAiLoading(false);
    setHasRequestedAi(false);
  }, [match.id]);

  return (
    <section className="section-container py-6 sm:py-8">
      <SectionTitle
        eyebrow="Match Intelligence Center"
        title={`${match.home.name} vs ${match.away.name}`}
        subtitle="Match ichida ko'p qatlamli statistika, AI insight, form trend va live kontekst bitta premium analitik ko'rinishda."
      />

      <div className="mt-5 overflow-hidden rounded-2xl border border-surface-200 bg-surface-900 text-white shadow-card">
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-white/70">{match.league}</p>
            <p className="mt-1 text-sm text-white/80">{new Date(match.startTime).toLocaleString()}</p>
            <Badge tone={match.status === "live" ? "success" : "muted"} className="mt-3">
              {statusLabel[match.status]}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-white/65">Live Scoreboard</p>
            <p className="mt-1 font-heading text-4xl font-bold sm:text-5xl">
              {match.score ? `${match.score.home} - ${match.score.away}` : "vs"}
            </p>
            <p className="text-xs text-white/70">{match.sport.toUpperCase()} • AI confidence: {prediction.confidence}</p>
          </div>
          <div className="flex items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.1em] text-white/60">Home</p>
              <p className="text-lg font-semibold">{match.home.name}</p>
            </div>
            <Logo src={match.home.logoUrl} name={match.home.name} className="border-white/25 bg-white/10 text-white" />
            <Logo src={match.away.logoUrl} name={match.away.name} className="border-white/25 bg-white/10 text-white" />
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-white/60">Away</p>
              <p className="text-lg font-semibold">{match.away.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{match.home.name} Win %</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{prediction.home}%</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{match.away.name} Win %</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{prediction.away}%</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Home form points</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{points(homeHistory)}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Away form points</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{points(awayHistory)}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Home win rate</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{winRate(homeHistory)}%</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Away win rate</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 sm:text-3xl">{winRate(awayHistory)}%</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-4">
          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Advanced Stat Balance</p>
            <div className="mt-4 space-y-3">
              {comparisonStats.map((stat) => (
                <div key={stat.name}>
                  <div className="mb-1 flex items-center justify-between text-xs text-surface-600">
                    <span className="font-semibold text-surface-900">{stat.homeDisplay}</span>
                    <span className="uppercase tracking-[0.08em] text-surface-500">{stat.name}</span>
                    <span className="font-semibold text-surface-900">{stat.awayDisplay}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-200">
                    <div className="flex h-full">
                      <div className="bg-accent-500" style={{ width: `${stat.homeShare}%` }} />
                      <div className="bg-accent-200" style={{ width: `${stat.awayShare}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card elevated>
              <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Match Momentum</p>
              <div className="h-56 pt-2 sm:h-64 sm:pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={momentumSeries}>
                    <defs>
                      <linearGradient id="homeMomentum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3f74ff" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#3f74ff" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="awayMomentum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1f2f4a" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#1f2f4a" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="minute" tick={{ fontSize: 12 }} stroke="#486491" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#486491" domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="home" stroke="#3f74ff" fill="url(#homeMomentum)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="away" stroke="#1f2f4a" fill="url(#awayMomentum)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card elevated>
              <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Form Trend (Last Matches)</p>
              <div className="h-56 pt-2 sm:h-64 sm:pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d7dce7" />
                    <XAxis dataKey="turn" tick={{ fontSize: 12 }} stroke="#486491" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#486491" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="homeScored" name={`${match.home.name} scored`} stroke="#2f5dff" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="awayScored" name={`${match.away.name} scored`} stroke="#22a06b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="homeConceded" name={`${match.home.name} conceded`} stroke="#8aa2d6" strokeWidth={1.6} dot={false} />
                    <Line type="monotone" dataKey="awayConceded" name={`${match.away.name} conceded`} stroke="#7e8b5f" strokeWidth={1.6} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Game Timeline</p>
            <div className="mt-3 space-y-2">
              {timeline.length ? (
                timeline.map((item) => (
                  <div key={`${item.minute}-${item.label}`} className="grid grid-cols-[48px_1fr] items-start gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 sm:grid-cols-[56px_1fr] sm:gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-700">{item.minute}</span>
                    <p className="text-sm text-surface-700">{item.label}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-surface-600">Timeline uchun live data kutilmoqda.</p>
              )}
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Head-to-Head History</p>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-surface-50 text-xs uppercase tracking-[0.08em] text-surface-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Sana</th>
                    <th className="px-3 py-2 text-left">O'yin</th>
                    <th className="px-3 py-2 text-left">Hisob</th>
                    <th className="px-3 py-2 text-left">Liga</th>
                  </tr>
                </thead>
                <tbody>
                  {h2hMatches.length ? (
                    h2hMatches.map((row) => (
                      <tr key={`${row.id}-${row.startTime}`} className="border-b border-surface-200">
                        <td className="px-3 py-2">{new Date(row.startTime).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-semibold text-surface-800">
                          {row.home.name} vs {row.away.name}
                        </td>
                        <td className="px-3 py-2">{row.score ? `${row.score.home} - ${row.score.away}` : "-"}</td>
                        <td className="px-3 py-2 text-surface-600">{row.league}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-3 text-surface-600" colSpan={4}>
                        H2H tarix topilmadi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card
            elevated
            className="border-accent-300 bg-gradient-to-br from-white via-accent-50/70 to-white shadow-[0_16px_34px_-22px_rgba(37,99,235,0.45)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-accent-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                  Premium AI
                </span>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-surface-800">AI Insight Center</p>
                <p className="mt-1 text-xs text-surface-600">
                  AI faqat tugma bosilganda ishga tushadi. Token ulangan bo'lsa model javobi, aks holda fallback tahlil.
                </p>
              </div>
              <Button className="h-10 w-full sm:w-auto sm:px-4" onClick={loadAiInsight}>
                {hasRequestedAi ? "Qayta AI tahlil" : "AI tahlilni ishga tushirish"}
              </Button>
            </div>

            {aiLoading ? <p className="mt-3 text-sm text-surface-600">AI tahlil tayyorlanmoqda...</p> : null}
            {aiError ? <p className="mt-3 text-sm text-rose-600">{aiError}</p> : null}
            {!aiLoading && !aiInsight && !aiError ? (
              <div className="mt-3 rounded-lg border border-dashed border-accent-300 bg-white/80 px-3 py-2.5">
                <p className="text-sm font-semibold text-surface-800">AI tahlil ko'rish uchun tugmani bosing.</p>
                <p className="mt-1 text-xs text-surface-600">Ushbu bo'limda ehtimol, taktika, risk va yakuniy AI xulosa chiqadi.</p>
              </div>
            ) : null}

            {aiInsight ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-surface-300 bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-surface-500">
                    {aiInsight.source.toUpperCase()} • {aiInsight.model}
                  </p>
                  <p className="mt-1 text-base font-semibold text-surface-900">{aiInsight.headline}</p>
                  <p className="mt-2 text-sm text-surface-700">{aiInsight.finalSummary}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border border-surface-300 bg-surface-50 px-2 py-1">{aiInsight.confidenceLabel}</span>
                    <span className="rounded-md border border-surface-300 bg-surface-50 px-2 py-1">
                      Score: {aiInsight.predictedScoreRange}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Taktik ko'rinish</p>
                  <p className="mt-1 text-sm text-surface-700">{aiInsight.tacticalView}</p>
                </div>

                <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Forma narrativi</p>
                  <p className="mt-1 text-sm text-surface-700">{aiInsight.formNarrative}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Asosiy faktorlar</p>
                  <ul className="mt-2 space-y-1 text-sm text-surface-700">
                    {aiInsight.keyFactors.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Risklar</p>
                  <ul className="mt-2 space-y-1 text-sm text-surface-700">
                    {aiInsight.riskNotes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Ticket providers</p>
            <div className="mt-3 space-y-2">
              {ticketLinks.length ? (
                ticketLinks.map((ticket) => (
                  <Button
                    key={ticket.id}
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => window.open(ticket.url, "_blank", "noopener,noreferrer")}
                  >
                    {ticket.providerName}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-surface-500">Bu event uchun ticket provider topilmadi.</p>
              )}
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Recent Form Snapshot</p>
            <div className="mt-3 grid gap-3">
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{match.home.name}</p>
                <p className="mt-1 text-sm text-surface-700">Forma: {homeHistory.map((x) => x.result).join("-") || "-"}</p>
                <p className="text-sm text-surface-700">Gol: {homeScored} / O'tkazilgan: {homeConceded}</p>
              </div>
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{match.away.name}</p>
                <p className="mt-1 text-sm text-surface-700">Forma: {awayHistory.map((x) => x.result).join("-") || "-"}</p>
                <p className="text-sm text-surface-700">Gol: {awayScored} / O'tkazilgan: {awayConceded}</p>
              </div>
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Related matches</p>
            <div className="mt-3 space-y-2">
              {relatedMatches.length ? (
                relatedMatches.map((row) => (
                  <Link
                    key={`${row.id}-${row.startTime}`}
                    to={`/matches/${row.id}?sport=${row.sport}`}
                    className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-accent-300"
                  >
                    <p className="text-sm font-semibold text-surface-800">
                      {row.home.name} vs {row.away.name}
                    </p>
                    <p className="text-xs text-surface-500">{new Date(row.startTime).toLocaleString()}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-surface-600">Related match topilmadi.</p>
              )}
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Screenshot AI</p>
            <p className="mt-2 text-sm text-surface-700">
              Lineup, scoreboard yoki stat panel yuklang va match bilan bog'langan AI interpretatsiya oling.
            </p>
            <Button className="mt-3 w-full" onClick={() => (window.location.href = "/upload-analysis")}>
              Screenshot tahlil
            </Button>
          </Card>
        </aside>
      </div>

      <div className="mt-4">
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.08em] text-surface-500">Scoring Distribution</p>
          <div className="h-60 pt-2 sm:h-72 sm:pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: match.home.name, scored: homeScored, conceded: homeConceded },
                  { name: match.away.name, scored: awayScored, conceded: awayConceded }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dce7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#486491" />
                <YAxis tick={{ fontSize: 12 }} stroke="#486491" />
                <Tooltip />
                <Legend />
                <Bar dataKey="scored" fill="#3f74ff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="conceded" fill="#9ab1da" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
}
