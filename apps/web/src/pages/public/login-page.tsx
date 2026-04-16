import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/section-title";
import { useAuth } from "@/app/providers/auth-provider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.includes("@") || password.length < 6) {
      setError("To'g'ri email va kamida 6 belgili parol kiriting.");
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      navigate(redirect);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Kirishda xatolik bo'ldi. Qayta urinib ko'ring.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card tone="contrast" elevated className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.12em] text-white/70">ScoreAI</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white">Shaxsiy analitik panelga kirish</h2>
          <p className="mt-3 text-sm text-white/80">
            Sevimli jamoalar, live ogohlantirishlar, AI prediction va screenshot history bir profil ostida boshqariladi.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/80">
            <p>• Live va upcoming matchlar monitoringi</p>
            <p>• Win probability + trend tahlili</p>
            <p>• Premium screenshot AI interpretatsiyasi</p>
          </div>
        </Card>

        <div>
          <SectionTitle
            eyebrow="Xush kelibsiz"
            title="Akkauntga kirish"
            subtitle="Shaxsiy dashboard, saqlangan matchlar va AI history bo'limlariga kiring."
          />
          <Card className="mt-6" elevated>
            <form className="space-y-4" onSubmit={submit}>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-xs text-surface-600">
                <p>Admin: `admin@scoreai.dev` / `Admin123!`</p>
                <p>User: `user@scoreai.dev` / `User123!`</p>
              </div>
              <Button className="w-full" type="submit">
                {isLoading ? "Kirilmoqda..." : "Kirish"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
