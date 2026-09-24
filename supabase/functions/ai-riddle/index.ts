import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const fallbackFreeModels = [
  "deepseek/deepseek-r1:free",
  "qwen/qwen3-235b-a22b:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3.8-27b:free",
  "z-ai/glm-5.2:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

const supportedLocales = new Set([
  "en",
  "ar",
  "fr",
  "es",
  "de",
  "pt",
  "it",
  "nl",
  "ru",
  "tr",
  "ja",
  "ko",
  "zh",
  "hi",
  "id",
  "ur",
]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function cleanHint(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

function isFreeModel(value: string) {
  return /^[\w.-]+\/[\w.:-]+:free$/i.test(value);
}

type ModelCatalogCache = { expiresAt: number; models: string[] };
let modelCatalogCache: ModelCatalogCache | null = null;

function configuredFreeModels() {
  return [
    Deno.env.get("OPENROUTER_FREE_MODELS") || "",
    Deno.env.get("OPENROUTER_FREE_MODEL") || "",
  ]
    .join(",")
    .split(",")
    .map((model) => model.trim())
    .filter(isFreeModel);
}

async function getFreeModels(apiKey: string) {
  if (modelCatalogCache && modelCatalogCache.expiresAt > Date.now())
    return modelCatalogCache.models;

  const fallback = [
    ...new Set([...configuredFreeModels(), ...fallbackFreeModels]),
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      const discovered = (Array.isArray(payload?.data) ? payload.data : [])
        .filter((model) => {
          const id = String(model?.id || "");
          const pricing = model?.pricing || {};
          return (
            isFreeModel(id) &&
            Number(pricing.prompt) === 0 &&
            Number(pricing.completion) === 0 &&
            !/(content-safety|omni|embedding|code)/i.test(id)
          );
        })
        .map((model) => String(model.id))
        .slice(0, 20);
      if (discovered.length) {
        const models = [...new Set([...fallback, ...discovered])].slice(0, 24);
        modelCatalogCache = { expiresAt: Date.now() + 10 * 60 * 1000, models };
        return models;
      }
    }
  } catch {
    // The static free-model list remains available if catalog discovery fails.
  } finally {
    clearTimeout(timeout);
  }
  return fallback;
}

async function requestHint(
  model: string,
  apiKey: string,
  system: string,
  user: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": Deno.env.get("APP_URL") || "http://localhost:5173",
          "X-Title": "Exotic",
        },
        body: JSON.stringify({
          model,
          temperature: 0.55,
          max_tokens: 120,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("AI_PROVIDER_AUTH");
      }
      return null;
    }

    const payload = await response.json().catch(() => null);
    const hint = cleanHint(payload?.choices?.[0]?.message?.content);
    return hint ? { hint, model } : null;
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: cors });
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json({ error: "AI provider is not configured" }, 503);

  let body: {
    prompt?: string;
    difficulty?: string;
    level?: number;
    locale?: string;
    answerType?: "digits" | "letters";
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return json({ error: "Invalid JSON body" }, 400);
  if (!body.prompt || typeof body.prompt !== "string")
    return json({ error: "A puzzle prompt is required" }, 400);
  if (body.prompt.length > 4000)
    return json({ error: "Prompt is too long" }, 413);

  const locale = supportedLocales.has(body.locale || "") ? body.locale! : "en";
  const answerType =
    body.answerType === "letters" ? "word answer" : "four-digit code";
  const level = Math.max(1, Math.min(30, Number(body.level) || 1));
  const difficulty = ["easy", "medium", "hard"].includes(body.difficulty || "")
    ? body.difficulty
    : "easy";
  const system = `You are Exotic's clue assistant. Give one short, useful next-step hint for a ${answerType} puzzle. Always answer in the requested locale/language (${locale}), even when the source puzzle is written in English. Never reveal the complete answer, never invent a second answer, and never mention that you are an AI. Return plain text only. Difficulty: ${difficulty}. Level: ${level}.`;
  const user = `Puzzle clue:\n${body.prompt}\n\nGive a hint that helps the player solve it without giving away the complete answer.`;
  let authFailed = false;

  for (const model of await getFreeModels(apiKey)) {
    try {
      const result = await requestHint(model, apiKey, system, user);
      if (result) return json(result);
    } catch (error) {
      if (String(error) === "Error: AI_PROVIDER_AUTH") {
        authFailed = true;
        break;
      }
      // Rate limits, expired models, timeouts, and provider outages
      // automatically fall through to the next free model.
    }
  }

  if (authFailed)
    return json({ error: "AI provider authentication failed" }, 502);
  return json({ error: "All free AI models are currently unavailable" }, 503);
});
