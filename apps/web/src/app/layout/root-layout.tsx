import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export const RootLayout = () => {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="pb-24 md:pb-0">
        <Outlet />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
};
