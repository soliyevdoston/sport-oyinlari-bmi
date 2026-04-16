import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/auth-provider";

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <section className="section-container py-16">
        <Card className="mx-auto max-w-xl text-center" elevated>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Checking your session...</h1>
        </Card>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section-container py-16">
        <Card className="mx-auto max-w-xl text-center" elevated>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Sign in required</h1>
          <p className="mt-3 text-sm text-surface-600">
            This section is protected. Please sign in to continue.
          </p>
          <div className="mt-6">
            <Button onClick={() => (window.location.href = `/login?redirect=${location.pathname}`)}>Go to Login</Button>
          </div>
        </Card>
      </section>
    );
  }

  return children;
};

export const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <section className="section-container py-16">
        <Card className="mx-auto max-w-xl text-center" elevated>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Checking admin privileges...</h1>
        </Card>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return (
      <section className="section-container py-16">
        <Card className="mx-auto max-w-xl text-center" elevated>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Admin access required</h1>
          <p className="mt-3 text-sm text-surface-600">
            Your current session does not have admin privileges for this area.
          </p>
        </Card>
      </section>
    );
  }

  return children;
};
