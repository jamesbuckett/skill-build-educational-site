// Capture hero / desktop / mobile screenshots of a rendered educational page.
//
// Usage:
//   node screenshot.mjs <input.html> <out-prefix>
// e.g.:
//   node screenshot.mjs sample-outputs/spiffe-spire-workload-identity.html docs/hero
//
// Produces:
//   <out-prefix>.desktop.png   (1440x900, full page if short enough; sliced if tall)
//   <out-prefix>.mobile.png    (390x844, iPhone 14 viewport)
//
// Prefers the locally-installed Playwright (npm i -D playwright && npx playwright install chromium).
// The MCP browser is unstable for this; this local script is the workaround per CLAUDE.md.

import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve, dirname, basename } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const [, , inputArg, outArg] = process.argv;
if (!inputArg || !outArg) {
  console.error("Usage: node screenshot.mjs <input.html> <out-prefix>");
  process.exit(1);
}

const inputPath = resolve(inputArg);
if (!existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

const outPrefix = resolve(outArg);
mkdirSync(dirname(outPrefix), { recursive: true });

const url = pathToFileURL(inputPath).href;

// Resolve a Chromium binary. Try bundled first, then known system paths.
// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to override.
const fallbackPaths = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/snap/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);
let browser;
try {
  browser = await chromium.launch();
  console.log("Browser: bundled Chromium");
} catch {
  let launched = false;
  for (const executablePath of fallbackPaths) {
    try {
      browser = await chromium.launch({ executablePath });
      console.log(`Browser: ${executablePath}`);
      launched = true;
      break;
    } catch {}
  }
  if (!launched) {
    throw new Error(
      "No Chromium found. Install via `sudo snap install chromium` or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.",
    );
  }
}

// Desktop
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  // Mermaid renders async after networkidle; give it a beat
  await page.waitForTimeout(1500);
  // Hero crop: top of page, viewport-height. For full-page, swap fullPage:true (Chrome canvas cap ~16k px).
  await page.screenshot({ path: `${outPrefix}.desktop.png` });
  await ctx.close();
  console.log(`Wrote ${outPrefix}.desktop.png`);
}

// Mobile
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outPrefix}.mobile.png` });
  await ctx.close();
  console.log(`Wrote ${outPrefix}.mobile.png`);
}

await browser.close();
