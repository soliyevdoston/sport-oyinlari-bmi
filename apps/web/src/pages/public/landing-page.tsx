import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MatchLite, SportKey } from "@aetherscore/shared";
import { allMockMatches, pricing, sports as fallbackSports } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { SectionTitle } from "@/components/ui/section-title";
import { SportIcon } from "@/components/ui/sport-icon";
import { estimateWinProbability } from "@/lib/analytics";
import { ensureDenseFeed } from "@/lib/feed-density";
import {
  fetchSportsCatalog,
  fetchSportsFeed,
  fetchSportsNews,
  type NewsArticle,
  type SportCatalogItem
} from "@/lib/sports-api";

const sportName: Record<SportKey, string> = {
  football: "Futbol",
  basketball: "Basketbol",
  tennis: "Tennis",
  mma: "MMA/UFC",
  volleyball: "Voleybol"
};

const statusLabel: Record<MatchLite["status"], string> = {
  live: "Live",
  scheduled: "Kutilmoqda",
  finished: "Yakunlangan",
  postponed: "Kechiktirilgan",
  canceled: "Bekor qilingan"
};

const statusTone: Record<MatchLite["status"], "accent" | "success" | "muted"> = {
  live: "success",
  scheduled: "accent",
  finished: "muted",
  postponed: "muted",
  canceled: "muted"
};

