import { Router } from "express";

export const metaRouter = Router();

metaRouter.get("/meta", (_req, res) => {
  res.json({
    name: "ScoreAI API",
    version: "0.1.0",
    docs: "See docs/architecture-plan.md",
    modules: [
      "auth",
      "sports",
      "matches",
      "predictions",
      "analysis",
      "subscriptions",
      "payments",
      "tickets",
      "admin"
    ]
  });
});
