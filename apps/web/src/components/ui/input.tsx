import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-[13px] text-surface-900 shadow-sm outline-none transition placeholder:text-surface-400 focus:border-accent-300 focus:ring-2 focus:ring-accent-100 sm:h-11 sm:px-3.5 sm:text-sm",
        className
      )}
      {...props}
    />
  );
});
