import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db, sanitizeUser, type UserRole } from "../shared/store.js";

export interface AuthenticatedRequest extends Request {
  authUser?: ReturnType<typeof sanitizeUser>;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authorization.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    const user = db.users.find((u) => u.id === decoded.sub);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.authUser = sanitizeUser(user);
    next();
  } catch {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.authUser.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
