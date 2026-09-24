// Quick sanity scan of the generated client data module (not the parity
// checker — that one compares client data ↔ migration SQL ↔ seed).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const target = path.join(ROOT, "src", "data", "locale_puzzles.js");
const { LOCALE_PUZZLES } = await import(
  "file://" + target.split(path.sep).join("/")
);
const data = LOCALE_PUZZLES;

const locales = Object.keys(data);
const levels = Array.from({ length: 30 }, (_, i) => i + 1);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log("FAIL:", msg);
};

console.log("locales:", locales.length, locales.join(","));
if ("en" in data) fail("English row present in LOCALE_PUZZLES");
if (locales.length !== 15) fail(`expected 15 locales, got ${locales.length}`);

let count = 0;
for (const loc of locales) {
  for (const lv of levels) {
    const r = data[loc][lv];
    if (!r || !r.prompt || r.answer == null || !r.answerType) {
      fail(`missing row ${loc}/${lv}`);
      continue;
    }
    count += 1;
    if (r.answerType === "digits") {
      if (!/^\d{4}$/.test(r.answer)) fail(`digit answer ${loc}/${lv}=${r.answer}`);
      if (r.answer[0] === "0") fail(`leading zero ${loc}/${lv}=${r.answer}`);
    } else if (r.answerType === "letters") {
      const n = [...r.answer].filter((c) => !/\s/u.test(c)).length;
      if (n < 1 || n > 9) fail(`letter count ${loc}/${lv} «${r.answer}» = ${n}`);
    } else {
      fail(`bad answerType ${loc}/${lv} = ${r.answerType}`);
    }
  }
  // letter levels distinct within locale
  const letterLevels = [3, 8, 10, 13, 18, 23, 28];
  const letterAnswers = letterLevels.map((lv) => data[loc][lv].answer);
  if (new Set(letterAnswers).size !== 7) {
    fail(`letter answers repeat within ${loc}: ${letterAnswers.join("|")}`);
  }
}
if (count !== 15 * 30) fail(`expected 450 rows, got ${count}`);

// pairwise distinct per level across locales
for (const lv of levels) {
  const answers = locales.map((loc) => data[loc][lv].answer);
  if (new Set(answers).size !== answers.length) {
    fail(`answers collide at level ${lv}: ${answers.join(", ")}`);
  }
}

console.log(`rows checked: ${count}`);
console.log(failures === 0 ? "ALL SANITY CHECKS PASSED" : `${failures} FAILURES`);