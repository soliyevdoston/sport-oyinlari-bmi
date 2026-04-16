import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) return;
    const separator = raw.indexOf("=");
    if (separator < 1) return;

    const key = raw.slice(0, separator).trim();
    let value = raw.slice(separator + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] == null) {
      process.env[key] = value;
    }
  });
};

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "apps/api/.env")
];

envCandidates.forEach((candidate) => loadEnvFile(candidate));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(8080),
  API_HOST: z.string().default("0.0.0.0"),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),
  JWT_ACCESS_SECRET: z.string().default("replace_me_access"),
  JWT_REFRESH_SECRET: z.string().default("replace_me_refresh"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL_TEXT: z.string().default("gpt-4.1-mini")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
