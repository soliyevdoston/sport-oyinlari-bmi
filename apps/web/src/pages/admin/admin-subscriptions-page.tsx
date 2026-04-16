import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { ApiUser } from "@/lib/api";

interface AdminSubscription {
  id: string;
  userId: string;
  plan: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "TRIALING" | "CANCELED";
  createdAt: string;
  user: ApiUser;
}

export default function AdminSubscriptionsPage() {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch<{ subscriptions: AdminSubscription[] }>("/admin/subscriptions")
      .then((payload) => {
        setRows(payload.subscriptions);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load subscriptions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="Subscriptions"
        subtitle="Inspect plan distribution and account monetization state."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card elevated tone="accent">
          <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Total</p>
          <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{rows.length}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Premium</p>
          <p className="mt-2 font-heading text-3xl font-bold text-surface-900">
            {rows.filter((x) => x.plan === "PREMIUM").length}
          </p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Active</p>
          <p className="mt-2 font-heading text-3xl font-bold text-surface-900">
            {rows.filter((x) => x.status === "ACTIVE").length}
          </p>
        </Card>
      </div>

      <Card className="mt-4 overflow-x-auto" elevated>
        {loading ? <p className="text-sm text-surface-600">Loading subscriptions...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
                <th className="px-2 py-3">User</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Plan</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-100">
                  <td className="px-2 py-3 font-medium text-surface-800">{row.user.fullName}</td>
                  <td className="px-2 py-3 text-surface-600">{row.user.email}</td>
                  <td className="px-2 py-3">{row.plan}</td>
                  <td className="px-2 py-3">{row.status}</td>
                  <td className="px-2 py-3 text-surface-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Card>
    </section>
  );
}
