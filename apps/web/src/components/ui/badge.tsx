import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "success" | "muted";
}

const tones = {
  default: "border-surface-300 bg-white text-surface-700",
  accent: "border-accent-200 bg-accent-50 text-accent-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-700",
  muted: "border-surface-300 bg-surface-100 text-surface-600"
};

export const Badge = ({ className, tone = "default", ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
};
