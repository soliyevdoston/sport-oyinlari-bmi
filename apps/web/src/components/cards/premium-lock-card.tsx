import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const PremiumLockCard = ({ cta = "Upgrade to Pro" }: { cta?: string }) => {
  return (
    <Card className="border-accent-100 bg-gradient-to-br from-white to-accent-50/40" elevated>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-700">Premium Insight</p>
      <h3 className="mt-2 font-heading text-lg font-semibold text-surface-900">Unlock advanced AI analysis</h3>
      <p className="mt-2 text-sm text-surface-600">
        Upgrade to access explainable predictions, screenshot intelligence, and full analysis history.
      </p>
      <Button className="mt-4 w-full sm:w-auto">{cta}</Button>
    </Card>
  );
};
