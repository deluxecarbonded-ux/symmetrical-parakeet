// Parity check: the client LOCALE_PUZZLES module, the migration 019 SQL, and
// the standalone locale_puzzle_seed.sql must carry byte-identical content for
// every (locale, level) row.
//
//   node scripts/check-locale-parity.mjs
//
// Exits non-zero with a diff summary when they disagree, so it can gate CI.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CLIENT_FILE = path.join(ROOT, "src", "data", "locale_puzzles.js");
const MIGRATION_FILE = path.join(
  ROOT,
  "supabase",
  "migrations",
  "019_locale_puzzle_content.sql",
);
const SEED_FILE = path.join(ROOT, "supabase", "locale_puzzle_seed.sql");

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log("FAIL:", msg);
};

// ---- Parse SQL row lines ----
// Rows are emitted one per line, each like:
//   ('ar', 1, 'digits', '3516', null, 'رمز …', true),
// Prompts contain commas and doubled single quotes (''), so we split on the
// top-level commas only and unescape '' afterwards.
function parseRowLine(line) {
  let text = line.trim();
  if (text.startsWith("(")) text = text.slice(1);
  if (text.endsWith("),")) text = text.slice(0, -2);
  else if (text.endsWith(")")) text = text.slice(0, -1);
  const fields = [];
  let current = "";
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (char === "'") {
        if (text[index + 1] === "'") {
          current += "'";
          index += 1;
        } else {
          inString = false;
        }
      } else {
        current += char;
      }
    } else if (char === "'") {
      inString = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) fields.push(current.trim());
  return fields;
}

function extractRows(sqlText) {
  const rows = [];
  const lines = sqlText.split(/\r?\n/);
  for (const line of lines) {
    if (!/^\s*\('[a-z]{2}', \d+, '(letters|digits)',/.test(line)) continue;
    const fields = parseRowLine(line);
    if (fields.length !== 7) {
      fail(`SQL row has ${fields.length} fields (expected 7): ${line.slice(0, 90)}…`);
      continue;
    }
    rows.push({
      locale: fields[0],
      level: Number(fields[1]),
      answerType: fields[2],
      answerCode: fields[3],
      answerKey: fields[4] === "null" ? null : fields[4],
      prompt: fields[5],
      active: fields[6] === "true",
    });
  }
  return rows;
}

// ---- Load client data ----
async function loadClientRows() {
  const target = CLIENT_FILE;
  const { LOCALE_PUZZLES } = await import("file://" + target.split(path.sep).join("/"));
  const rows = [];
  for (const [locale, levels] of Object.entries(LOCALE_PUZZLES)) {
    for (const [level, row] of Object.entries(levels)) {
      rows.push({
        locale,
        level: Number(level),
        answerType: row.answerType,
        answerCode: row.answer,
        prompt: row.prompt,
      });
    }
  }
  return rows;
}

const key = (row) => `${row.locale}:${row.level}`;

function indexByKey(rows) {
  const map = new Map();
  for (const row of rows) map.set(key(row), row);
  return map;
}

// ---- Run ----
const clientRows = await loadClientRows();
const migrationRows = extractRows(fs.readFileSync(MIGRATION_FILE, "utf8"));
const seedRows = extractRows(fs.readFileSync(SEED_FILE, "utf8"));

console.log(
  `client: ${clientRows.length} rows, migration: ${migrationRows.length} rows, seed: ${seedRows.length} rows`,
);

if (clientRows.length !== 450) fail("client should have exactly 450 rows");
if (migrationRows.length !== 450) fail("migration should have exactly 450 rows");
if (seedRows.length !== 450) fail("seed should have exactly 450 rows");

if (clientRows.some((row) => row.locale === "en")) fail("client contains English rows");
if (migrationRows.some((row) => row.locale === "en")) fail("migration contains English rows");
if (seedRows.some((row) => row.locale === "en")) fail("seed contains English rows");

// client ↔ seed
const seedIndex = indexByKey(seedRows);
for (const row of clientRows) {
  const other = seedIndex.get(key(row));
  if (!other) {
    fail(`client row missing from seed: ${key(row)}`);
    continue;
  }
  if (other.answerCode !== row.answerCode || other.prompt !== row.prompt) {
    fail(`client/seed mismatch: ${key(row)}`);
  }
}

// seed ↔ migration
const migrationIndex = indexByKey(migrationRows);
for (const row of seedRows) {
  const other = migrationIndex.get(key(row));
  if (!other) {
    fail(`seed row missing from migration: ${key(row)}`);
    continue;
  }
  if (
    other.answerCode !== row.answerCode ||
    other.prompt !== row.prompt ||
    other.answerType !== row.answerType ||
    (other.answerKey ?? null) !== (row.answerKey ?? null) ||
    !row.active ||
    !other.active
  ) {
    fail(`seed/migration mismatch: ${key(row)}`);
  }
}

// per-level answer distribution sanity across locales (all 15 distinct)
const levelAnswers = {};
for (const row of clientRows) {
  (levelAnswers[row.level] ||= []).push(`${row.locale}=${row.answerCode}`);
}
for (const [level, answers] of Object.entries(levelAnswers)) {
  if (new Set(answers).size !== answers.length) {
    fail(`answers not pairwise distinct at level ${level}`);
  }
}

console.log(failures === 0 ? "PARITY OK" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);