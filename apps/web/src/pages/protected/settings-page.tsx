import { ScaffoldPage } from "@/pages/_shared/scaffold-page";

export default function SettingsPage() {
  return (
    <ScaffoldPage
      title="Account Settings"
      subtitle="Profile, preferences, notifications, and security controls."
      items={["Profile details", "Notification preferences", "Password + sessions", "Privacy settings"]}
    />
  );
}
