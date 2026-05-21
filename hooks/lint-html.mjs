#!/usr/bin/env node
// PostToolUse hook: lints HTML produced by skill-build-educational-site.
//
// Wires up via ~/.claude/settings.json:
//   "PostToolUse": [{
//     "matcher": "Write|Edit",
//     "hooks": [{ "type": "command", "command": "node ~/projects/skill-build-educational-site/hooks/lint-html.mjs", "timeout": 15 }]
//   }]
//
// Reads the standard Claude Code hook envelope from stdin, extracts the
// written file path, and runs a checklist matching the SKILL.md validation
// rules + evals.json assertions. Exits 2 with stderr if a check fails so
// Claude sees the feedback and can fix before declaring done.
//
// Gating: only runs if the HTML shows at least 2 signals of being a
// skill-build-educational-site page (audience switcher, TL;DR heading,
// Further reading heading, glossary <dl>, or a kebab-case "*-explained/
// primer/explainer/deep-dive" filename). Otherwise exits 0 silently so it
// doesn't lint unrelated HTML files in other projects.

import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Graceful degradation: if cheerio isn't installed in this skill's
// node_modules (user hasn't run `npm install` yet), exit silently rather
// than spamming Claude's hook channel with import errors.
const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
if (!existsSync(join(skillRoot, "node_modules", "cheerio"))) process.exit(0);
const cheerio = await import("cheerio");

// --- Hook envelope ------------------------------------------------------
let envelope;
try {
  const stdin = readFileSync(0, "utf8");
  envelope = JSON.parse(stdin);
} catch {
  // Not called as a hook — running standalone for testing.
  // Fall back to first CLI arg as a file path.
  const path = process.argv[2];
  if (!path) {
    console.error("Usage (standalone): node lint-html.mjs <file.html>");
    process.exit(64);
  }
  envelope = { tool_name: "Write", tool_input: { file_path: path } };
}

const toolName = envelope.tool_name || "";
if (!/^(Write|Edit|MultiEdit)$/.test(toolName)) process.exit(0);

const filePath = envelope.tool_input?.file_path;
if (!filePath || !/\.html?$/i.test(filePath)) process.exit(0);
if (!existsSync(filePath)) process.exit(0);

const html = readFileSync(filePath, "utf8");
const $ = cheerio.load(html, { decodeEntities: false });

// --- Applicability gate -------------------------------------------------
// Count signals that this is an educational-site page; lint only when 2+.
const filename = basename(filePath).toLowerCase();
const filenameSignal = /-(explained|explainer|primer|deep-dive|teaching|one-pager)\b/.test(
  filename,
);
const switcher = $('[role="radiogroup"][aria-label*="Audience" i]').length > 0;
const tldr = headingMatches($, /\b(tl[;:]?dr|executive summary|summary)\b/i);
const furtherReading = headingMatches($, /\b(further reading|references|citations)\b/i);
const glossary = $("dl dt").length > 0;
const callout = $(".reg-callout, .callout, [class*='callout']").length > 0;

const signals = [filenameSignal, switcher, tldr, furtherReading, glossary, callout].filter(
  Boolean,
).length;
if (signals < 2) process.exit(0);

// --- Checks -------------------------------------------------------------
const checks = [];
const check = (id, label, run) => {
  try {
    const result = run();
    if (result === true) checks.push({ id, label, passed: true });
    else checks.push({ id, label, passed: false, detail: String(result) });
  } catch (e) {
    checks.push({ id, label, passed: false, detail: `threw: ${e.message}` });
  }
};

const bodyText = $("body").clone().find("script, style").remove().end().text();

check("valid_html5", "Has <!doctype html>", () => /<!doctype html>/i.test(html) || "missing <!doctype html>");

check("inlines_css", "No external <link rel=stylesheet>", () => {
  const external = $('link[rel="stylesheet"][href^="http"]');
  if (external.length === 0) return true;
  const urls = external.map((_, el) => $(el).attr("href")).get();
  return `found ${external.length}: ${urls.join(", ")}`;
});

check(
  "external_script_whitelist",
  "External scripts limited to Mermaid CDN",
  () => {
    const allowed = /(cdn\.jsdelivr\.net\/npm\/mermaid|unpkg\.com\/mermaid|cdnjs\.cloudflare\.com\/.*mermaid)/i;
    const bad = $('script[src^="http"]')
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter((src) => !allowed.test(src));
    return bad.length === 0 || `non-Mermaid external scripts: ${bad.join(", ")}`;
  },
);

check("no_emoji", "No emoji in rendered body text", () => {
  const m = bodyText.match(/\p{Extended_Pictographic}/gu);
  return !m || `found ${m.length}: ${[...new Set(m)].slice(0, 5).join(" ")}`;
});

check("has_tldr", "TL;DR / Summary section present", () =>
  tldr || "no <h1>-<h3> matched /tl;dr|executive summary|summary/",
);

if (switcher) {
  check(
    "switcher_has_practitioner_blocks",
    "Audience switcher has practitioner-only content to reveal",
    () => $(".practitioner-only").length > 0 || "switcher exists but no .practitioner-only elements",
  );
  check(
    "switcher_radio_pattern",
    "Audience switcher uses radio pattern with 2+ options",
    () => {
      const radios = $('[role="radiogroup"][aria-label*="Audience" i] [role="radio"]');
      return radios.length >= 2 || `found ${radios.length} role=radio under switcher`;
    },
  );
}

check("has_glossary", "Glossary present (<dl> or <details> pattern)", () => {
  const dlTerms = $("dl dt").length;
  const detailEls = $("details summary").length;
  if (dlTerms >= 2 || detailEls >= 2) return true;
  return `<dl dt> count=${dlTerms}, <details summary> count=${detailEls}`;
});

check(
  "has_further_reading",
  "Further reading / References section present",
  () => furtherReading || "no heading matched /further reading|references|citations/",
);

check(
  "further_reading_uses_primary_sources",
  "Further reading links out to external primary sources",
  () => {
    if (!furtherReading) return true; // already failed above; don't double-report
    const ext = $('a[href^="http"]').length;
    return ext >= 3 || `only ${ext} external links found`;
  },
);

check("mermaid_block_not_empty", "Mermaid blocks contain content", () => {
  const blocks = $(".mermaid, pre.mermaid");
  if (blocks.length === 0) return true;
  const empty = blocks
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length < 10);
  return empty.length === 0 || `${empty.length} Mermaid block(s) under 10 chars`;
});

// --- Report -------------------------------------------------------------
const failed = checks.filter((c) => !c.passed);
if (failed.length === 0) process.exit(0);

const lines = [
  `[skill-build-educational-site] HTML linter found ${failed.length} issue(s) in ${filePath}:`,
  "",
];
for (const f of failed) {
  lines.push(`  ✗ ${f.label}`);
  if (f.detail) lines.push(`      → ${f.detail}`);
}
lines.push("");
lines.push(
  "Fix these before declaring the page done. The full validation checklist is in SKILL.md → 'Validation'.",
);
process.stderr.write(lines.join("\n") + "\n");
process.exit(2);

// --- Helpers ------------------------------------------------------------
function headingMatches($, re) {
  let found = false;
  $("h1, h2, h3, h4").each((_, el) => {
    if (re.test($(el).text())) found = true;
  });
  return found;
}
