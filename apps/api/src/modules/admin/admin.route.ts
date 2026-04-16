import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { db, sanitizeUser } from "../../shared/store.js";

export const adminRouter = Router();

adminRouter.use("/admin", authenticate, requireRole("ADMIN"));

adminRouter.get("/admin/users", (_req, res) => {
  const users = db.users.map(sanitizeUser);
  return res.json({ users });
});

adminRouter.patch("/admin/users/:id/role", (req, res) => {
  const schema = z.object({ role: z.enum(["USER", "ADMIN"]) });
  const body = schema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: "Invalid role payload" });
  }

  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  target.role = body.data.role;
  return res.json({ user: sanitizeUser(target) });
});

adminRouter.get("/admin/subscriptions", (_req, res) => {
  const rows = db.subscriptions
    .map((s) => {
      const user = db.users.find((u) => u.id === s.userId);
      if (!user) return null;

      return {
        ...s,
        user: sanitizeUser(user)
      };
    })
    .filter(Boolean);

  return res.json({ subscriptions: rows });
});

adminRouter.get("/admin/ai-usage", (_req, res) => {
  const totals = db.aiUsage.reduce(
    (acc, row) => {
      acc.predictionRequests += row.predictionRequests;
      acc.screenshotRequests += row.screenshotRequests;
      acc.failedRequests += row.failedRequests;
      return acc;
    },
    { predictionRequests: 0, screenshotRequests: 0, failedRequests: 0 }
  );

  const avgLatencyMs =
    db.aiUsage.reduce((acc, row) => acc + row.avgLatencyMs, 0) / (db.aiUsage.length || 1);

  return res.json({
    summary: {
      ...totals,
      avgLatencyMs: Math.round(avgLatencyMs)
    },
    daily: db.aiUsage
  });
});

adminRouter.get("/admin/matches", (_req, res) => {
  return res.json({ matches: db.matches });
});

adminRouter.patch("/admin/matches/:id/featured", (req, res) => {
  const body = z.object({ featured: z.boolean() }).safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const match = db.matches.find((m) => m.id === req.params.id);
  if (!match) {
    return res.status(404).json({ message: "Match not found" });
  }

  match.featured = body.data.featured;
  return res.json({ match });
});

adminRouter.get("/admin/tickets", (_req, res) => {
  return res.json({ ticketLinks: db.ticketLinks });
});

adminRouter.post("/admin/tickets", (req, res) => {
  const body = z
    .object({
      matchId: z.string().min(2),
      providerName: z.string().min(2),
      url: z.string().url()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ message: "Invalid ticket link payload" });
  }

  const entry = {
    id: randomUUID(),
    matchId: body.data.matchId,
    providerName: body.data.providerName,
    url: body.data.url
  };

  db.ticketLinks.push(entry);
  return res.status(201).json({ ticketLink: entry });
});

adminRouter.delete("/admin/tickets/:id", (req, res) => {
  const index = db.ticketLinks.findIndex((x) => x.id === req.params.id);
  if (index < 0) {
    return res.status(404).json({ message: "Ticket link not found" });
  }

  db.ticketLinks.splice(index, 1);
  return res.json({ ok: true });
});
