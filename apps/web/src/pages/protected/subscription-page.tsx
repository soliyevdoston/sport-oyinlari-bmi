import { ScaffoldPage } from "@/pages/_shared/scaffold-page";

export default function SubscriptionPage() {
  return (
    <ScaffoldPage
      title="Billing & Subscription"
      subtitle="Manage plan status, renewals, transaction history, and cancellation flows."
      items={["Current plan", "Renewal dates", "Billing history", "Upgrade/downgrade actions"]}
    />
  );
}
