import fs from "node:fs";
import path from "node:path";
import {
  PUZZLE_PROMPTS,
  WORD_PROMPTS,
  WORD_PUZZLES,
} from "../src/data/puzzles.js";
import { localeCoverage, translations } from "../src/i18n/translations.js";

const sourceFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (/\.(js|jsx)$/.test(entry.name)) sourceFiles.push(filePath);
  }
};

walk("src");
const knownKeys = new Set(Object.keys(translations.en));
const usedKeys = new Set();
for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
    usedKeys.add(match[1]);
  }
}

for (const level of Object.keys(PUZZLE_PROMPTS)) {
  usedKeys.add(`puzzle.prompt.${level}`);
}
for (const level of Object.keys(WORD_PROMPTS)) {
  usedKeys.add(`puzzle.wordPrompt.${level}`);
}
for (const puzzle of Object.values(WORD_PUZZLES)) {
  usedKeys.add(puzzle.answerKey);
}
for (const category of ["math", "logic", "riddle", "science", "trivia"]) {
  usedKeys.add(`category.${category}`);
}
for (const difficulty of ["easy", "medium", "hard"]) {
  usedKeys.add(`difficulty.${difficulty}`);
  usedKeys.add(`difficulty.${difficulty}Description`);
}

const expectedLocaleKeys = Object.keys(translations.en).length;
const placeholderPattern = /\{(\w+)\}/g;
const placeholderNames = (value) =>
  [...String(value).matchAll(placeholderPattern)]
    .map((match) => match[1])
    .sort();
const placeholderMismatches = Object.entries(translations)
  .filter(([locale]) => locale !== "en")
  .flatMap(([locale, dictionary]) =>
    Object.keys(translations.en)
      .filter(
        (key) =>
          JSON.stringify(placeholderNames(translations.en[key])) !==
          JSON.stringify(placeholderNames(dictionary[key])),
      )
      .map((key) => `${locale}.${key}`),
  );

const incompleteLocales = Object.entries(localeCoverage)
  .filter(([locale, count]) => locale !== "en" && count < expectedLocaleKeys)
  .map(([locale, count]) => `${locale} (${count}/${expectedLocaleKeys})`);

const missing = [...usedKeys].filter((key) => !knownKeys.has(key));
const forbiddenUiCopy = /supabase|realtime|openrouter|open router|database/i;
const technologyCopyLeaks = Object.entries(translations).flatMap(
  ([locale, dictionary]) =>
    Object.entries(dictionary)
      .filter(([, value]) => forbiddenUiCopy.test(String(value)))
      .map(([key]) => `${locale}.${key}`),
);
const localeCount = Object.keys(translations).length;
console.log(
  `Checked ${localeCount} locales, ${knownKeys.size} keys, and ${usedKeys.size} static UI references.`,
);
if (incompleteLocales.length) {
  console.error(
    `Incomplete locale dictionaries: ${incompleteLocales.join(", ")}`,
  );
  process.exit(1);
}
if (placeholderMismatches.length) {
  console.error(`Placeholder mismatches: ${placeholderMismatches.join(", ")}`);
  process.exit(1);
}
if (missing.length) {
  console.error(`Missing translation keys: ${missing.join(", ")}`);
  process.exit(1);
}
if (technologyCopyLeaks.length) {
  console.error(
    `Technology references found in UI copy: ${technologyCopyLeaks.join(", ")}`,
  );
  process.exit(1);
}
