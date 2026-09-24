import { getInitials } from "./storage";
import { supabase } from "./supabase";

/*
 * The achievement catalog is server-owned, but the keys below are deliberately
 * stable.  A migration can add a new achievement without changing this file;
 * rows that are not listed here still use the titleKey/descriptionKey supplied
 * by the RPC.  Keeping the aliases here makes the UI resilient to the hyphenated
 * and underscored forms used by older seed data.
 */
const copyFor = (slug, namespace = "items", prefix = "achievements") => {
  const titleKey = `${prefix}.${namespace}.${slug}.title`;
  const descriptionKey = `${prefix}.${namespace}.${slug}.description`;
  return Object.freeze({
    titleKey,
    descriptionKey,
    // Short aliases make the mapping convenient for consumers that use
    // `{ title, description }` rather than the RPC field names.
    title: titleKey,
    description: descriptionKey,
  });
};

const legacyCopyFor = (scope, key) =>
  copyFor(key, scope, "achievement");

const serverCopyFor = (scope, key) => {
  const actual = copyFor(key, scope);
  const legacyKeys = {
    single: {
      first_crack: "first_crack",
      codebreaker: "level_hunter",
      finisher: "level_hunter",
      completionist: "all_difficulties",
      code_hunter: "collector",
      quick_thinker: "speed_runner",
      speed_demon: "speed_runner",
      collector: "collector",
      treasurer: "rich",
    },
    multi: {
      first_match: "first_duel",
      regular: "duel_regular",
      first_win: "first_win",
      code_hunter: "code_crack",
      sharp_shooter: "sharp_shooter",
      elite: "sharp_shooter",
      collector: "collector",
      treasurer: "collector",
    },
  };
  const legacyKey = legacyKeys[scope]?.[key];
  if (!legacyKey) return actual;
  return Object.freeze({
    ...legacyCopyFor(scope, legacyKey),
    rpcTitleKey: actual.titleKey,
    rpcDescriptionKey: actual.descriptionKey,
  });
};

const achievementEntries = [
  "first_crack",
  "first_code",
  "first_solve",
  "first_win",
  "first_duel",
  "first_duel_win",
  "ten_codes",
  "ten_code",
  "fifty_codes",
  "fifty_code",
  "ninety_codes",
  "all_codes",
  "code_collector",
  "easy_master",
  "easy_complete",
  "medium_master",
  "medium_complete",
  "hard_master",
  "hard_complete",
  "all_difficulties",
  "vault_master",
  "perfect_run",
  "flawless",
  "streak_3",
  "streak_7",
  "streak_30",
  "duel_streak_3",
  "duel_streak_7",
  "duel_streak_30",
  "ten_wins",
  "twenty_five_wins",
  "fifty_wins",
  "category_sweep",
  "all_rounder",
  "sharp_shooter",
  "sharpshooter",
  "solo_first_crack",
  "solo_ten_codes",
  "multi_first_win",
  "multi_ten_wins",
];

// IDs from the durable catalog.  The migration uses dotted keys and
// scope-specific translation namespaces; the generic aliases above remain
// useful for older/local catalog rows.
const legacyAchievementEntries = [
  ["achievement.single.first_crack", legacyCopyFor("single", "first_crack")],
  ["achievement.single.level_hunter", legacyCopyFor("single", "level_hunter")],
  ["achievement.single.all_difficulties", legacyCopyFor("single", "all_difficulties")],
  ["achievement.single.sharp_shooter", legacyCopyFor("single", "sharp_shooter")],
  ["achievement.single.speed_runner", legacyCopyFor("single", "speed_runner")],
  ["achievement.single.collector", legacyCopyFor("single", "collector")],
  ["achievement.single.rich", legacyCopyFor("single", "rich")],
  ["achievement.multi.first_duel", legacyCopyFor("multi", "first_duel")],
  ["achievement.multi.first_win", legacyCopyFor("multi", "first_win")],
  ["achievement.multi.duel_regular", legacyCopyFor("multi", "duel_regular")],
  ["achievement.multi.champion", legacyCopyFor("multi", "champion")],
  ["achievement.multi.code_crack", legacyCopyFor("multi", "code_crack")],
  ["achievement.multi.collector", legacyCopyFor("multi", "collector")],
];

