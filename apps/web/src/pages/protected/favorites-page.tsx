import { ScaffoldPage } from "@/pages/_shared/scaffold-page";

export default function FavoritesPage() {
  return (
    <ScaffoldPage
      title="Favorites & Personalization"
      subtitle="Track teams, sports, leagues, and saved matches with recommendation hooks."
      items={["Favorite teams", "Favorite leagues", "Saved matches", "Recommendation feed"]}
    />
  );
}
