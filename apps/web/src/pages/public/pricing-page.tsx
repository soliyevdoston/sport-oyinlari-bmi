import { pricing } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export default function PricingPage() {
  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Subscription"
        title="Shaffof reja, premium imkoniyatlar"
        subtitle="Bepul rejadan boshlab Pro yoki Premium ga o'ting va AI prediction hamda screenshot analysis funksiyalarini to'liq oching."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {pricing.map((plan) => (
          <Card key={plan.name} className={plan.name === "Premium" ? "border-accent-300" : ""} elevated>
            <p className="text-xs uppercase tracking-[0.08em] text-surface-500">{plan.note}</p>
            <h3 className="mt-2 font-heading text-3xl font-semibold text-surface-900">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold text-surface-900">{plan.price}</p>
            <div className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700">
                  {feature}
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full">Rejani tanlash</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