const serverAchievementEntries = [
  ["single.first_crack", serverCopyFor("single", "first_crack")],
  ["single.codebreaker", serverCopyFor("single", "codebreaker")],
  ["single.finisher", serverCopyFor("single", "finisher")],
  ["single.completionist", serverCopyFor("single", "completionist")],
  ["single.code_hunter", serverCopyFor("single", "code_hunter")],
  ["single.sharp_shooter", serverCopyFor("single", "sharp_shooter")],
  ["single.quick_thinker", serverCopyFor("single", "quick_thinker")],
  ["single.speed_demon", serverCopyFor("single", "speed_demon")],
  ["single.collector", serverCopyFor("single", "collector")],
  ["single.treasurer", serverCopyFor("single", "treasurer")],
  ["single.high_scorer", serverCopyFor("single", "high_scorer")],
  ["multi.first_match", serverCopyFor("multi", "first_match")],
  ["multi.regular", serverCopyFor("multi", "regular")],
  ["multi.first_win", serverCopyFor("multi", "first_win")],
  ["multi.champion", serverCopyFor("multi", "champion")],
  ["multi.code_hunter", serverCopyFor("multi", "code_hunter")],
  ["multi.sharp_shooter", serverCopyFor("multi", "sharp_shooter")],
  ["multi.elite", serverCopyFor("multi", "elite")],
  ["multi.high_scorer", serverCopyFor("multi", "high_scorer")],
  ["multi.score_machine", serverCopyFor("multi", "score_machine")],
  ["multi.collector", serverCopyFor("multi", "collector")],
  ["multi.treasurer", serverCopyFor("multi", "treasurer")],
];

const achievementCopyEntries = [
  ...legacyAchievementEntries,
  ...serverAchievementEntries,
  ...achievementEntries.map((id) => [id, copyFor(id)]),
];

/**
 * Stable id -> translation-key mapping for achievement copy.
 *
 * The server response remains authoritative for new rows.  These entries are a
 * compatibility layer for the catalog IDs used by the first achievement seed.
 */
const achievementCopyMap = Object.fromEntries(achievementCopyEntries);
for (const [id, copy] of achievementCopyEntries) {
  const aliases = new Set([
    id,
    id.replace(/\./g, "_"),
    id.replace(/^achievement[._]/, ""),
    id.replace(/^achievement[._]/, "").replace(/\./g, "_"),
  ]);
  for (const alias of aliases) {
    if (alias) achievementCopyMap[alias] = copy;
  }
}
export const achievementCopy = Object.freeze(achievementCopyMap);

