import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { db, sanitizeUser, type UserRecord } from "../../shared/store.js";

const ACCESS_AGE_SEC = 60 * 15;
const REFRESH_AGE_SEC = 60 * 60 * 24 * 7;
const ACCESS_EXPIRES_IN: SignOptions["expiresIn"] = "15m";
const REFRESH_EXPIRES_IN: SignOptions["expiresIn"] = "7d";

interface AccessClaims {
  sub: string;
  role: UserRecord["role"];
  email: string;
  fullName: string;
}

const signAccess = (user: UserRecord) => {
  const payload: AccessClaims = {
    sub: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: (env.JWT_ACCESS_TTL as SignOptions["expiresIn"]) ?? ACCESS_EXPIRES_IN
  });
};

const signRefresh = (user: UserRecord) => {
  return jwt.sign({ sub: user.id, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: (env.JWT_REFRESH_TTL as SignOptions["expiresIn"]) ?? REFRESH_EXPIRES_IN
  });
};

const sessionExpiry = () => Date.now() + REFRESH_AGE_SEC * 1000;

export const authService = {
  register: async (input: { fullName: string; email: string; password: string; favoriteSport?: string }) => {
    const existing = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new Error("Email already exists");
    }

    const user: UserRecord = {
      id: randomUUID(),
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 10),
      role: "USER",
      favoriteSport: input.favoriteSport,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    db.subscriptions.push({
      id: randomUUID(),
      userId: user.id,
      plan: "FREE",
      status: "TRIALING",
      createdAt: new Date().toISOString()
    });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    db.refreshSessions.push({
      id: randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: sessionExpiry()
    });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  login: async (input: { email: string; password: string }) => {
    const user = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    db.refreshSessions.push({
      id: randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: sessionExpiry()
    });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  refresh: (refreshToken: string) => {
    try {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new Error("Refresh token is invalid or expired");
    }

    const session = db.refreshSessions.find((s) => s.token === refreshToken && !s.revokedAt);
    if (!session) {
      throw new Error("Session not found");
    }

    if (Date.now() > session.expiresAt) {
      session.revokedAt = Date.now();
      throw new Error("Session expired");
    }

    const user = db.users.find((u) => u.id === session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    session.revokedAt = Date.now();

    const nextRefresh = signRefresh(user);
    db.refreshSessions.push({
      id: randomUUID(),
      userId: user.id,
      token: nextRefresh,
      expiresAt: sessionExpiry()
    });

    const accessToken = signAccess(user);
    return { user: sanitizeUser(user), accessToken, refreshToken: nextRefresh };
  },

  logout: (refreshToken: string) => {
    const session = db.refreshSessions.find((s) => s.token === refreshToken && !s.revokedAt);
    if (session) {
      session.revokedAt = Date.now();
    }

    return { ok: true };
  },

  verifyAccess: (accessToken: string) => {
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as AccessClaims;
    const user = db.users.find((u) => u.id === decoded.sub);
    if (!user) {
      throw new Error("User not found");
    }

    return sanitizeUser(user);
  }
};
