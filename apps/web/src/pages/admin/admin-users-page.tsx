import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import type { ApiUser } from "@/lib/api";

export default function AdminUsersPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const payload = await authFetch<{ users: ApiUser[] }>("/admin/users");
      setUsers(payload.users);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleRole = async (user: ApiUser) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await authFetch<{ user: ApiUser }>(`/admin/users/${user.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: nextRole })
    });

    await load();
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="Admin"
        title="Users Management"
        subtitle="Manage account roles for operator and customer access control."
      />

      <Card className="mt-8 overflow-x-auto" elevated>
        {loading ? <p className="text-sm text-surface-600">Loading users...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-xs uppercase tracking-[0.08em] text-surface-500">
                <th className="px-2 py-3">Name</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Role</th>
                <th className="px-2 py-3">Created</th>
                <th className="px-2 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-surface-100">
                  <td className="px-2 py-3 font-medium text-surface-800">{user.fullName}</td>
                  <td className="px-2 py-3 text-surface-600">{user.email}</td>
                  <td className="px-2 py-3">
                    <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs font-semibold">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-surface-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-3 text-right">
                    <Button variant="ghost" onClick={() => void toggleRole(user)}>
                      {user.role === "ADMIN" ? "Set User" : "Set Admin"}
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