const formatWhen = (value: string) => {
  const dt = new Date(value);
  return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const footballHeroImages = [
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1800&q=80"
];

export default function LandingPage() {
  const [matches, setMatches] = useState<MatchLite[]>(allMockMatches);
  const [sports, setSports] = useState<SportCatalogItem[]>(
    fallbackSports.map((sport) => ({ ...sport, logoUrl: "", endpoints: [sport.key] }))
  );
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    fetchSportsFeed(undefined, { days: 35, limit: 1000 })
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
      );

    fetchSportsCatalog()
      .then((rows) => setSports(rows))
      .catch(() => undefined);

    fetchSportsNews(undefined, 9)
      .then((rows) => setNews(rows))
      .catch(() => setNews([]));
  }, []);

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [matches]
  );

  const rows = sortedMatches.slice(0, 36);
  const insightRows = sortedMatches.filter((x) => x.status !== "finished").slice(0, 5);
  const footballRows = sortedMatches.filter((x) => x.sport === "football");
  const heroMatches = (footballRows.length ? footballRows : sortedMatches).slice(0, 8);
  const uzbekRows = sortedMatches
    .filter((x) => /uzbekistan|uzbekiston|o'zbekiston|o‘zbekiston/i.test(x.league))
    .slice(0, 5);
  const liveCount = sortedMatches.filter((x) => x.status === "live").length;
  const upcomingCount = sortedMatches.filter((x) => x.status === "scheduled").length;
  const totalLeagues = new Set(sortedMatches.map((x) => x.league)).size;

  const sportCounts = useMemo(() => {
    const counts = {
      football: 0,
      basketball: 0,
      tennis: 0,
      mma: 0,
      volleyball: 0
    } as Record<SportKey, number>;
    sortedMatches.forEach((row) => {
      counts[row.sport] += 1;
    });
    return counts;
  }, [sortedMatches]);

  const heroSlides = useMemo(
    () =>
      heroMatches.map((match, index) => ({
        id: `${match.sport}-${match.id}`,
        imageUrl: footballHeroImages[index % footballHeroImages.length],
        match,
        prediction: estimateWinProbability(match, sortedMatches)
      })),
    [heroMatches, sortedMatches]
  );

  useEffect(() => {
    if (!heroSlides.length) return;
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroIndex >= heroSlides.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, heroSlides.length]);

  const activeHero = heroSlides[heroIndex];
  const heroPromoRows = (footballRows.length ? footballRows : sortedMatches).slice(0, 5);
  const mobileRows = rows.slice(0, 12);

  const formatNewsTime = (value: string) => {
    const time = new Date(value);
    if (Number.isNaN(time.getTime())) return "Yaqinda";
    return time.toLocaleString();
  };

  return (
    <section className="section-container py-5 sm:py-8">
      {activeHero ? (
        <section className="mb-5 overflow-hidden rounded-2xl border border-surface-200 bg-surface-900 text-white shadow-card">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_335px]">
            <div className="relative min-h-[310px] overflow-hidden sm:min-h-[360px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeHero.id}
                  src={activeHero.imageUrl}
                  alt={`${activeHero.match.home.name} vs ${activeHero.match.away.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-surface-900/92 via-surface-900/70 to-surface-900/35" />

              <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md border border-white/35 bg-white/15 px-2.5 py-1 uppercase tracking-[0.08em]">
                    Football Spotlight
                  </span>
                  <span className="rounded-md border border-white/25 bg-black/25 px-2.5 py-1">
                    {activeHero.match.league}
                  </span>
                  <span className="rounded-md border border-white/25 bg-black/25 px-2.5 py-1">
                    {statusLabel[activeHero.match.status]}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-white/75">Top match promo</p>
                  <h1 className="mt-2 font-heading text-3xl font-bold uppercase leading-[0.95] sm:text-5xl">
                    {activeHero.match.home.name}
                    <span className="mx-2 text-white/60">vs</span>
                    {activeHero.match.away.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
                    Asosiy futbol bo'limi: live holat, oldingi statistika, AI ehtimol va match markaziga tezkor kirish.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/30 px-3 py-2">
                      <Logo src={activeHero.match.home.logoUrl} name={activeHero.match.home.name} size="sm" className="border-white/35 bg-white/10 text-white" />
                      <span className="text-sm font-semibold">{activeHero.match.home.name}</span>
                    </div>
                    <div className="rounded-lg border border-white/30 bg-black/35 px-3 py-2 text-sm font-semibold">
                      {activeHero.match.score
                        ? `${activeHero.match.score.home} - ${activeHero.match.score.away}`
                        : formatWhen(activeHero.match.startTime)}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/30 px-3 py-2">
                      <Logo src={activeHero.match.away.logoUrl} name={activeHero.match.away.name} size="sm" className="border-white/35 bg-white/10 text-white" />
                      <span className="text-sm font-semibold">{activeHero.match.away.name}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/90">
                    <span className="rounded-md border border-white/25 bg-black/30 px-2.5 py-1">AI Home: {activeHero.prediction.home}%</span>
                    <span className="rounded-md border border-white/25 bg-black/30 px-2.5 py-1">AI Away: {activeHero.prediction.away}%</span>
                    <span className="rounded-md border border-white/25 bg-black/30 px-2.5 py-1">
                      Confidence: {activeHero.prediction.confidence}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          heroIndex === index ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Button
                      variant="secondary"
                      className="h-9 border-white/35 bg-white/15 px-3 text-white hover:bg-white/20 sm:h-10"
                      onClick={() => setHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                    >
                      Oldingi
                    </Button>
                    <Link to={`/matches/${activeHero.match.id}?sport=${activeHero.match.sport}`} className="flex-1 sm:flex-none">
                      <Button className="h-9 w-full bg-white px-4 text-surface-900 hover:bg-white/90 sm:h-10 sm:w-auto">Match markaziga o'tish</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-white/15 bg-surface-950/95 p-4 xl:border-l xl:border-t-0">
              <p className="text-xs uppercase tracking-[0.12em] text-white/70">Match reklama paneli</p>
              <p className="mt-1 font-heading text-2xl font-bold uppercase">Asosan futbol</p>
              <div className="mt-4 space-y-2.5">
                {heroPromoRows.map((row) => {
                  const pred = estimateWinProbability(row, sortedMatches);
                  return (
                    <Link
                      key={`${row.sport}-${row.id}`}
                      to={`/matches/${row.id}?sport=${row.sport}`}
                      className="block rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 transition hover:border-white/35 hover:bg-white/10"
                    >
                      <p className="text-sm font-semibold text-white">
                        {row.home.name} <span className="text-white/60">vs</span> {row.away.name}
                      </p>
                      <p className="text-xs text-white/70">{row.league}</p>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-white/80">
                        <span>{formatWhen(row.startTime)}</span>
                        <span>{pred.home}% / {pred.away}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      <div className="mb-5 board-shell p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            eyebrow="Live Command Center"
            title="Real-time Multi-Sport Intelligence"
            subtitle="UEFA fixtures strukturasidan ilhomlangan markaziy platforma: live eventlar, jamoa statistikasi, AI ehtimol va premium tahlil."
            className="max-w-4xl"
          />
          <div className="flex flex-wrap gap-2 text-xs text-surface-700">
            <span className="board-strip px-3 py-1">Live: {liveCount}</span>
            <span className="board-strip px-3 py-1">Upcoming: {upcomingCount}</span>
            <span className="board-strip px-3 py-1">Leagues: {totalLeagues}</span>
            <span className="board-strip px-3 py-1">Total: {rows.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[255px_minmax(0,1fr)_320px]">
        <aside className="board-shell p-0">
          <div className="border-b border-surface-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-surface-500">Sport katalog</p>
            <p className="font-heading text-xl font-bold text-surface-900 sm:text-2xl">Top Leagues</p>
          </div>
          <div className="space-y-1 p-2">
            {(Object.keys(sportName) as SportKey[]).map((sport) => (
              <Link
                key={sport}
                to={`/sports/${sport}`}
                className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm text-surface-700 transition hover:border-surface-300 hover:bg-surface-50 hover:text-surface-900"
              >
                <span className="flex items-center gap-2">
                  <SportIcon sport={sport} size="sm" className="h-6 w-6 border-surface-300 bg-surface-50 text-accent-200" />
                  {sportName[sport]}
                </span>
                <span className="text-xs text-surface-500">{sportCounts[sport]}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-surface-200 p-3 text-xs text-surface-500">
            <p>Uzbekistan Super League qo'shilgan</p>
            <p>Football feed: global + local seed</p>
          </div>
        </aside>

        <div className="board-shell p-0">
          <div className="border-b border-surface-200 p-3">
            <div className="flex flex-wrap gap-2">
              <span className="board-strip px-3 py-1 text-xs">Top Events</span>
              <span className="board-strip px-3 py-1 text-xs">Matches</span>
              <span className="board-strip px-3 py-1 text-xs">Recommended</span>
              <span className="board-strip px-3 py-1 text-xs">Nearby Schedule</span>
            </div>
            <Input className="mt-3 border-surface-300 bg-surface-50 text-surface-800 placeholder:text-surface-400" placeholder="Jamoa, liga, turnir bo'yicha qidiring" />
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {mobileRows.map((row) => {
              const pred = estimateWinProbability(row, sortedMatches);
              return (
                <Link
                  key={`${row.sport}-${row.id}`}
                  to={`/matches/${row.id}?sport=${row.sport}`}
                  className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Logo src={row.home.logoUrl} name={row.home.name} size="sm" className="border-surface-300 bg-white text-surface-700" />
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{row.home.name} vs {row.away.name}</p>
                        <p className="text-xs text-surface-500">{row.league}</p>
                      </div>
                    </div>
                    <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-surface-600">
                    <span>{formatWhen(row.startTime)}</span>
                    <span>AI: {pred.home}% / {pred.away}%</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="hidden max-h-[860px] overflow-auto md:block">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="sticky top-0 bg-surface-50 text-xs uppercase tracking-[0.08em] text-surface-500">
                <tr>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">League</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">AI Home</th>
                  <th className="px-3 py-3">AI Away</th>
                  <th className="px-3 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const pred = estimateWinProbability(row, sortedMatches);
                  return (
                    <tr key={`${row.sport}-${row.id}`} className="border-b border-surface-200 bg-white hover:bg-surface-100">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Logo src={row.home.logoUrl} name={row.home.name} size="sm" className="border-surface-300 bg-surface-100 text-surface-700" />
                          <div>
                            <p className="font-semibold text-surface-800">{row.home.name} vs {row.away.name}</p>
                            <p className="text-xs text-surface-500">{row.score ? `${row.score.home} - ${row.score.away}` : "Score pending"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-surface-700">{row.league}</td>
                      <td className="px-3 py-2.5 text-surface-500">{formatWhen(row.startTime)}</td>
                      <td className="px-3 py-2.5"><Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge></td>
                      <td className="px-3 py-2.5 text-surface-800">{pred.home}%</td>
                      <td className="px-3 py-2.5 text-surface-800">{pred.away}%</td>
                      <td className="px-3 py-2.5">
                        <Link to={`/matches/${row.id}?sport=${row.sport}`} className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-700 hover:text-accent-800">
                          Tafsilot
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <Card tone="contrast" elevated>
            <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Membership</p>
            <p className="mt-1 font-heading text-2xl font-bold text-surface-900 sm:text-3xl">Premium Access</p>
            <p className="mt-2 text-sm text-surface-700">
              AI prediction, screenshot tahlil va to'liq history uchun Pro yoki Premium rejani yoqing.
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => (window.location.href = "/register")}>Ro'yxatdan o'tish</Button>
              <Button variant="secondary" onClick={() => setShowPricing((v) => !v)}>
                {showPricing ? "Tarifni yopish" : "Tarifni ko'rish"}
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {showPricing ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="space-y-2">
                    {pricing.map((plan) => (
                      <div key={plan.name} className="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{plan.name}</p>
                        <p className="text-sm font-semibold text-surface-900">{plan.price}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.1em] text-surface-500">O'zbekiston o'yinlari</p>
            <div className="mt-3 space-y-2">
              {uzbekRows.length ? (
                uzbekRows.map((row) => (
                  <Link key={`${row.sport}-${row.id}`} to={`/matches/${row.id}?sport=${row.sport}`} className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-accent-300">
                    <p className="text-sm font-semibold text-surface-800">{row.home.name} vs {row.away.name}</p>
                    <p className="text-xs text-surface-500">{row.league}</p>
                    <p className="text-xs text-surface-600">{formatWhen(row.startTime)}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-surface-600">Hozircha O'zbekiston ligasi o'yini topilmadi.</p>
              )}
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.1em] text-surface-500">AI Focus</p>
            <div className="mt-3 space-y-2">
              {insightRows.map((match) => {
                const pred = estimateWinProbability(match, sortedMatches);
                return (
                  <Link key={`${match.sport}-${match.id}`} to={`/matches/${match.id}?sport=${match.sport}`} className="block rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 hover:border-accent-300">
                    <p className="text-sm font-semibold text-surface-800">{match.home.name} vs {match.away.name}</p>
                    <p className="text-xs text-surface-500">{match.league}</p>
                    <p className="text-xs text-surface-600">{pred.home}% / {pred.away}% ({pred.confidence})</p>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card elevated>
            <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Sports Portfolio</p>
            <div className="mt-3 grid gap-2">
              {sports.slice(0, 5).map((sport) => (
                <Link key={sport.key} to={`/sports/${sport.key}`} className="board-soft flex items-center justify-between px-3 py-2 hover:border-accent-200">
                  <span className="flex items-center gap-2">
                    <SportIcon sport={sport.key} size="sm" />
                    <span className="text-sm font-semibold text-surface-700">{sport.label}</span>
                  </span>
                  <span className="text-xs text-surface-500">Open</span>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle
            eyebrow="Sports News"
            title="Sport News"
            subtitle="Ochiq sport API manbalaridan real vaqtga yaqin yangiliklar va rasmli kartalar."
          />
          <Link to="/news" className="text-sm font-semibold text-accent-700 hover:text-accent-800">
            Barcha yangiliklar
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {news.map((article) => {
            const external = article.url.startsWith("http");
            return (
              <a
                key={article.id}
                href={article.url}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group block overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative h-44 w-full overflow-hidden bg-surface-100">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    onError={(event) => {
                      const target = event.currentTarget;
                      target.src = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-surface-500">
                    <span className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1">
                      {sportName[article.sport]}
                    </span>
                    <span>{article.source}</span>
                  </div>
                  <h3 className="line-clamp-2 font-heading text-xl font-bold uppercase leading-tight text-surface-900">
                    {article.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-surface-600">
                    {article.content || article.description}
                  </p>
                  <p className="text-xs text-surface-500">{formatNewsTime(article.publishedAt)}</p>
                </div>
              </a>
            );
          })}
        </div>
        {!news.length ? <p className="mt-3 text-sm text-surface-600">Yangiliklar hozircha mavjud emas.</p> : null}
      </section>
    </section>
  );
}
