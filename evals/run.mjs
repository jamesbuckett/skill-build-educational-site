#!/usr/bin/env node
// Eval runner for skill-build-educational-site.
//
// Modes:
//   node evals/run.mjs                 # check-only (default) — runs predicates against existing outputs
//   node evals/run.mjs --generate      # generate fresh outputs via `claude --print`, then check
//   node evals/run.mjs --case <name>   # run a single case (matches --generate too)
//   node evals/run.mjs --keep-failing  # don't clear outputs/<case>/ before generating
//
// Outputs go to evals/outputs/<case-name>/<expected>.html.
// Generation is opt-in because each case is a real model call (slow + costly).
// CI / quick regression: run check-only against committed sample outputs.

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as cheerio from "cheerio";
import { predicates, expectedFilenames } from "./predicates.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const evalsFile = join(__dirname, "evals.json");
const outputsRoot = join(__dirname, "outputs");

// --- CLI -----------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const generate = flag("--generate");
const caseFilter = arg("--case");
const keepFailing = flag("--keep-failing");

// --- Load evals ----------------------------------------------------------
const evalSpec = JSON.parse(readFileSync(evalsFile, "utf8"));
let cases = evalSpec.evals;
if (caseFilter) {
  cases = cases.filter((c) => c.name === caseFilter);
  if (cases.length === 0) {
    console.error(`No case named '${caseFilter}'. Available: ${evalSpec.evals.map((c) => c.name).join(", ")}`);
    process.exit(64);
  }
}

mkdirSync(outputsRoot, { recursive: true });

// --- Per-case runner -----------------------------------------------------
const results = [];

for (const c of cases) {
  const outDir = join(outputsRoot, c.name);
  const expectedFilename = expectedFilenames[c.name];
  if (!expectedFilename) {
    console.error(`No expected filename mapped for '${c.name}' — add to predicates.mjs`);
    process.exit(70);
  }

  if (generate) {
    if (!keepFailing && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    console.log(`\n[${c.name}] generating via claude --print …`);
    const t0 = Date.now();
    const r = spawnSync(
      "claude",
      ["--print", "--dangerously-skip-permissions", "--add-dir", outDir, c.prompt],
      { cwd: outDir, stdio: "inherit", timeout: 600_000 },
    );
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (r.status !== 0) {
      console.error(`[${c.name}] claude exited with status ${r.status} after ${dt}s`);
    } else {
      console.log(`[${c.name}] generated in ${dt}s`);
    }
  }

  // --- Check phase ------------------------------------------------------
  const result = { case: c.name, assertions: [], skipped: false };
  results.push(result);

  if (!existsSync(outDir)) {
    result.skipped = true;
    result.skipReason = `no output dir at ${outDir} (run with --generate first)`;
    continue;
  }

  const files = readdirSync(outDir).filter((f) => /\.html?$/i.test(f));
  const htmlPath = files.includes(expectedFilename)
    ? join(outDir, expectedFilename)
    : files[0]
      ? join(outDir, files[0])
      : null;

  // single_html_file is the only assertion that can run without an HTML file.
  for (const a of c.assertions) {
    const fn = predicates[a.id];
    if (!fn) {
      result.assertions.push({ id: a.id, passed: false, detail: "no predicate" });
      continue;
    }
    if (!htmlPath && a.id !== "single_html_file") {
      result.assertions.push({ id: a.id, passed: false, detail: "no HTML to check" });
      continue;
    }
    const ctx = htmlPath
      ? buildContext(htmlPath, outDir, files, c.name, expectedFilename)
      : { files, dir: outDir, caseName: c.name, expectedFilename };
    try {
      const r = fn(ctx);
      result.assertions.push(
        r === true
          ? { id: a.id, passed: true }
          : { id: a.id, passed: false, detail: typeof r === "string" ? r : "predicate returned falsy" },
      );
    } catch (e) {
      result.assertions.push({ id: a.id, passed: false, detail: `threw: ${e.message}` });
    }
  }
}

// --- Report --------------------------------------------------------------
let totalPass = 0;
let totalCount = 0;
let anyFail = false;

for (const r of results) {
  const passed = r.assertions.filter((a) => a.passed).length;
  const count = r.assertions.length;
  totalPass += passed;
  totalCount += count;
  if (passed !== count) anyFail = true;

  const pct = count ? Math.round((passed / count) * 100) : 0;
  const banner = r.skipped
    ? `[SKIP] ${r.case} — ${r.skipReason}`
    : `[${passed === count ? "PASS" : "FAIL"}] ${r.case} — ${passed}/${count} (${pct}%)`;
  console.log(`\n${banner}`);
  if (r.skipped) continue;

  for (const a of r.assertions) {
    if (a.passed) console.log(`  ✓ ${a.id}`);
    else console.log(`  ✗ ${a.id} — ${a.detail || ""}`);
  }
}

const allPct = totalCount ? Math.round((totalPass / totalCount) * 100) : 0;
console.log(`\nTotal: ${totalPass}/${totalCount} assertions (${allPct}%)`);
const anySkipped = results.some((r) => r.skipped);
if (anySkipped && !generate) {
  console.log("Some cases skipped — generate outputs with `node evals/run.mjs --generate`.");
}
process.exit(anyFail || anySkipped ? 1 : 0);

// --- Helpers -------------------------------------------------------------
function buildContext(htmlPath, dir, files, caseName, expectedFilename) {
  const html = readFileSync(htmlPath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const bodyText = $("body").clone().find("script, style").remove().end().text();
  return { $, html, bodyText, dir, files, caseName, expectedFilename };
}
