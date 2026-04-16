import { cn } from "@/lib/cn";

interface BrandProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  compact?: boolean;
}

export const Brand = ({ className, markClassName, textClassName, compact = false }: BrandProps) => {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-300 bg-gradient-to-br from-accent-100 to-white text-accent-700 shadow-sm",
          markClassName
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 8.5c1-1.5 3.2-2.2 5.1-1.5 1.1.4 2 1.1 2.5 2" strokeLinecap="round" />
          <path d="M17.5 15.2c-1 1.6-3.3 2.4-5.3 1.7-1.1-.4-2-1.2-2.5-2.2" strokeLinecap="round" />
          <path d="M9.8 12h4.4" strokeLinecap="round" />
        </svg>
      </span>
      {!compact ? (
        <span className={cn("font-heading text-[2rem] font-bold tracking-[0.04em] text-surface-900", textClassName)}>
          ScoreAI
        </span>
      ) : null}
    </span>
  );
};
