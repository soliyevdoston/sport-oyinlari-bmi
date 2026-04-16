import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

interface AdminMatch {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  featured: boolean;
}

export default function AdminMatchesPage() {
  const { authFetch } = useAuth();
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const payload = await authFetch<{ matches: AdminMatch[] }>("/admin/matches");
    setMatches(payload.matches);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const toggleFeatured = async (row: AdminMatch) => {
    await authFetch(`/admin/matches/${row.id}/featured`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !row.featured })
    });

    await load();
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="Matches Control"
        subtitle="Toggle featured matches and monitor schedule records used by landing and discovery surfaces."
      />

      <Card className="mt-8 overflow-x-auto" elevated>
        {loading ? <p className="text-sm text-surface-600">Loading matches...</p> : null}

        {!loading ? (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
                <th className="px-2 py-3">Sport</th>
                <th className="px-2 py-3">League</th>
                <th className="px-2 py-3">Match</th>
                <th className="px-2 py-3">Time</th>
                <th className="px-2 py-3">Featured</th>
                <th className="px-2 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((row) => (
                <tr key={row.id} className="border-b border-surface-100">
                  <td className="px-2 py-3 capitalize">{row.sport}</td>
                  <td className="px-2 py-3">{row.league}</td>
                  <td className="px-2 py-3 font-medium text-surface-800">
                    {row.homeTeam} vs {row.awayTeam}
                  </td>
                  <td className="px-2 py-3 text-surface-600">{new Date(row.startTime).toLocaleString()}</td>
                  <td className="px-2 py-3">{row.featured ? "Yes" : "No"}</td>
                  <td className="px-2 py-3 text-right">
                    <Button variant="ghost" onClick={() => void toggleFeatured(row)}>
                      {row.featured ? "Unfeature" : "Feature"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Card>
    </section>
  );
}
