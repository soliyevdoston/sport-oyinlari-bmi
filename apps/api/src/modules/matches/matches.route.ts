import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { db } from "../../shared/store.js";

export const matchesRouter = Router();

const aiInsightSchema = z.object({
  match: z.object({
    id: z.coerce.string(),
    sport: z.string().default("football"),
    league: z.coerce.string(),
    startTime: z.coerce.string(),
    status: z.enum(["scheduled", "live", "finished", "postponed", "canceled"]).catch("scheduled"),
    home: z.object({
      id: z.coerce.string().optional(),
      name: z.coerce.string()
    }),
    away: z.object({
      id: z.coerce.string().optional(),
      name: z.coerce.string()
    }),
    score: z
      .object({
        home: z.coerce.number(),
        away: z.coerce.number()
      })
      .optional()
  }),
  summary: z
    .object({
      headline: z.coerce.string().optional(),
      homeStats: z
        .array(
          z.object({
            name: z.coerce.string(),
            value: z.union([z.string(), z.number()]).transform((value) => String(value))
          })
        )
        .optional(),
      awayStats: z
        .array(
          z.object({
            name: z.coerce.string(),
            value: z.union([z.string(), z.number()]).transform((value) => String(value))
          })
        )
        .optional(),
      notes: z.array(z.coerce.string()).optional()
    })
    .optional(),
  history: z
    .object({
      homeForm: z.array(z.coerce.string()).optional(),
      awayForm: z.array(z.coerce.string()).optional(),
      homeScored: z.coerce.number().optional(),
      awayScored: z.coerce.number().optional(),
      homeConceded: z.coerce.number().optional(),
      awayConceded: z.coerce.number().optional()
    })
    .optional(),
  probabilities: z
    .object({
      home: z.coerce.number(),
      draw: z.coerce.number().optional(),
      away: z.coerce.number(),
      confidence: z.coerce.string().optional()
    })
    .optional()
});

type InsightPayload = z.infer<typeof aiInsightSchema>;
type InsightResult = {
  headline: string;
  confidenceLabel: string;
  predictedScoreRange: string;
  tacticalView: string;
  formNarrative: string;
  keyFactors: string[];
  riskNotes: string[];
  finalSummary: string;
  source: "ai" | "fallback";
  model: string;
  generatedAt: string;
};

const insightCache = new Map<string, { expiresAt: number; insight: InsightResult }>();
const INSIGHT_TTL_MS = 1000 * 60 * 10;

const firstN = <T>(rows: T[] | undefined, n: number) => (rows ?? []).slice(0, n);

const toPercent = (value: number | undefined, fallback = 0) => {
  const rounded = Math.round(Number.isFinite(value) ? Number(value) : fallback);
  return Math.max(0, Math.min(100, rounded));
};

const scoreRange = (payload: InsightPayload) => {
  const homePct = toPercent(payload.probabilities?.home, 50);
  const awayPct = toPercent(payload.probabilities?.away, 50);
  const spread = Math.max(0, Math.round(Math.abs(homePct - awayPct) / 20));
  const homeBase = homePct >= awayPct ? 1 + Math.min(2, spread) : 1;
  const awayBase = awayPct > homePct ? 1 + Math.min(2, spread) : 1;
  return `${homeBase}-${awayBase}`;
};

const fallbackInsight = (payload: InsightPayload): InsightResult => {
  const homePct = toPercent(payload.probabilities?.home, 50);
  const drawPct = payload.match.sport === "football" ? toPercent(payload.probabilities?.draw, 18) : 0;
  const awayPct = toPercent(payload.probabilities?.away, 50);
  const confidence = payload.probabilities?.confidence ?? (Math.abs(homePct - awayPct) > 15 ? "Yuqori" : "O'rtacha");
  const homeForm = firstN(payload.history?.homeForm, 5).join("-");
  const awayForm = firstN(payload.history?.awayForm, 5).join("-");
  const notes = firstN(payload.summary?.notes, 2);

  return {
    headline: `${payload.match.home.name} vs ${payload.match.away.name} AI Insight`,
    confidenceLabel: confidence,
    predictedScoreRange: scoreRange(payload),
    tacticalView:
      homePct >= awayPct
        ? `${payload.match.home.name} press va kontrol orqali o'yin tempini boshqarishga yaqin.`
        : `${payload.match.away.name} transition va tez hujumlarda ustunlik olishi mumkin.`,
    formNarrative: `${payload.match.home.name} formasi: ${homeForm || "N/A"} | ${payload.match.away.name} formasi: ${awayForm || "N/A"}`,
    keyFactors: [
      `${payload.match.home.name}: ${homePct}% | ${payload.match.away.name}: ${awayPct}% ehtimol`,
      payload.match.sport === "football" ? `Durang ehtimoli: ${drawPct}%` : "Durang ehtimoli past deb baholangan",
      payload.summary?.headline ? `Live kontekst: ${payload.summary.headline}` : "Live summary mavjud bo'lsa model aniqligi oshadi",
      notes[0] ? `Muhim eslatma: ${notes[0]}` : "Forma va gol trendi asosiy indikator bo'ldi"
    ],
    riskNotes: [
      "Match oldidan lineup o'zgarishi ehtimolni o'zgartirishi mumkin.",
      "Erta gol model balansini keskin almashtiradi.",
      notes[1] ? notes[1] : "Real-time stat yangilanishlari kuzatib borilishi kerak."
    ],
    finalSummary:
      `${payload.match.home.name} vs ${payload.match.away.name} uchun model yo'nalishi ` +
      `${homePct >= awayPct ? "home tomonga" : "away tomonga"} og'gan, ammo noaniqlik omillari saqlanib qoladi.`,
    source: "fallback" as const,
    model: "local-heuristic",
    generatedAt: new Date().toISOString()
  };
};

