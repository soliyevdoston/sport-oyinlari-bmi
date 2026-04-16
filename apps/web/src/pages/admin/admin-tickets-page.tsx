import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/section-title";

interface TicketLink {
  id: string;
  matchId: string;
  providerName: string;
  url: string;
}

export default function AdminTicketsPage() {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<TicketLink[]>([]);
  const [matchId, setMatchId] = useState("m-001");
  const [providerName, setProviderName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const payload = await authFetch<{ ticketLinks: TicketLink[] }>("/admin/tickets");
    setRows(payload.ticketLinks);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"));
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await authFetch("/admin/tickets", {
        method: "POST",
        body: JSON.stringify({ matchId, providerName, url })
      });

      setProviderName("");
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket link");
    }
  };

  const onDelete = async (id: string) => {
    await authFetch(`/admin/tickets/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="Ticket Providers"
        subtitle="Manage trusted external redirect links for match-level ticket discovery."
      />

      <Card className="mt-8" elevated tone="accent">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Match ID (e.g. m-001)" value={matchId} onChange={(e) => setMatchId(e.target.value)} />
          <Input placeholder="Provider" value={providerName} onChange={(e) => setProviderName(e.target.value)} required />
          <Input placeholder="https://provider.com/event" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <Button type="submit">Add Link</Button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <Card className="mt-4 overflow-x-auto" elevated>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
              <th className="px-2 py-3">Match ID</th>
              <th className="px-2 py-3">Provider</th>
              <th className="px-2 py-3">URL</th>
              <th className="px-2 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-surface-100">
                <td className="px-2 py-3">{row.matchId}</td>
                <td className="px-2 py-3">{row.providerName}</td>
                <td className="px-2 py-3">
                  <a className="text-accent-700 hover:text-accent-800" href={row.url} target="_blank" rel="noreferrer noopener">
                    {row.url}
                  </a>
                </td>
                <td className="px-2 py-3 text-right">
                  <Button variant="ghost" onClick={() => void onDelete(row.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
