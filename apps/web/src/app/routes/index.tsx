import { Suspense, lazy, type ReactElement } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/app/layout/root-layout";
import { AdminRoute, ProtectedRoute } from "@/app/routes/guards";
import { NotFoundPage } from "@/app/routes/not-found";
import { Skeleton } from "@/components/ui/skeleton";

const LandingPage = lazy(() => import("@/pages/public/landing-page"));
const NewsPage = lazy(() => import("@/pages/public/news-page"));
const SportsPage = lazy(() => import("@/pages/public/sports-page"));
const SportDetailPage = lazy(() => import("@/pages/public/sport-detail-page"));
const MatchesPage = lazy(() => import("@/pages/public/matches-page"));
const MatchDetailPage = lazy(() => import("@/pages/public/match-detail-page"));
const PricingPage = lazy(() => import("@/pages/public/pricing-page"));
const LoginPage = lazy(() => import("@/pages/public/login-page"));
const RegisterPage = lazy(() => import("@/pages/public/register-page"));

const DashboardPage = lazy(() => import("@/pages/protected/dashboard-page"));
const FavoritesPage = lazy(() => import("@/pages/protected/favorites-page"));
const AnalysisHistoryPage = lazy(() => import("@/pages/protected/analysis-history-page"));
const SubscriptionPage = lazy(() => import("@/pages/protected/subscription-page"));
const SettingsPage = lazy(() => import("@/pages/protected/settings-page"));
const UploadAnalysisPage = lazy(() => import("@/pages/protected/upload-analysis-page"));

const AdminPage = lazy(() => import("@/pages/admin/admin-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin/admin-users-page"));
const AdminSubscriptionsPage = lazy(() => import("@/pages/admin/admin-subscriptions-page"));
const AdminMatchesPage = lazy(() => import("@/pages/admin/admin-matches-page"));
const AdminTicketsPage = lazy(() => import("@/pages/admin/admin-tickets-page"));
const AdminAiUsagePage = lazy(() => import("@/pages/admin/admin-ai-usage-page"));

const PageFallback = () => (
  <section className="section-container py-12">
    <Skeleton className="h-8 w-56" />
    <Skeleton className="mt-3 h-4 w-96 max-w-full" />
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <Skeleton className="h-44" />
      <Skeleton className="h-44" />
      <Skeleton className="h-44" />
    </div>
  </section>
);

const withSuspense = (element: ReactElement) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: withSuspense(<LandingPage />) },
      { path: "news", element: withSuspense(<NewsPage />) },
      { path: "sports", element: withSuspense(<SportsPage />) },
      { path: "sports/:sportSlug", element: withSuspense(<SportDetailPage />) },
      { path: "matches", element: withSuspense(<MatchesPage />) },
      { path: "matches/:id", element: withSuspense(<MatchDetailPage />) },
      { path: "pricing", element: withSuspense(<PricingPage />) },
      { path: "login", element: withSuspense(<LoginPage />) },
      { path: "register", element: withSuspense(<RegisterPage />) },

      {
        path: "dashboard",
        element: withSuspense(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: "favorites",
        element: withSuspense(
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        )
      },
      {
        path: "analysis-history",
        element: withSuspense(
          <ProtectedRoute>
            <AnalysisHistoryPage />
          </ProtectedRoute>
        )
      },
      {
        path: "subscription",
        element: withSuspense(
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        )
      },
      {
        path: "settings",
        element: withSuspense(
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "upload-analysis",
        element: withSuspense(
          <ProtectedRoute>
            <UploadAnalysisPage />
          </ProtectedRoute>
        )
      },

      {
        path: "admin",
        element: withSuspense(
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/users",
        element: withSuspense(
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/subscriptions",
        element: withSuspense(
          <AdminRoute>
            <AdminSubscriptionsPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/matches",
        element: withSuspense(
          <AdminRoute>
            <AdminMatchesPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/tickets",
        element: withSuspense(
          <AdminRoute>
            <AdminTicketsPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/ai-usage",
        element: withSuspense(
          <AdminRoute>
            <AdminAiUsagePage />
          </AdminRoute>
        )
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
