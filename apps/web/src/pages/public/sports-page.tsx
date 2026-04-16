import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { SportIcon } from "@/components/ui/sport-icon";
import { fetchSportsCatalog, type SportCatalogItem } from "@/lib/sports-api";
import { sports as fallbackSports } from "@/data/mock";

export default function SportsPage() {
  const [sports, setSports] = useState<SportCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSportsCatalog()
      .then((rows) => setSports(rows))
      .catch(() =>
        setSports(
          fallbackSports.map((sport) => ({
            ...sport,
            logoUrl: "",
            endpoints: [sport.key]
          }))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Sports Portfolio"
        title="Barcha sportlar yagona premium interfeysda"
        subtitle="Har bir sport uchun bir xil analytical UX: live natijalar, AI ehtimol va chuqur match markazi."
      />

      {loading ? <p className="mt-6 text-sm text-surface-600">Sport katalog yuklanmoqda...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sports.map((sport) => (
          <Card key={sport.key} elevated className="group h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SportIcon sport={sport.key} />
                <h3 className="font-heading text-3xl font-semibold text-surface-900">{sport.label}</h3>
              </div>
              <p className="text-xs uppercase tracking-[0.08em] text-surface-400">{sport.key}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-surface-700">{sport.blurb}</p>
            <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-3 text-xs text-surface-600">
              API endpointlar: {sport.endpoints.length ? sport.endpoints.join(", ") : "provider adapter orqali"}
            </div>
            <Link
              to={`/sports/${sport.key}`}
              className="mt-4 inline-block text-sm font-semibold text-accent-700 transition group-hover:text-accent-800"
            >
              Sport hubni ochish
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

