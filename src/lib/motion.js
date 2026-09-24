import { useEffect, useState } from "react";

function systemPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function readMotionPreference() {
  if (typeof document === "undefined") return systemPrefersReducedMotion();
  const explicit = document.documentElement.dataset.reduceMotion;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return systemPrefersReducedMotion();
}

const listeners = new Set();
let observer = null;
let mediaQuery = null;
let currentPreference = readMotionPreference();

function emitPreferenceChange() {
  currentPreference = readMotionPreference();
  listeners.forEach((listener) => listener(currentPreference));
}

function ensureMotionStore() {
  if (typeof document === "undefined" || observer) return;
  currentPreference = readMotionPreference();
  const root = document.documentElement;
  observer =
    typeof MutationObserver === "function"
      ? new MutationObserver(emitPreferenceChange)
      : null;
  observer?.observe(root, {
    attributes: true,
    attributeFilter: ["data-reduce-motion"],
  });
  mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mediaQuery?.addEventListener?.("change", emitPreferenceChange);
}

function subscribeToMotionPreference(listener) {
  ensureMotionStore();
  listeners.add(listener);
  listener(currentPreference);
  return () => listeners.delete(listener);
}

/**
 * Reads the app-level Reduce Motion preference and keeps consuming components
 * in sync when the Settings toggle changes the root data attribute.
 */
export function useReducedMotion(explicitPreference = false) {
  const [preference, setPreference] = useState(readMotionPreference);

  useEffect(() => subscribeToMotionPreference(setPreference), []);

  return Boolean(explicitPreference || preference);
}

export function prefersReducedMotion() {
  return readMotionPreference();
}
