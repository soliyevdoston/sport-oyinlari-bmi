import { useEffect, useMemo, useState } from "react";
import type { SportKey } from "@aetherscore/shared";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { SportIcon } from "@/components/ui/sport-icon";
import { cn } from "@/lib/cn";
import { fetchSportsNews, type NewsArticle } from "@/lib/sports-api";

const sportLabel: Record<SportKey, string> = {
  football: "Futbol",
  basketball: "Basketbol",
  tennis: "Tennis",
  mma: "MMA/UFC",
  volleyball: "Voleybol"
};

const fallbackImage =
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80";

export default function NewsPage() {
  const [activeSport, setActiveSport] = useState<SportKey | "all">("all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadNews = (sport: SportKey | "all") => {
    setLoading(true);
    setError("");
    return fetchSportsNews(sport === "all" ? undefined : sport, 30)
      .then((rows) => setArticles(rows))
      .catch(() => setError("Yangiliklarni yuklashda muammo bo'ldi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    fetchSportsNews(activeSport === "all" ? undefined : activeSport, 30)
      .then((rows) => {
        if (!mounted) return;
        setArticles(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Yangiliklarni yuklashda muammo bo'ldi.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeSport]);

  const featured = articles[0];
  const rest = useMemo(() => articles.slice(1), [articles]);

  const formatPublishedAt = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Yaqinda";
    return date.toLocaleString();
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className="section-container py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          eyebrow="Open API Newswire"
          title="Sport News"
          subtitle="Yangiliklar bevosita ochiq sport API manbalaridan olinadi. Har bir kartada rasm, manba va vaqt ko'rsatiladi."
        />
        <Link to="/" className="text-sm font-semibold text-accent-700 hover:text-accent-800">
          Asosiy sahifaga qaytish
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant={activeSport === "all" ? "primary" : "secondary"} onClick={() => setActiveSport("all")}>
          Barchasi
        </Button>
        {(Object.keys(sportLabel) as SportKey[]).map((sport) => (
          <Button
            key={sport}
            variant={activeSport === sport ? "primary" : "secondary"}
            onClick={() => setActiveSport(sport)}
            className="gap-2"
          >
            <SportIcon sport={sport} size="sm" className="h-5 w-5 border-white/40 bg-white/10 text-current" />
            {sportLabel[sport]}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => loadNews(activeSport)}>
          Qayta yuklash
        </Button>
      </div>

      {loading ? <p className="mt-5 text-sm text-surface-600">Yangiliklar yuklanmoqda...</p> : null}
      {error ? <p className="mt-5 text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && !articles.length ? (
        <p className="mt-5 text-sm text-surface-600">Hozircha yangiliklar topilmadi.</p>
      ) : null}

      {featured ? (
        <Card elevated className="mt-6 p-0">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
            <div className="h-[240px] overflow-hidden bg-surface-100 lg:h-full">
              <img
                src={featured.imageUrl || fallbackImage}
                alt={featured.title}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </div>
            <div className="space-y-3 p-5">
              <span className="inline-flex rounded-md border border-surface-300 bg-surface-50 px-2 py-1 text-xs text-surface-600">
                {sportLabel[featured.sport]} · {featured.source}
              </span>
              <h3 className="font-heading text-3xl font-bold uppercase leading-tight text-surface-900">
                {featured.title}
              </h3>
              <div className="max-h-64 overflow-auto pr-1">
                <p className="text-sm leading-relaxed text-surface-700">{featured.content || featured.description}</p>
              </div>
              <p className="text-xs text-surface-500">{formatPublishedAt(featured.publishedAt)}</p>
              <div className="pt-2">
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg border border-accent-300 bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700 hover:bg-accent-100"
                >
                  Manbaga o'tish
                </a>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((article) => {
          const expandedState = Boolean(expanded[article.id]);
          return (
            <div
              key={`${article.id}-${article.url}`}
              className="group overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
            >
            <div className="relative h-44 w-full overflow-hidden bg-surface-100">
              <img
                src={article.imageUrl || fallbackImage}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-surface-500">
                <span className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1">{sportLabel[article.sport]}</span>
                <span>{article.source}</span>
              </div>
              <h3 className="line-clamp-2 font-heading text-xl font-bold uppercase leading-tight text-surface-900">
                {article.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed text-surface-600",
                  expandedState ? "max-h-64 overflow-auto pr-1" : "line-clamp-4"
                )}
              >
                {article.content || article.description}
              </p>
              <p className="text-xs text-surface-500">{formatPublishedAt(article.publishedAt)}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleExpanded(article.id)}
                  className="rounded-lg border border-surface-300 bg-surface-50 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:border-accent-300 hover:text-accent-700"
                >
                  {expandedState ? "Yig'ish" : "To'liq matn"}
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-accent-300 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-100"
                >
                  Manba
                </a>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
