import { PremiumLockCard } from "@/components/cards/premium-lock-card";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { useAuth } from "@/app/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Dashboard"
        title={`Welcome back, ${user?.fullName ?? "analyst"}`}
        subtitle="Your favorites, plan status, and AI activity at a glance."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card elevated tone="accent">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">Favorites</p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-surface-900">5 teams tracked</h3>
          <p className="mt-2 text-sm text-surface-600">Arsenal, Celtics, Alcaraz, Volero, Makhachev</p>
        </Card>
        <Card elevated>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">Subscription</p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-surface-900">Free plan</h3>
          <p className="mt-2 text-sm text-surface-600">Upgrade to unlock AI prediction and screenshot analysis history.</p>
        </Card>
        <Card elevated>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">AI Activity</p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-surface-900">0 analyses this week</h3>
          <p className="mt-2 text-sm text-surface-600">Your next AI report will appear here.</p>
        </Card>
      </div>
      <div className="mt-6">
        <PremiumLockCard />
      </div>
    </section>
  );
}
