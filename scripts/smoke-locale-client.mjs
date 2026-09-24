// Smoke test: locale overlay in the client puzzle factory.
import { getPuzzle, getPuzzleList } from "../src/data/puzzles.js";

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log("FAIL:", msg);
};

// 1. English row unchanged in shape (prompt text = blueprint word prompt, answerKey set).
const enLetter = getPuzzle("easy", 3, "en");
if (enLetter.answerType !== "letters") fail("EN L3 should be letters");
if (!enLetter.promptKey) fail("EN L3 should keep promptKey");
if (!enLetter.answerKey) fail("EN L3 should keep answerKey");
if (enLetter.answer !== "key") fail(`EN L3 answer should be key, got ${enLetter.answer}`);
const enDigit = getPuzzle("easy", 1, "en");
if (enDigit.answer !== "1247") fail(`EN L1 answer should be 1247, got ${enDigit.answer}`);
if (enDigit.code !== "1247") fail("EN L1 code should be 1247");

// 2. Default locale (no arg) stays English.
if (getPuzzle("easy", 1).answer !== "1247") fail("default locale should be EN");

// 3. Arabic row wins over English content.
const arDigit = getPuzzle("easy", 1, "ar");
if (arDigit.answer === enDigit.answer) fail("ar L1 must differ from EN");
if (arDigit.answerType !== "digits") fail("ar L1 should be digits");
if (!/^[0-9]{4}$/.test(arDigit.answer)) fail("ar L1 answer must be 4 canonical digits");
if (arDigit.prompt === enDigit.prompt) fail("ar L1 prompt must be localized");
if (arDigit.promptKey !== null) fail("locale rows should set promptKey null");

const arLetter = getPuzzle("easy", 3, "ar");
if (arLetter.answerType !== "letters") fail("ar L3 should be letters");
if (arLetter.answerKey !== null) fail("ar L3 answerKey should be null");
if (arLetter.answer === "key") fail("ar L3 answer must differ from EN");
if (arLetter.prompt === enLetter.prompt) fail("ar L3 prompt must be localized");

// 4. All 16 locales render with correct types at every level.
const levels = Array.from({ length: 30 }, (_, i) => i + 1);
const locales = ["en", "ar", "de", "es", "fr", "hi", "id", "it", "ja", "ko", "nl", "pt", "ru", "tr", "ur", "zh"];
const letterLevels = new Set([3, 8, 10, 13, 18, 23, 28]);
for (const locale of locales) {
  for (const level of levels) {
    const p = getPuzzle("medium", level, locale);
    if (!p.prompt) fail(`${locale} L${level} missing prompt`);
    if (p.answerType === undefined) fail(`${locale} L${level} missing answerType`);
    if (letterLevels.has(level) && p.answerType !== "letters") fail(`${locale} L${level} should be letters`);
    if (!letterLevels.has(level) && p.answerType !== "digits") fail(`${locale} L${level} should be digits`);
    if (!p.answer) fail(`${locale} L${level} missing answer`);
    if (level < 1 || level > 30) fail(`${locale} L${level} out of range`);
  }
}

// 5. getPuzzleList threads locale.
const arList = getPuzzleList("hard", "ja");
if (arList.length !== 30) fail("getPuzzleList should return 30");
if (arList[0].answer === getPuzzleList("hard", "en")[0].answer) {
  fail("ja list answer should differ from EN list answer");
}

// 6. Per-level answers are pairwise distinct across the 15 non-EN locales.
for (const level of levels) {
  const answers = locales
    .filter((l) => l !== "en")
    .map((l) => getPuzzle("easy", level, l).answer);
  if (new Set(answers).size !== answers.length) {
    fail(`answers collide at level ${level}`);
  }
}

console.log(failures === 0 ? "CLIENT SMOKE OK" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);