import fs from "node:fs";
import path from "node:path";

const forbidden =
  /localStorage|sessionStorage|BroadcastChannel|readStorage|writeStorage|removeStorage/;
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(filePath);
  }
}

walk("src");
const violations = files
  .filter((filePath) => forbidden.test(fs.readFileSync(filePath, "utf8")))
  .map((filePath) => filePath.replaceAll("\\", "/"));

if (violations.length) {
  console.error(
    `Browser persistence references found:\n${violations.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `Checked ${files.length} source files: no browser persistence APIs found.`,
);
