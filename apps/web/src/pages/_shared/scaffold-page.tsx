import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

interface ScaffoldPageProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  items?: string[];
}

export const ScaffoldPage = ({ title, subtitle, eyebrow = "In Progress", items = [] }: ScaffoldPageProps) => {
  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Card className="mt-8" elevated>
        <h3 className="font-heading text-lg font-semibold text-surface-900">Chunk scaffold ready</h3>
        <p className="mt-2 text-sm text-surface-600">
          This page has route wiring, premium baseline styling, and placeholder modules.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-surface-700">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
};
