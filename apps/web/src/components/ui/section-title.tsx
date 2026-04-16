import { cn } from "@/lib/cn";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionTitle = ({ eyebrow, title, subtitle, className }: SectionTitleProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
      <h2 className="font-heading text-2xl font-bold uppercase leading-[0.98] tracking-[0.03em] text-surface-900 sm:text-4xl lg:text-[2.8rem]">
        {title}
      </h2>
      {subtitle ? <p className="max-w-3xl text-sm leading-relaxed text-surface-600 sm:text-base">{subtitle}</p> : null}
    </div>
  );
};
