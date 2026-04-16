import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const wildcardToRegex = (pattern: string) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`);
};

const originMatchers = allowedOrigins.map(wildcardToRegex);
const devLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.NODE_ENV !== "production" && devLocalhostOrigin.test(origin)) {
        callback(null, true);
        return;
      }

      const isAllowed = originMatchers.some((matcher) => matcher.test(origin));

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(env.API_PREFIX, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
