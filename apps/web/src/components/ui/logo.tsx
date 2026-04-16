import { useEffect, useMemo, useState } from "react";
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

const hashFromName = (value: string) =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const fallbackLogoDataUri = (name: string, initials: string) => {
  const hue = hashFromName(name) % 360;
  const hueSoft = (hue + 24) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 72% 62%)" />
      <stop offset="100%" stop-color="hsl(${hueSoft} 64% 48%)" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="31" fill="url(#g)" />
  <circle cx="32" cy="32" r="24" fill="rgba(255,255,255,0.2)" />
  <text x="32" y="39" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="18" fill="#ffffff">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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

  useEffect(() => {
    setFailed(false);
  }, [name, src]);

  const safeInitials = initials || "TM";
  const fallbackSrc = useMemo(() => fallbackLogoDataUri(name, safeInitials), [name, safeInitials]);
  const displaySrc = src && !failed ? src : fallbackSrc;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-surface-200 bg-white font-semibold text-surface-700 shadow-sm",
        sizeClass[size],
        className
      )}
    >
      <img
        src={displaySrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </span>
  );
};
