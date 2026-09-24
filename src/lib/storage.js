import { useState } from "react";
import {
  formatLocalizedInteger,
  getNumberingLocale,
  localizeDigitsInText,
} from "./numerals.js";

export const DEFAULT_PLAYER_NAME = "";

export function useMemoryValue(fallback) {
  const [value, setValue] = useState(fallback);
  return [value, setValue];
}

export function makeId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatNumber(value, locale) {
  return formatLocalizedInteger(value || 0, locale || "en", {
    notation: value > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  });
}

export function formatDate(value, locale) {
  if (!value) return "";
  return localizeDigitsInText(
    new Intl.DateTimeFormat(getNumberingLocale(locale || "en"), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value)),
    locale || "en",
  );
}

export function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "E"
  );
}
