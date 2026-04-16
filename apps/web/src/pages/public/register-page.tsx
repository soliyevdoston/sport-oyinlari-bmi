import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/section-title";
import { sports } from "@/data/mock";
import { useAuth } from "@/app/providers/auth-provider";
import { ApiError } from "@/lib/api";

const strengthScore = (value: string) => {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteSport, setFavoriteSport] = useState("football");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const score = useMemo(() => strengthScore(password), [password]);
  const labels = ["Zaif", "Qoniqarli", "Yaxshi", "Kuchli"];

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fullName.trim()) return setError("Ism-familiya kiritilishi shart.");
    if (!email.includes("@")) return setError("Email formati noto'g'ri.");
    if (score < 2) return setError("Parolni kuchliroq qiling.");
    if (password !== confirmPassword) return setError("Parollar mos emas.");

    try {
      setError("");
      setIsLoading(true);
      await registerUser({
        fullName,
        email,
        password,
        favoriteSport
      });
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ro'yxatdan o'tishda xatolik bo'ldi. Qayta urinib ko'ring.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card tone="contrast" elevated className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.12em] text-white/70">Premium onboarding</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white">ScoreAI ga qo'shiling</h2>
          <p className="mt-3 text-sm text-white/80">
            Ro'yxatdan o'tgandan keyin live scorelar, saqlangan matchlar, AI prediction va screenshot analysis funksiyalari
            sizga ochiladi.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/80">
            <p>• Shaxsiy dashboard va tavsiyalar</p>
            <p>• Sevimli sport va jamoalar monitoringi</p>
            <p>• Pro/Premium tarifga tez o'tish</p>
          </div>
        </Card>

        <div>
          <SectionTitle
            eyebrow="Ro'yxatdan o'tish"
            title="Bepul rejadan boshlang"
            subtitle="Istalgan payt Pro yoki Premium rejaga o'tib AI prediction va screenshot analysis funksiyalarini ochishingiz mumkin."
          />
          <Card className="mt-6" elevated>
            <form className="space-y-4" onSubmit={submit}>
              <Input placeholder="Ism va familiya" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">Parol kuchliligi</p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span key={index} className={`h-1.5 flex-1 rounded-full ${index < score ? "bg-accent-500" : "bg-surface-200"}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-surface-500">{labels[Math.max(0, score - 1)] ?? "Juda zaif"}</p>
              </div>

              <Input
                type="password"
                placeholder="Parolni tasdiqlang"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <label className="block text-sm text-surface-700">
                Sevimli sport turi
                <select
                  value={favoriteSport}
                  onChange={(e) => setFavoriteSport(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-white/80 bg-white/90 px-3 text-sm outline-none focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
                >
                  {sports.map((sport) => (
                    <option key={sport.key} value={sport.key}>{sport.label}</option>
                  ))}
                </select>
              </label>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <Button className="w-full" type="submit">
                {isLoading ? "Yaratilmoqda..." : "Akkaunt yaratish"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
