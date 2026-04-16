import { Link } from "react-router-dom";
import { Brand } from "@/components/ui/brand";

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-surface-200 bg-surface-50 text-surface-900">
      <div className="section-container py-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr_1fr]">
          <div>
            <Brand className="gap-3" textClassName="text-3xl uppercase" />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-surface-700">
              Premium sport analitika platformasi: live natijalar, chuqur statistik tahlil, AI insight va professional dashboard.
            </p>
            <div className="mt-4 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600">
              Product language: Uzbek. Data source: provider adapter + fallback engine.
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-surface-500">Platforma</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-surface-700">
              <Link to="/matches" className="hover:text-surface-900">Matchlar</Link>
              <Link to="/sports" className="hover:text-surface-900">Sportlar</Link>
              <Link to="/news" className="hover:text-surface-900">Sport News</Link>
              <Link to="/pricing" className="hover:text-surface-900">Tariflar</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-surface-500">Huquqiy</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-surface-700">
              <a href="#" className="hover:text-surface-900">Maxfiylik</a>
              <a href="#" className="hover:text-surface-900">Foydalanish shartlari</a>
              <a href="#" className="hover:text-surface-900">Yordam</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-surface-200 pt-4 text-xs text-surface-500">
          © {new Date().getFullYear()} ScoreAI. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
};
