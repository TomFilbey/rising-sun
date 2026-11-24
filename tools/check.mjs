// Quick health check for the Rising Sun stats page. No installs needed, just Node.
//   node tools/check.mjs              checks ../index.html
//   node tools/check.mjs other.html   checks a downloaded copy
//
// It verifies:
//   1. the <script id="battle-data"> block is valid JSON
//   2. every battle follows the same rules the Ledger enforces (names, points, clans, Kami, betrayals)
//   3. every inline <script> compiles (catches typos before anyone opens the page)
// Exit code 0 = all good, 1 = problems found.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] || resolve(here, "..", "index.html"));
const html = readFileSync(file, "utf8");

const problems = [];
const warnings = [];
const CLANS = ["Koi", "Sun", "Lotus", "Turtle", "Dragonfly", "Fox", "Bonsai", "Moon"];
const PARTIAL = ["winnerOnly", "unknownField"];

// ---- 1. battle data -------------------------------------------------------
const m = html.match(/<script type="application\/json" id="battle-data">([\s\S]*?)<\/script>/);
let games = [];
if (!m) problems.push('No <script type="application/json" id="battle-data"> block found.');
else {
  try { games = JSON.parse(m[1]); }
  catch (e) { problems.push(`Battle data is not valid JSON: ${e.message}`); }
}
if (!Array.isArray(games)) { problems.push("Battle data must be a JSON array."); games = []; }

// ---- 2. battle rules (mirror of the Ledger's Save checks) -----------------
const ids = new Set();
games.forEach((b, i) => {
  const L = `Battle ${i + 1}`;
  if (b.n !== undefined && b.n !== i + 1) warnings.push(`${L}: "n" is ${b.n}, expected ${i + 1} (battles are numbered by position).`);
  if (b.id) { if (ids.has(b.id)) problems.push(`${L}: duplicate id "${b.id}".`); ids.add(b.id); }
  if (b.partial && !PARTIAL.includes(b.partial)) problems.push(`${L}: unknown "partial" value "${b.partial}".`);
  if (!Array.isArray(b.results) || !b.results.length) { problems.push(`${L}: has no results.`); return; }
  if (!b.partial && b.results.length < 3) problems.push(`${L}: needs at least 3 warlords.`);
  if (b.results.length > 6) problems.push(`${L}: more than 6 warlords.`);
  const names = new Set(), clans = new Set();
  let prev = Infinity;
  b.results.forEach((r, ri) => {
    if (!Array.isArray(r) || r.length < 3 || r.length > 4) { problems.push(`${L}, row ${ri + 1}: each result must be [name, points, clan] or [name, points, clan, betrayals].`); return; }
    const [name, pts, clan, bt] = r;
    if (typeof name !== "string" || !name.trim()) problems.push(`${L}, row ${ri + 1}: missing name.`);
    if (/[<>"`]/.test(name || "")) problems.push(`${L}: name "${name}" contains characters the page strips (< > " \`).`);
    const key = String(name).trim().toLowerCase();
    if (names.has(key)) problems.push(`${L}: ${name} is listed twice.`);
    names.add(key);
    if (pts === null) { if (!b.partial) problems.push(`${L}: ${name} has no points (only partial battles may).`); }
    else if (!Number.isInteger(pts) || pts < 0 || pts > 300) problems.push(`${L}: ${name} has invalid points ${JSON.stringify(pts)}.`);
    else if (!b.partial) { if (pts > prev) warnings.push(`${L}: results aren't in finishing order (${name} ${pts} after ${prev}).`); prev = pts; }
    if (clan !== null) {
      if (!CLANS.includes(clan)) problems.push(`${L}: ${name} has unknown clan "${clan}".`);
      if (clans.has(clan)) problems.push(`${L}: two warlords play the ${clan} Clan.`);
      clans.add(clan);
    }
    if (bt !== undefined && (!Number.isInteger(bt) || bt < 0 || bt > 20)) problems.push(`${L}: ${name} has invalid betrayals ${JSON.stringify(bt)}.`);
  });
  const kami = (b.kami || []).map((k) => String(k).toLowerCase());
  if (kami.length > 4) problems.push(`${L}: more than 4 Kami.`);
  if (new Set(kami).size !== kami.length) problems.push(`${L}: a Kami is listed twice.`);
  if (b.photo !== undefined && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo)) problems.push(`${L}: photo is not an inline image.`);
});

// ---- 3. inline scripts compile --------------------------------------------
const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");   // the file-map comment mentions <script> tags
const scripts = [...withoutComments.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g)].map((x) => x[1]);
scripts.forEach((src, i) => {
  try { new vm.Script(src, { filename: `inline-script-${i + 1}.js` }); }
  catch (e) { problems.push(`Inline script ${i + 1} doesn't compile: ${e.message}`); }
});

// ---- report ---------------------------------------------------------------
const photos = games.filter((g) => g.photo).length;
console.log(`Checked ${file}`);
console.log(`  ${games.length} battles, ${games.reduce((s, g) => s + (g.results || []).length, 0)} results, ${photos} photo${photos === 1 ? "" : "s"}, ${scripts.length} scripts, ${(html.length / 1024).toFixed(0)} KB`);
warnings.forEach((w) => console.log(`  warning: ${w}`));
if (problems.length) {
  problems.forEach((p) => console.log(`  PROBLEM: ${p}`));
  console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"} found.`);
  process.exit(1);
}
console.log("\nAll good.");
