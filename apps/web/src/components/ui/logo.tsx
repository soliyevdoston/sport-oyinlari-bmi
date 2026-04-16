import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

interface LogoProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base"
};

export const Logo = ({ src, name, size = "md", className }: LogoProps) => {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [name]
  );

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-surface-200 bg-white font-semibold text-surface-700 shadow-sm",
        sizeClass[size],
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </span>
  );
};
