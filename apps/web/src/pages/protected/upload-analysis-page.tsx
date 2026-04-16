import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/section-title";

const sections = [
  "Detected content",
  "Match context",
  "Key observations",
  "AI interpretation / likely outcome",
  "Uncertainty / limitations",
  "Final summary"
];

export default function UploadAnalysisPage() {
  const [fileName, setFileName] = useState<string>("");
  const [note, setNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canSubmit = useMemo(() => Boolean(fileName) && !isAnalyzing, [fileName, isAnalyzing]);

  const onAnalyze = () => {
    setIsAnalyzing(true);
    window.setTimeout(() => setIsAnalyzing(false), 1100);
  };

  return (
    <section className="section-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="AI Screenshot Studio"
        title="Upload and interpret match screenshots"
        subtitle="Attach scoreboard, lineup, standings, stats panel, or event snapshots for structured AI analysis."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card elevated>
          <label
            htmlFor="analysis-file"
            className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50/80 p-6 text-center transition hover:border-accent-300 hover:bg-accent-50/40"
          >
            <p className="font-heading text-lg font-semibold text-surface-800">Drag & drop or browse file</p>
            <p className="mt-2 text-sm text-surface-500">PNG, JPG, WEBP. Screenshot of score, lineup, stats, or sports news panel.</p>
            {fileName ? <p className="mt-4 rounded-lg bg-white px-3 py-1 text-sm font-medium text-surface-700">{fileName}</p> : null}
          </label>
          <input
            id="analysis-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? "");
            }}
          />

          <div className="mt-4 space-y-3">
            <Input placeholder="Optional: link to match id" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note: what should AI focus on?"
              className="min-h-24 w-full rounded-xl border border-surface-200 bg-white p-3 text-sm outline-none focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
            />
            <Button disabled={!canSubmit} onClick={onAnalyze} className="w-full sm:w-auto">
              {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">Output Structure</p>
          <ul className="mt-4 space-y-2 text-sm text-surface-700">
            {sections.map((item, idx) => (
              <li key={item}>
                {idx + 1}. {item}
              </li>
            ))}
          </ul>
          {isAnalyzing ? (
            <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
              Processing image with contextual sports signals...
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-600">
              Result preview appears here after analysis.
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
