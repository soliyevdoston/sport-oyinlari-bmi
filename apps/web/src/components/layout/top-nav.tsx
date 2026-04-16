import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/auth-provider";
import { Brand } from "@/components/ui/brand";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { to: "/sports", label: "Sportlar" },
  { to: "/matches", label: "Matchlar" },
  { to: "/news", label: "Sport News" },
  { to: "/pricing", label: "Tariflar" },
  { to: "/upload-analysis", label: "AI Studio" }
];

export const TopNav = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 bg-white text-surface-900 shadow-card">
      <div className="section-container flex h-[66px] items-center justify-between gap-2 sm:h-[72px] sm:gap-3">
        <Link to="/" className="inline-flex items-center">
          <Brand className="sm:hidden" compact />
          <Brand className="hidden sm:inline-flex" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border border-accent-400 bg-accent-100 text-accent-700"
                    : "border border-transparent text-surface-700 hover:border-surface-300 hover:bg-surface-100 hover:text-surface-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <NavLink
              to={isAdmin ? "/admin" : "/dashboard"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border border-accent-400 bg-accent-100 text-accent-700"
                    : "border border-transparent text-surface-700 hover:border-surface-300 hover:bg-surface-100 hover:text-surface-900"
                }`
              }
            >
              {isAdmin ? "Admin" : "Dashboard"}
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-surface-300 bg-surface-50 px-2 py-1 sm:flex">
                <Logo name={user.fullName} size="sm" />
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold text-surface-900">{user.fullName}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-surface-500">{user.role}</p>
                </div>
              </div>
              <Button variant="secondary" className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm" onClick={logout}>
                Chiqish
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/login")}>
                Kirish
              </Button>
              <Button className="hidden sm:inline-flex" onClick={() => (window.location.href = "/register")}>
                Ro'yxatdan o'tish
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