const achievementFallbacks = {
  first_crack: ["First crack", "Crack your first code."],
  first_code: ["First crack", "Crack your first code."],
  first_solve: ["First crack", "Crack your first code."],
  first_win: ["First win", "Win your first duel."],
  first_duel: ["First duel", "Play your first duel."],
  first_duel_win: ["First duel win", "Win your first duel."],
  ten_codes: ["Code starter", "Crack ten codes in this mode."],
  ten_code: ["Code starter", "Crack ten codes in this mode."],
  fifty_codes: ["Pattern finder", "Crack fifty codes in this mode."],
  fifty_code: ["Pattern finder", "Crack fifty codes in this mode."],
  ninety_codes: ["Vault master", "Crack all ninety solo codes."],
  all_codes: ["Vault master", "Crack every code in the vault."],
  code_collector: ["Code collector", "Build a serious collection of cracked codes."],
  easy_master: ["Easy does it", "Complete the easy track."],
  easy_complete: ["Easy does it", "Complete the easy track."],
  medium_master: ["Pattern scout", "Complete the medium track."],
  medium_complete: ["Pattern scout", "Complete the medium track."],
  hard_master: ["Vault breaker", "Complete the hard track."],
  hard_complete: ["Vault breaker", "Complete the hard track."],
  all_difficulties: ["All-rounder", "Complete every solo difficulty."],
  vault_master: ["Vault master", "Complete every solo difficulty."],
  perfect_run: ["Perfect run", "Finish a run without a wrong answer."],
  flawless: ["Flawless", "Finish a run without a wrong answer."],
  streak_3: ["On a roll", "Keep a three-win streak alive."],
  streak_7: ["Hot streak", "Keep a seven-win streak alive."],
  streak_30: ["Unstoppable", "Keep a thirty-win streak alive."],
  duel_streak_3: ["Duel streak", "Win three duels in a row."],
  duel_streak_7: ["Duel specialist", "Win seven duels in a row."],
  duel_streak_30: ["Duel legend", "Win thirty duels in a row."],
  ten_wins: ["Duel contender", "Win ten duels."],
  twenty_five_wins: ["Duel contender", "Win twenty-five duels."],
  fifty_wins: ["Duel champion", "Win fifty duels."],
  category_sweep: ["Category sweep", "Solve every category at least once."],
  all_rounder: ["All-rounder", "Make your mark across every arena."],
  sharp_shooter: ["Sharp shooter", "Convert difficult clues into wins."],
  sharpshooter: ["Sharp shooter", "Convert difficult clues into wins."],
  solo_first_crack: ["First crack", "Crack your first solo code."],
  solo_ten_codes: ["Code starter", "Crack ten solo codes."],
  multi_first_win: ["First duel win", "Win your first multiplayer duel."],
  multi_ten_wins: ["Duel contender", "Win ten multiplayer duels."],
  "single.first_crack": ["First crack", "Crack your first code."],
  "single.codebreaker": ["Codebreaker", "Complete ten solo levels."],
  "single.finisher": ["Finisher", "Complete a full thirty-level run."],
  "single.completionist": ["Completionist", "Complete all ninety solo levels."],
  "single.code_hunter": ["Code hunter", "Crack twenty-five solo codes."],
  "single.sharp_shooter": ["Sharp shooter", "Keep your solo accuracy above eighty percent."],
  "single.quick_thinker": ["Quick thinker", "Complete a solo level in thirty seconds or less."],
  "single.speed_demon": ["Speed demon", "Complete ten solo levels at speed."],
  "single.collector": ["Collector", "Collect three items in the solo shop."],
  "single.treasurer": ["Treasurer", "Earn five hundred lifetime solo coins."],
  "single.high_scorer": ["High scorer", "Reach ten thousand solo points."],
  "multi.first_match": ["First match", "Play your first multiplayer match."],
  "multi.regular": ["Regular", "Play twenty-five multiplayer matches."],
  "multi.first_win": ["First win", "Win your first multiplayer match."],
  "multi.champion": ["Champion", "Win ten multiplayer matches."],
  "multi.code_hunter": ["Code hunter", "Crack twenty-five multiplayer codes."],
  "multi.sharp_shooter": ["Sharp shooter", "Keep your multiplayer accuracy above seventy-five percent."],
  "multi.elite": ["Elite", "Keep your multiplayer accuracy above ninety percent."],
  "multi.high_scorer": ["High scorer", "Reach one thousand multiplayer points."],
  "multi.score_machine": ["Score machine", "Reach five thousand multiplayer points."],
  "multi.collector": ["Collector", "Collect three items in the duel shop."],
  "multi.treasurer": ["Treasurer", "Earn three hundred lifetime duel coins."],
};

