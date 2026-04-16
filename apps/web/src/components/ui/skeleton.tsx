import { cn } from "@/lib/cn";

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "animate-pulse rounded-xl bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 bg-[length:200%_100%]",
      className
    )}
  />
);
