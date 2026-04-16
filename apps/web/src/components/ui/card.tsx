import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  tone?: "default" | "accent" | "contrast";
}

const toneClass = {
  default: "border-surface-200 bg-white",
  accent: "border-accent-200 bg-gradient-to-br from-white via-accent-50/50 to-white",
  contrast: "border-surface-200 bg-surface-50 text-surface-900"
} as const;

export const Card = ({ className, elevated = false, tone = "default", ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 sm:p-5",
        toneClass[tone],
        elevated ? "shadow-card" : "shadow-sm",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/45 before:to-transparent before:opacity-60",
        className
      )}
      {...props}
    />
  );
};