const metricDefinitions = {
  codes: {
    labelKey: "leaderboard.codes",
    fallback: "Codes cracked",
    aliases: ["codes_cracked", "solved", "cracked", "code_count"],
  },
  score: {
    labelKey: "leaderboard.score",
    fallback: "Score",
    aliases: ["total_score", "points", "best_score"],
  },
  accuracy: {
    labelKey: "leaderboard.accuracy",
    fallback: "Accuracy",
    aliases: ["accuracy_percent", "hit_rate"],
    percentage: true,
  },
  levels: {
    labelKey: "leaderboard.levels",
    fallback: "Levels completed",
    aliases: ["level_count", "completed_levels"],
  },
  speed: {
    labelKey: "leaderboard.metric.speed",
    fallback: "Fast solves",
    aliases: ["fast_solves", "speed_count", "fast_rounds"],
  },
  inventory: {
    labelKey: "leaderboard.metric.inventory",
    fallback: "Items collected",
    aliases: ["items", "inventory_count", "owned_items"],
  },
  wallet: {
    labelKey: "leaderboard.metric.wallet",
    fallback: "Lifetime earnings",
    aliases: ["lifetime_earned", "coins", "earnings"],
  },
  wins: {
    labelKey: "leaderboard.wins",
    fallback: "Duel wins",
    aliases: ["duels_won", "duel_wins", "victories"],
  },
  matches: {
    labelKey: "leaderboard.matches",
    fallback: "Duels played",
    aliases: ["duels_played", "games_played", "rounds"],
  },
  win_rate: {
    labelKey: "leaderboard.winRate",
    fallback: "Win rate",
    aliases: ["win_percent", "win_percentage", "winrate"],
    percentage: true,
  },
};

const metricAliases = Object.fromEntries(
  Object.entries(metricDefinitions).flatMap(([key, definition]) => [
    [key, key],
    ...definition.aliases.map((alias) => [alias, key]),
  ]),
);

export const defaultMetric = Object.freeze({
  single: "codes",
  multi: "wins",
});

export const metricOptionsByMode = Object.freeze({
  single: Object.freeze([
    "levels",
    "codes",
    "accuracy",
    "speed",
    "inventory",
    "wallet",
    "score",
  ]),
  multi: Object.freeze([
    "matches",
    "wins",
    "win_rate",
    "codes",
    "accuracy",
    "speed",
    "inventory",
    "wallet",
    "score",
  ]),
});

export function normalizeMode(mode) {
  return mode === "multi" ? "multi" : "single";
}

