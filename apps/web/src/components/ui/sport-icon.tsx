import type { SportKey } from "@aetherscore/shared";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SportIconProps {
  sport: SportKey;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9"
};

const IconFrame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-full border border-surface-200 bg-white text-surface-700 shadow-sm",
      className
    )}
  >
    {children}
  </span>
);

const Football = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="m12 8 2.3 1.8-.9 2.7h-2.8l-.9-2.7L12 8Z" stroke="currentColor" strokeWidth="1.2" />
    <path d="m9.4 12.4-1.8 1.3M14.6 12.4l1.8 1.3M10.2 9.8l-2-1M13.8 9.8l2-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const Basketball = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="1.2" />
    <path d="M6.2 6.2c2.6 2.5 2.6 9.1 0 11.6M17.8 6.2c-2.6 2.5-2.6 9.1 0 11.6" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const Tennis = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5.5 8.5a7.2 7.2 0 0 0 10 10" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8.5 5.5a7.2 7.2 0 0 1 10 10" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const Mma = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 14.5c.7-2 1.9-3 3.6-3.1M16 9.5c-.7 2-1.9 3-3.6 3.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M9 9h2M13 13h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Volleyball = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 12c4.2-4.3 11.8-4.3 16 0M8 4.8c2.8 4 2.8 10.4 0 14.4M16 4.8c-2.8 4-2.8 10.4 0 14.4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const SportIcon = ({ sport, className, size = "md" }: SportIconProps) => {
  const iconClass = cn("text-surface-700", sizeClass[size]);
  const frameClass = cn(
    "inline-flex items-center justify-center rounded-full border border-surface-200 bg-white shadow-sm",
    size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : "h-12 w-12",
    className
  );

  return (
    <IconFrame className={frameClass}>
      {sport === "football" ? <Football className={iconClass} /> : null}
      {sport === "basketball" ? <Basketball className={iconClass} /> : null}
      {sport === "tennis" ? <Tennis className={iconClass} /> : null}
      {sport === "mma" ? <Mma className={iconClass} /> : null}
      {sport === "volleyball" ? <Volleyball className={iconClass} /> : null}
    </IconFrame>
  );
};
