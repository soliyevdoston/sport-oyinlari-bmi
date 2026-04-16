import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border border-accent-500 bg-accent-500 text-white shadow-glow hover:bg-accent-600 focus-visible:outline-accent-300",
  secondary:
    "border border-surface-300 bg-white text-surface-800 hover:border-accent-300 hover:bg-accent-50 focus-visible:outline-accent-300",
  ghost:
    "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-surface-300",
  danger: "bg-rose-700 text-white hover:bg-rose-800 focus-visible:outline-rose-300"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-[13px] font-semibold tracking-[0.02em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-4 sm:text-sm",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
});