const timeoutFetch = async (url: string, options: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const extractResponseText = (payload: Record<string, any>) => {
  if (typeof payload.output_text === "string") return payload.output_text.trim();
  if (!Array.isArray(payload.output)) return "";

  const pieces: string[] = [];
  payload.output.forEach((item: Record<string, any>) => {
    if (!Array.isArray(item.content)) return;
    item.content.forEach((chunk: Record<string, any>) => {
      if (typeof chunk?.text === "string") {
        pieces.push(chunk.text);
      }
    });
  });

  return pieces.join("\n").trim();
};

const extractJsonObject = (raw: string): Record<string, any> | null => {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, any>;
  } catch {
    return null;
  }
};

const normalizeInsight = (payload: InsightPayload, data: Record<string, any>) => {
  const base = fallbackInsight(payload);
  const takeArray = (value: unknown, fallback: string[]) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 6)
      : fallback;

  return {
    headline: typeof data.headline === "string" ? data.headline : base.headline,
    confidenceLabel: typeof data.confidenceLabel === "string" ? data.confidenceLabel : base.confidenceLabel,
    predictedScoreRange:
      typeof data.predictedScoreRange === "string" ? data.predictedScoreRange : base.predictedScoreRange,
    tacticalView: typeof data.tacticalView === "string" ? data.tacticalView : base.tacticalView,
    formNarrative: typeof data.formNarrative === "string" ? data.formNarrative : base.formNarrative,
    keyFactors: takeArray(data.keyFactors, base.keyFactors),
    riskNotes: takeArray(data.riskNotes, base.riskNotes),
    finalSummary: typeof data.finalSummary === "string" ? data.finalSummary : base.finalSummary,
    source: "ai" as const,
    model: env.AI_MODEL_TEXT,
    generatedAt: new Date().toISOString()
  };
};

const requestAiInsight = async (payload: InsightPayload) => {
  const response = await timeoutFetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.AI_MODEL_TEXT,
        max_output_tokens: 700,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are an elite multi-sport analyst. Return only valid JSON. Keep analysis clear, sober, and non-gambling style."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Quyidagi match kontekstidan foydalanib, faqat JSON qaytar:\n" +
                  "{\n" +
                  '  "headline": "string",\n' +
                  '  "confidenceLabel": "Past|O\'rtacha|Yuqori",\n' +
                  '  "predictedScoreRange": "string",\n' +
                  '  "tacticalView": "string",\n' +
                  '  "formNarrative": "string",\n' +
                  '  "keyFactors": ["string"],\n' +
                  '  "riskNotes": ["string"],\n' +
                  '  "finalSummary": "string"\n' +
                  "}\n" +
                  "Javob Uzbek tilida bo'lsin.\n\n" +
                  `KONTEKST: ${JSON.stringify(payload)}`
              }
            ]
          }
        ]
      })
    },
    14000
  );

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, any>;
  const text = extractResponseText(data);
  const parsed = extractJsonObject(text);
  if (!parsed) {
    throw new Error("AI response parse failed");
  }

  return normalizeInsight(payload, parsed);
};

matchesRouter.get("/matches", (_req, res) => {
  return res.json({ matches: db.matches });
});

matchesRouter.get("/matches/:id/tickets", (req, res) => {
  const ticketLinks = db.ticketLinks.filter((x) => x.matchId === req.params.id);
  return res.json({ ticketLinks });
});

matchesRouter.post("/matches/ai-insight", async (req, res) => {
  const parsed = aiInsightSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid insight payload",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const payload = parsed.data;
  const cacheKey = `${payload.match.id}:${payload.match.status}:${payload.match.score?.home ?? "-"}:${payload.match.score?.away ?? "-"}`;
  const current = insightCache.get(cacheKey);
  if (current && Date.now() < current.expiresAt) {
    return res.json({ insight: current.insight });
  }

  let insight = fallbackInsight(payload);

  if (env.AI_API_KEY) {
    try {
      insight = await requestAiInsight(payload);
    } catch {
      insight = fallbackInsight(payload);
    }
  }

  insightCache.set(cacheKey, {
    expiresAt: Date.now() + INSIGHT_TTL_MS,
    insight
  });

  return res.json({ insight });
});
