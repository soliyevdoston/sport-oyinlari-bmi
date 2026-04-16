import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "scoreai-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
