import { ScaffoldPage } from "@/pages/_shared/scaffold-page";

export default function AnalysisHistoryPage() {
  return (
    <ScaffoldPage
      title="Analysis History"
      subtitle="Review prior screenshot and AI prediction outputs with confidence context."
      items={["Screenshot analysis history", "Prediction history", "Filters by sport/match/date"]}
    />
  );
}
