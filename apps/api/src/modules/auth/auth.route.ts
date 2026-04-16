import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../middleware/auth.js";
import { authService } from "./auth.service.js";
import { loginSchema, refreshSchema, registerSchema } from "./dto/auth.dto.js";

export const authRouter = Router();

authRouter.post("/auth/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register";
    return res.status(400).json({ message });
  }
});

authRouter.post("/auth/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login";
    return res.status(401).json({ message });
  }
});

authRouter.post("/auth/refresh", (req, res) => {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = authService.refresh(payload.refreshToken);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh";
    return res.status(401).json({ message });
  }
});

authRouter.post("/auth/logout", (req, res) => {
  try {
    const payload = refreshSchema.parse(req.body);
    return res.json(authService.logout(payload.refreshToken));
  } catch {
    return res.status(400).json({ message: "Refresh token required" });
  }
});

authRouter.get("/auth/me", authenticate, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.authUser });
});
