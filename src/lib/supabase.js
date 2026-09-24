import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

const memoryStorage = createMemoryStorage();

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: memoryStorage,
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
        realtime: {
          ["session" + "Storage"]: memoryStorage,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);

export async function requestAiHint({
  prompt,
  difficulty,
  level,
  locale,
  answerType,
}) {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("ai-riddle", {
    body: { prompt, difficulty, level, locale, answerType },
  });
  if (error) throw error;
  return data?.hint || null;
}

export async function invokeMultiplayerAction(action, payload = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke(
    "multiplayer-action",
    {
      body: { action, ...payload },
    },
  );
  if (error) throw error;
  return data;
}
