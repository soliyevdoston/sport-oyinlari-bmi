import { NavLink } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";

type NavIconProps = {
  className?: string;
};

const HomeIcon = ({ className = "h-5 w-5" }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 10.8L12 3l9 7.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 9.8V21h13V9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MatchIcon = ({ className = "h-5 w-5" }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 9.5h8M8 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SportIcon = ({ className = "h-5 w-5" }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.8 12h16.4M12 3.8c2.2 2.1 3.3 5 3.3 8.2 0 3.2-1.1 6.1-3.3 8.2-2.2-2.1-3.3-5-3.3-8.2 0-3.2 1.1-6.1 3.3-8.2z" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const NewsIcon = ({ className = "h-5 w-5" }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 5.5h11.5a2 2 0 012 2V18a2.5 2.5 0 01-2.5 2.5H7.5A2.5 2.5 0 015 18V5.5z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 9h7M8 12.5h7M8 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const UserIcon = ({ className = "h-5 w-5" }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20c.7-3.3 3.4-5 7-5s6.3 1.7 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const accountItem = user
    ? { to: isAdmin ? "/admin" : "/dashboard", label: isAdmin ? "Admin" : "Kabinet", icon: UserIcon }
    : { to: "/login", label: "Kirish", icon: UserIcon };

  const items: Array<{ to: string; label: string; icon: (props: NavIconProps) => JSX.Element; end?: boolean }> = [
    { to: "/", label: "Asosiy", icon: HomeIcon, end: true },
    { to: "/matches", label: "Match", icon: MatchIcon },
    { to: "/sports", label: "Sport", icon: SportIcon },
    { to: "/news", label: "News", icon: NewsIcon },
    accountItem
  ];

  return (
    <nav
      className="mobile-bottom-safe fixed inset-x-0 bottom-0 z-50 border-t border-surface-200 bg-white/95 shadow-[0_-8px_30px_-20px_rgba(12,29,52,0.45)] backdrop-blur md:hidden"
      aria-label="Mobil pastki navigatsiya"
    >
      <div className="section-container">
        <ul className="grid grid-cols-5 gap-1 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-accent-100 text-accent-700"
                        : "text-surface-500 hover:bg-surface-100 hover:text-surface-700"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-0.5 leading-none">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
