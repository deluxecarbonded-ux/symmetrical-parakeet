import fs from "node:fs";
import { LANGUAGES, translations } from "../src/i18n/translations.js";
import { WORD_PUZZLES } from "../src/data/puzzles.js";

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const rows = [];

for (const [locale] of LANGUAGES) {
  for (const puzzle of Object.values(WORD_PUZZLES)) {
    rows.push(
      `(${quote(locale)}, ${quote(puzzle.answerKey)}, ${quote(translations[locale][puzzle.answerKey])})`,
    );
  }
}

const sql = `-- Generated localized word-answer entries for server-side validation.\ninsert into public.translation_entries(catalog_id, key, value)\nselect catalog.id, seed.key, seed.value\nfrom (values\n  ${rows.join(",\n  ")}\n) as seed(locale, key, value)\njoin public.translation_catalogs catalog on catalog.locale = seed.locale\non conflict (catalog_id, key) do update set value = excluded.value;\n`;
fs.writeFileSync("supabase/puzzle_answer_seed.sql", sql);
console.log(`Wrote ${rows.length} localized answer entries.`);
