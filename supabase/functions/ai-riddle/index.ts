import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const freeModels = [
  Deno.env.get("OPENROUTER_FREE_MODEL"),
  "deepseek/deepseek-r1:free",
  "qwen/qwen3-235b-a22b:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
].filter(Boolean);

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

function cleanHint(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
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
  if (!body.prompt || typeof body.prompt !== "string")
    return json({ error: "A puzzle prompt is required" }, 400);
  if (body.prompt.length > 4000)
    return json({ error: "Prompt is too long" }, 413);

  const answerType =
    body.answerType === "letters" ? "word answer" : "four-digit code";
  const system = `You are Exotic's clue assistant. Give one short, useful next-step hint for a ${answerType} puzzle. Always answer in the requested locale/language (${body.locale || "en"}), even when the source puzzle is written in English. Never reveal the complete answer, never invent a second answer, and never mention that you are an AI. Return plain text only. Difficulty: ${body.difficulty || "easy"}. Level: ${body.level || 1}.`;
  const user = `Puzzle clue:\n${body.prompt}\n\nGive a hint that helps the player solve it without giving away the complete answer.`;

  for (const model of freeModels) {
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
        },
      );
      if (!response.ok) {
        if (response.status === 429) continue;
        return json({ error: "AI provider request failed" }, 502);
      }
      const payload = await response.json();
      const hint = cleanHint(payload?.choices?.[0]?.message?.content || "");
      if (hint) return json({ hint, model });
    } catch {
      // Try the next free model when a provider is unavailable.
    }
  }
  return json({ error: "All free AI models are currently unavailable" }, 503);
});