export function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function safeText(value, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function safeBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function translateOr(t, key, fallback, values) {
  if (typeof t !== "function" || typeof key !== "string" || !key) {
    return fallback;
  }
  const translated = t(key, values);
  return translated && translated !== key ? translated : fallback;
}

export function translateFirst(t, keys, fallback, values) {
  const candidates = Array.isArray(keys) ? keys : [keys];
  for (const key of candidates) {
    const translated = translateOr(t, key, "", values);
    if (translated) return translated;
  }
  return fallback;
}

export function humanizeToken(value, fallback = "Achievement") {
  const token = normalizeToken(value);
  if (!token) return fallback;
  return token
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeMetric(value) {
  const token = normalizeToken(value);
  return metricAliases[token] || token;
}

export function metricDefinition(value) {
  const key = normalizeMetric(value);
  return (
    metricDefinitions[key] || {
      labelKey: `leaderboard.metric.${key || "value"}`,
      fallback: humanizeToken(value, "Value"),
      percentage: false,
    }
  );
}

export function metricLabelKey(value) {
  return metricDefinition(value).labelKey;
}

export function isPercentageMetric(value) {
  return Boolean(metricDefinition(value).percentage);
}

export function getMetricOptions(mode, availableMetrics = []) {
  const normalizedMode = normalizeMode(mode);
  const available = Array.isArray(availableMetrics)
    ? availableMetrics.map((value) => safeText(value, 80)).filter(Boolean)
    : [];
  return Array.from(
    new Set([...metricOptionsByMode[normalizedMode], ...available]),
  ).map((value) => ({ value, key: normalizeMetric(value) }));
}

export function getAchievementCopy(item = {}) {
  const source = item && typeof item === "object" ? item : {};
  const rawId = safeText(source.id, 120);
  const rawKey = safeText(source.key, 120);
  const idToken = normalizeToken(rawId);
  const keyToken = normalizeToken(rawKey);
  const mapped =
    achievementCopy[rawId] ||
    achievementCopy[rawKey] ||
    achievementCopy[idToken] ||
    achievementCopy[keyToken] ||
    null;
  const slug = rawKey || rawId || keyToken || idToken || "achievement";
  const rpcTitleKey =
    safeText(source.titleKey, 160) || safeText(source.title_key, 160);
  const rpcDescriptionKey =
    safeText(source.descriptionKey, 160) ||
    safeText(source.description_key, 160);
  const fallback =
    achievementFallbacks[rawKey] ||
    achievementFallbacks[rawId] ||
    achievementFallbacks[keyToken] ||
    achievementFallbacks[idToken] || [
      humanizeToken(rawKey || rawId, "Achievement"),
      "Keep going to unlock this milestone.",
    ];

  return {
    titleKey:
      mapped?.titleKey ||
      rpcTitleKey ||
      `achievements.items.${slug}.title`,
    // The catalog intentionally uses one translated, mode-neutral description
    // for server-owned milestone rows; the title and metric carry the specific
    // achievement identity. This keeps every locale complete without inventing
    // untranslated pseudo-copy in the client.
    descriptionKey: mapped
      ? "achievements.description"
      : rpcDescriptionKey || `achievements.items.${slug}.description`,
    alternateTitleKey: mapped?.rpcTitleKey || "",
    alternateDescriptionKey: mapped?.rpcDescriptionKey || "",
    fallbackTitle: fallback[0],
    fallbackDescription: fallback[1],
  };
}

export function getInitialsForUsername(username, fallback = "?") {
  const safeName = safeText(username, 80) || fallback;
  return getInitials(safeName);
}

/** Resolve only the public avatar fields returned by get_leaderboard. */
export function getSafeAvatarUrl(row = {}) {
  const source = row && typeof row === "object" ? row : {};
  const rawPath =
    safeText(source.avatar_url, 2048) || safeText(source.avatar_path, 2048);
  if (!rawPath) return "";
  if (
    !supabase ||
    rawPath.startsWith("data:") ||
    /^https?:\/\//i.test(rawPath) ||
    rawPath.includes("..")
  ) {
    return "";
  }

  const bucket = safeText(source.avatar_bucket, 80) || "avatars";
  if (!/^(avatars|profile-media)$/i.test(bucket)) return "";
  const path = rawPath.replace(/^\/+/, "");
  if (!path || !/^[A-Za-z0-9._/-]+$/.test(path)) return "";
  try {
    return (
      supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl || ""
    );
  } catch {
    return "";
  }
}

export function getSafeAvatarMediaType(row = {}) {
  const sourceRow = row && typeof row === "object" ? row : {};
  const mediaType = safeText(sourceRow.avatar_media_type, 80).toLowerCase();
  if (
    (mediaType.startsWith("image/") || mediaType.startsWith("video/")) &&
    /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mediaType)
  ) {
    return mediaType;
  }

  const source =
    safeText(sourceRow.avatar_url, 2048) ||
    safeText(sourceRow.avatar_path, 2048);
  const bucket = safeText(sourceRow.avatar_bucket, 80).toLowerCase();
  if (
    /\.(mp4|m4v|mov|webm|ogv|3gp|3g2|mkv)$/i.test(source) ||
    bucket === "profile-media"
  ) {
    return "video/mp4";
  }
  if (bucket === "avatars" || /\.(jpe?g|png|webp|gif|avif|heic|heif|svg)$/i.test(source)) {
    const extension = String(source).split(".").pop()?.toLowerCase();
    const imageTypes = {
      gif: "image/gif",
      webp: "image/webp",
      avif: "image/avif",
      svg: "image/svg+xml",
      png: "image/png",
      heic: "image/heic",
      heif: "image/heif",
    };
    return imageTypes[extension] || "image/jpeg";
  }
  return "";
}

export function isRpcSignatureError(error) {
  const code = String(error?.code || "").toUpperCase();
  if (["PGRST202", "42883", "42P01"].includes(code)) return true;
  const message = String(error?.message || error || "").toLowerCase();
  return /(function|parameter|argument|signature|does not exist|unknown column)/.test(
    message,
  );
}

/*
 * These classes are intentionally kept in a new module because the feature
 * pages are shipped before a shared stylesheet refactor.  They use the app's
 * existing color, radius, and shadow variables, so light/dark themes continue
 * to work without touching styles.css.
 */
export const gameDataStyles = `
.achievement-mode-strip,
.leaderboard-controls-card,
.leaderboard-auth-note,
.achievement-state-card {
  border-radius: var(--radius-md);
}

.achievement-mode-strip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 104px;
  margin-bottom: 25px;
  padding: 20px 23px;
  overflow: hidden;
  background: var(--accent);
  color: #000;
}

.achievement-mode-strip::after {
  position: absolute;
  right: -44px;
  bottom: -96px;
  width: 240px;
  height: 240px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 50%;
  box-shadow: 0 0 0 24px rgba(0, 0, 0, 0.035), 0 0 0 48px rgba(0, 0, 0, 0.025);
  content: "";
  pointer-events: none;
}

.achievement-mode-strip.multi {
  background: var(--violet);
}

.achievement-mode-mark {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.1);
}

.achievement-mode-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.achievement-mode-copy .section-eyebrow {
  color: rgba(0, 0, 0, 0.58);
}

.achievement-mode-copy h2 {
  margin: 5px 0 4px;
  font-size: 21px;
  letter-spacing: -0.05em;
}

.achievement-mode-copy p {
  max-width: 560px;
  margin: 0;
  color: rgba(0, 0, 0, 0.63);
  font-size: 10px;
  line-height: 1.45;
}

.achievement-mode-total {
  position: relative;
  z-index: 1;
  min-width: 90px;
  padding-inline-start: 19px;
  border-inline-start: 1px solid rgba(0, 0, 0, 0.16);
  text-align: end;
}

.achievement-mode-total strong,
.achievement-mode-total span {
  display: block;
}

.achievement-mode-total strong {
  font-size: 25px;
  letter-spacing: -0.07em;
}

.achievement-mode-total span {
  margin-top: 3px;
  color: rgba(0, 0, 0, 0.58);
  font-family: "DM Mono", monospace;
  font-size: 8px;
}

.achievement-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 31px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
  gap: 13px;
}

.achievement-card {
  min-width: 0;
  min-height: 265px;
  padding: 19px;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.achievement-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.achievement-card.unlocked {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--surface));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.achievement-card.locked {
  background: var(--surface);
}

.achievement-card-top,
.achievement-card-heading,
.achievement-progress-meta,
.achievement-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
}

.achievement-card-top {
  align-items: flex-start;
}

.achievement-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 43px;
  flex: 0 0 auto;
  border-radius: 14px;
  background: var(--surface-deep);
  color: var(--muted);
}

.achievement-icon.lime {
  background: var(--accent);
  color: #000;
}

.achievement-icon.violet {
  background: var(--violet);
  color: #000;
}

.achievement-icon.coral {
  background: var(--coral);
  color: #000;
}

.achievement-icon.blue {
  background: var(--blue);
  color: #000;
}

.achievement-card-heading {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
}

.achievement-card-heading h3 {
  margin: 17px 0 0;
  font-size: 16px;
  letter-spacing: -0.04em;
}

.achievement-card-heading p {
  min-height: 43px;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.achievement-metric-label {
  color: var(--muted-light);
  font-family: "DM Mono", monospace;
  font-size: 8px;
  text-align: end;
}

.achievement-progress {
  margin-top: 17px;
}

.achievement-progress-meta {
  margin-bottom: 7px;
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 8px;
}

.achievement-progress-meta strong {
  color: var(--ink);
  font-weight: 500;
}

.achievement-card-foot {
  min-height: 27px;
  margin-top: 13px;
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 8px;
}

.achievement-card-foot svg {
  flex: 0 0 auto;
}

.achievement-unlocked-date {
  color: var(--muted);
}

.achievement-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
  gap: 13px;
}

.achievement-skeleton-card,
.leaderboard-skeleton-row {
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.achievement-skeleton-card {
  min-height: 265px;
  padding: 19px;
}

.achievement-skeleton-line,
.leaderboard-skeleton-block {
  border-radius: 8px;
  background: linear-gradient(100deg, var(--surface-deep) 20%, var(--surface-soft) 40%, var(--surface-deep) 60%);
  background-size: 200% 100%;
  animation: gameDataSkeleton 1.35s ease-in-out infinite;
}

.achievement-skeleton-icon {
  width: 43px;
  height: 43px;
  border-radius: 14px;
}

.achievement-skeleton-title {
  width: 62%;
  height: 16px;
  margin-top: 23px;
}

.achievement-skeleton-copy {
  width: 92%;
  height: 10px;
  margin-top: 12px;
}

.achievement-skeleton-copy.short {
  width: 76%;
  margin-top: 7px;
}

.achievement-skeleton-progress {
  width: 100%;
  height: 7px;
  margin-top: 27px;
}

.achievement-state-card {
  min-height: 220px;
  padding: 10px 22px;
}

.leaderboard-controls-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 82px;
  margin-bottom: 17px;
  padding: 17px 21px;
}

.leaderboard-controls-copy {
  min-width: 0;
}

.leaderboard-controls-copy h2 {
  margin: 5px 0 0;
  font-size: 19px;
  letter-spacing: -0.04em;
}

.leaderboard-metric-control {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: min(100%, 300px);
}

.leaderboard-metric-control > span {
  flex: 0 0 auto;
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.leaderboard-select {
  min-width: 145px;
  flex: 1;
}

.leaderboard-select .select-menu-trigger {
  min-height: 37px;
  background: var(--surface-soft);
}

.leaderboard-auth-note {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 17px;
  padding: 12px 15px;
  background: color-mix(in srgb, var(--violet) 15%, var(--surface));
  color: var(--ink);
}

.leaderboard-auth-note > svg {
  flex: 0 0 auto;
  color: var(--violet);
}

.leaderboard-auth-note > div {
  min-width: 0;
  flex: 1;
}

.leaderboard-auth-note strong,
.leaderboard-auth-note span {
  display: block;
}

.leaderboard-auth-note strong {
  font-size: 10px;
}

.leaderboard-auth-note span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.4;
}

.leaderboard-list-card {
  padding: 19px 21px 21px;
}

.leaderboard-list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.leaderboard-list-heading h2 {
  margin: 5px 0 0;
  font-size: 19px;
  letter-spacing: -0.04em;
}

.leaderboard-list-heading > span {
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 8px;
}

.global-leaderboard-list {
  display: grid;
  gap: 5px;
}

.global-leaderboard-row {
  display: grid;
  grid-template-columns: 35px 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 7px 9px;
  border-radius: 13px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.global-leaderboard-row:hover {
  background: var(--surface-soft);
  transform: translateX(2px);
}

.global-leaderboard-row.current {
  background: color-mix(in srgb, var(--accent) 18%, var(--surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 38%, transparent);
}

.global-leaderboard-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--surface-deep);
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 10px;
  font-weight: 500;
}

.global-leaderboard-rank.top-1 {
  background: var(--gold);
  color: #000;
}

.global-leaderboard-rank.top-2 {
  background: var(--violet);
  color: #000;
}

.global-leaderboard-rank.top-3 {
  background: var(--coral);
  color: #000;
}

.global-leaderboard-avatar,
.leaderboard-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 12px;
  background: var(--surface-deep);
  color: var(--ink);
  font-size: 10px;
  font-weight: 700;
}

.global-leaderboard-avatar img,
.global-leaderboard-avatar video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.leaderboard-avatar-fallback.gold {
  background: var(--gold);
  color: #000;
}

.leaderboard-avatar-fallback.lime {
  background: var(--accent);
  color: #000;
}

.leaderboard-avatar-fallback.violet {
  background: var(--violet);
  color: #000;
}

.leaderboard-avatar-fallback.coral {
  background: var(--coral);
  color: #000;
}

.leaderboard-avatar-fallback.blue {
  background: var(--blue);
  color: #000;
}

.global-leaderboard-player {
  min-width: 0;
}

.global-leaderboard-player > div,
.global-leaderboard-player strong {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.global-leaderboard-player strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-leaderboard-player small {
  overflow: hidden;
  margin-top: 4px;
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-leaderboard-you {
  padding: 2px 5px;
  border-radius: 5px;
  background: var(--accent);
  color: #000;
  font-family: "DM Mono", monospace;
  font-size: 7px;
  font-weight: 500;
  white-space: nowrap;
}

.global-leaderboard-value {
  min-width: 74px;
  text-align: end;
}

.global-leaderboard-value strong,
.global-leaderboard-value span {
  display: block;
}

.global-leaderboard-value strong {
  font-family: "DM Mono", monospace;
  font-size: 12px;
  font-weight: 500;
}

.global-leaderboard-value span {
  margin-top: 3px;
  color: var(--muted);
  font-family: "DM Mono", monospace;
  font-size: 7px;
}

.leaderboard-skeleton-list {
  display: grid;
  gap: 5px;
}

.leaderboard-skeleton-row {
  display: grid;
  grid-template-columns: 28px 36px minmax(0, 1fr) 74px;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 7px 9px;
}

.leaderboard-skeleton-block.rank {
  width: 28px;
  height: 28px;
}

.leaderboard-skeleton-block.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.leaderboard-skeleton-block.name {
  width: 42%;
  height: 11px;
}

.leaderboard-skeleton-block.value {
  width: 74px;
  height: 13px;
}

.leaderboard-skeleton-lines {
  display: grid;
  gap: 6px;
}

.leaderboard-skeleton-line {
  width: 62%;
  height: 8px;
  border-radius: 6px;
  background: var(--surface-deep);
}

@keyframes gameDataSkeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 760px) {
  .achievement-summary-grid {
    grid-template-columns: 1fr;
  }

  .achievement-mode-strip {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .achievement-mode-copy {
    flex-basis: calc(100% - 70px);
  }

  .achievement-mode-total {
    width: 100%;
    padding: 13px 0 0;
    border-top: 1px solid rgba(0, 0, 0, 0.16);
    border-inline-start: 0;
    text-align: start;
  }

  .leaderboard-controls-card {
    align-items: stretch;
    flex-direction: column;
  }

  .leaderboard-metric-control {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 520px) {
  .achievement-mode-strip {
    padding: 17px;
  }

  .achievement-mode-mark {
    width: 45px;
    height: 45px;
  }

  .achievement-mode-copy h2 {
    font-size: 18px;
  }

  .global-leaderboard-row,
  .leaderboard-skeleton-row {
    grid-template-columns: 28px 34px minmax(0, 1fr) auto;
    gap: 7px;
    padding-inline: 5px;
  }

  .global-leaderboard-avatar,
  .leaderboard-avatar-fallback {
    width: 34px;
    height: 34px;
    border-radius: 11px;
  }

  .global-leaderboard-value {
    min-width: 55px;
  }

  .global-leaderboard-value span {
    display: none;
  }

  .global-leaderboard-player strong {
    font-size: 10px;
  }

  .leaderboard-auth-note {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .leaderboard-auth-note .button {
    margin-inline-start: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root:not([data-reduce-motion]) .achievement-card,
  :root:not([data-reduce-motion]) .global-leaderboard-row,
  :root:not([data-reduce-motion]) .achievement-skeleton-line,
  :root:not([data-reduce-motion]) .leaderboard-skeleton-block {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}

:root[data-reduce-motion="true"] .achievement-card,
:root[data-reduce-motion="true"] .global-leaderboard-row,
:root[data-reduce-motion="true"] .achievement-skeleton-line,
:root[data-reduce-motion="true"] .leaderboard-skeleton-block,
.reduce-motion-safe .achievement-card,
.reduce-motion-safe .global-leaderboard-row,
.reduce-motion-safe .achievement-skeleton-line,
.reduce-motion-safe .leaderboard-skeleton-block {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}
`;
