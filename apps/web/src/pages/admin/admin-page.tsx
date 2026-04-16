import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

const modules = [
  {
    title: "Users",
    text: "Role and account management",
    to: "/admin/users"
  },
  {
    title: "Subscriptions",
    text: "Plans and lifecycle monitoring",
    to: "/admin/subscriptions"
  },
  {
    title: "Matches",
    text: "Featured and manual overrides",
    to: "/admin/matches"
  },
  {
    title: "Tickets",
    text: "Trusted external provider links",
    to: "/admin/tickets"
  },
  {
    title: "AI Usage",
    text: "Prediction and screenshot pipeline health",
    to: "/admin/ai-usage"
  }
];

export default function AdminPage() {
  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="Operations Center"
        subtitle="Control product health, access rights, subscriptions, and premium AI operations."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card elevated tone="accent" className="h-full transition hover:-translate-y-1 hover:shadow-card">
              <h3 className="font-heading text-xl font-semibold text-surface-900">{item.title}</h3>
              <p className="mt-2 text-sm text-surface-600">{item.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
