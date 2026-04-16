import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NotFoundPage = () => {
  return (
    <section className="section-container py-24 text-center">
      <p className="section-eyebrow">404</p>
      <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-surface-900">Page not found</h1>
      <p className="mt-3 text-surface-600">The page you requested does not exist or was moved.</p>
      <Link to="/">
        <Button className="mt-8">Back to Home</Button>
      </Link>
    </section>
  );
};
