import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { useAuth } from "@/app/providers/auth-provider";

interface DailyUsage {
  date: string;
  predictionRequests: number;
  screenshotRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
}

interface UsagePayload {
  summary: {
    predictionRequests: number;
    screenshotRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
  };
  daily: DailyUsage[];
}

export default function AdminAiUsagePage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<UsagePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch<UsagePayload>("/admin/ai-usage")
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load AI usage"));
  }, []);

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="AI Usage Health"
        subtitle="Track prediction and screenshot analysis throughput, reliability, and latency."
      />

      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Card elevated tone="accent">
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Predictions</p>
              <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{data.summary.predictionRequests}</p>
            </Card>
            <Card elevated>
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Screenshots</p>
              <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{data.summary.screenshotRequests}</p>
            </Card>
            <Card elevated>
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Failures</p>
              <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{data.summary.failedRequests}</p>
            </Card>
            <Card elevated>
              <p className="text-xs uppercase tracking-[0.1em] text-surface-500">Avg latency</p>
              <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{data.summary.avgLatencyMs}ms</p>
            </Card>
          </div>

          <Card className="mt-4 overflow-x-auto" elevated>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
                  <th className="px-2 py-3">Date</th>
                  <th className="px-2 py-3">Prediction</th>
                  <th className="px-2 py-3">Screenshot</th>
                  <th className="px-2 py-3">Failed</th>
                  <th className="px-2 py-3">Avg latency</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((row) => (
                  <tr key={row.date} className="border-b border-surface-100">
                    <td className="px-2 py-3 text-surface-700">{row.date}</td>
                    <td className="px-2 py-3">{row.predictionRequests}</td>
                    <td className="px-2 py-3">{row.screenshotRequests}</td>
                    <td className="px-2 py-3">{row.failedRequests}</td>
                    <td className="px-2 py-3">{row.avgLatencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <p className="mt-6 text-sm text-surface-600">Loading AI usage...</p>
      )}
    </section>
  );
}
