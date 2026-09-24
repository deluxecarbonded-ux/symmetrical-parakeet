const TONE_RULES = [
  ["error", /error|failed|failure|invalid|unavailable|insufficient|taken|wrong|expired|locked|couldn|cannot|missing/i],
  ["warning", /warning|aiUnavailable|breather/i],
  ["success", /correct|purchased|equipped|signedIn|joined|copied|saved|available|success|completed|cracked|winner|victory|unlocked|updated/i],
];

const TONE_DURATIONS = {
  success: 4200,
  info: 4800,
  warning: 6000,
  error: 7000,
};

export function inferNotificationTone(key = "") {
  const normalized = String(key);
  if (normalized === "toast.aiUnavailable") return "warning";
  for (const [tone, pattern] of TONE_RULES) {
    if (pattern.test(normalized)) return tone;
  }
  return "info";
}

export function notificationDuration(tone = "info") {
  return TONE_DURATIONS[tone] || TONE_DURATIONS.info;
}

export const NOTIFICATION_TONES = Object.freeze({
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
});
