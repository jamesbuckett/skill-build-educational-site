# skill-build-educational-site

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jamesbuckett/skill-build-educational-site?style=flat-square)](https://github.com/jamesbuckett/skill-build-educational-site/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/jamesbuckett/skill-build-educational-site?style=flat-square)](https://github.com/jamesbuckett/skill-build-educational-site/commits/main)
[![Issues](https://img.shields.io/github/issues/jamesbuckett/skill-build-educational-site?style=flat-square)](https://github.com/jamesbuckett/skill-build-educational-site/issues)
[![Eval pass rate: 100%](https://img.shields.io/badge/eval%20pass%20rate-100%25-brightgreen.svg)](evals/evals.json)

Turns a topic name into a single self-contained `.html` explainer page. Built for technical and regulatory subjects — FAPI 2.0, PCI-DSS scope reduction, SPIFFE/SPIRE, DORA, OAuth, zero-trust — that need to read as well to an exec sponsor as they do to a platform engineer. Output is one file with inlined CSS/JS, an exec/practitioner audience switcher, Mermaid diagrams, comparison tables, glossary, and verified primary-source citations. Scores 37/37 across three regulatory-topic evals; the same agent with no skill loaded scores 27/37 (+27pp).

Composes with [`skill-style-guide`](https://github.com/jamesbuckett/skill-style-guide) when both are installed — `skill-style-guide` provides the visual chassis (typography, dark mode, spacing scale); `skill-build-educational-site` provides the content architecture (sections, audience switcher, regulatory callouts, glossary).

## Installation

The install pattern below clones the repo to `~/projects/` and symlinks it into Claude Code's skills directory. Edits to your working copy take effect on the next Claude Code session — no copy-back step. This is the only supported install method.

### Prerequisites

- [Claude Code](https://claude.com/claude-code) installed and authenticated
- `git` (any recent version)
- A POSIX shell (`bash` or `zsh`) — Windows users should run this from WSL
- *Optional, for screenshot validation:* Node.js 18+ and Playwright

### Step 1 — Clone the repo

Clone to a working directory you control. The example below uses `~/projects/`; substitute any directory you prefer.

```bash
mkdir -p ~/projects
git clone https://github.com/jamesbuckett/skill-build-educational-site.git \
  ~/projects/skill-build-educational-site
```

### Step 2 — Symlink into the Claude Code skills directory

```bash
mkdir -p ~/.claude/skills
ln -s ~/projects/skill-build-educational-site \
  ~/.claude/skills/skill-build-educational-site
```

If `~/.claude/skills/skill-build-educational-site` already exists (e.g. from an earlier copy-based install), remove it first:

```bash
rm -rf ~/.claude/skills/skill-build-educational-site
ln -s ~/projects/skill-build-educational-site \
  ~/.claude/skills/skill-build-educational-site
```

Confirm the symlink resolves:

```bash
readlink ~/.claude/skills/skill-build-educational-site
# → /home/<you>/projects/skill-build-educational-site
```

### Step 3 — Restart Claude Code

Skills are discovered at session start. Close the current session and open a new one in any project directory.

### Step 4 — Verify it loaded

Try a trigger phrase:

> Build me a one-pager on OAuth 2.0 PKCE.

Claude should announce that it's using `skill-build-educational-site` and produce an `.html` file in the current directory. If nothing happens, see the troubleshooting table below.

### (Optional) Install the screenshot validator

The repo ships `screenshot.mjs`, a Playwright script that captures desktop + mobile screenshots of any page the skill produces. From your working clone:

```bash
cd ~/projects/skill-build-educational-site
npm install --save-dev playwright
npx playwright install chromium
```

Run against any output:

```bash
node ~/projects/skill-build-educational-site/screenshot.mjs your-page.html docs/your-page
```

Produces `docs/your-page.desktop.png` (1440×900 @ 2x) and `docs/your-page.mobile.png` (390×844 @ 2x).

### (Optional) Wire up the PostToolUse linter

`hooks/lint-html.mjs` runs after Claude writes or edits an HTML file. It quietly skips files that aren't this skill's output (gated on audience-switcher / TL;DR / glossary / further-reading signals), and prints actionable feedback to Claude when a real explainer page is missing something — external CSS link, stray emoji, audience switcher with no practitioner-only content, missing glossary, etc.

Install dependencies once:

```bash
cd ~/projects/skill-build-educational-site
npm install
```

Then add a `PostToolUse` block to `~/.claude/settings.json` (merge with existing `hooks:`):

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "node ~/projects/skill-build-educational-site/hooks/lint-html.mjs",
        "timeout": 15
      }
    ]
  }
]
```

Restart Claude Code; the hook fires on every `Write`/`Edit`. To test it manually:

```bash
echo '{"tool_name":"Write","tool_input":{"file_path":"/path/to/your-page.html"}}' \
  | node ~/projects/skill-build-educational-site/hooks/lint-html.mjs
```

Exit code 0 = passed or not applicable; exit code 2 = issues printed on stderr (Claude sees them).

### (Optional) Run the evals

`evals/run.mjs` exercises the 37 assertions in `evals/evals.json` against produced HTML.

```bash
cd ~/projects/skill-build-educational-site
npm install                                    # one-time, for cheerio
node evals/run.mjs --generate                  # runs `claude --print` for each case, then checks (slow)
node evals/run.mjs                             # check-only against existing evals/outputs/ (fast, default)
node evals/run.mjs --case fapi-2.0-explainer   # one case
```

Outputs land in `evals/outputs/<case-name>/`. Generation calls real Claude in non-interactive mode (`claude --print --dangerously-skip-permissions`); each case is ~30–90s and counts against your usage. Check-only is free and useful for verifying assertion predicates after a SKILL.md edit.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Skill doesn't trigger | Restart the Claude Code session; skills load at session start. Confirm `~/.claude/skills/skill-build-educational-site/SKILL.md` resolves to a file (`ls -L ~/.claude/skills/skill-build-educational-site/SKILL.md`). |
| `ln: failed to create symbolic link 'File exists'` | A previous install copied the directory. Remove it first: `rm -rf ~/.claude/skills/skill-build-educational-site`, then re-run the `ln -s` from Step 2. |
| `readlink` returns nothing | The path is a real directory, not a symlink. Confirm with `ls -la ~/.claude/skills/skill-build-educational-site` — if you see no `->` arrow, repeat the fix above. |
| `npx playwright install chromium` fails on ARM64 Ubuntu | Install a system Chromium: `sudo apt install chromium-browser` (or `sudo snap install chromium`). `screenshot.mjs` finds it via a built-in fallback chain. |
| Mermaid diagrams show "Syntax error in text" | Open the generated `.html` directly in a browser; the Mermaid CDN may have been blocked on first load. A refresh usually clears it. |
| Want to author offline (no CDN egress) | Ask the skill explicitly for "inline SVG diagrams only" — it treats that as a first-class alternative for air-gapped or archival use. |

### Update

Because the install is a symlink, updates are just a `git pull` in the working clone:

```bash
cd ~/projects/skill-build-educational-site && git pull
```

The next Claude Code session picks up the changes.

### Uninstall

Remove the symlink (and optionally the working clone):

```bash
rm ~/.claude/skills/skill-build-educational-site
rm -rf ~/projects/skill-build-educational-site   # optional
```

## Usage

Trigger phrases (any of these activate the skill):

- "build me a one-pager on `<topic>`"
- "I need a primer / explainer / teaching page on `<topic>`"
- "create a self-contained webpage explaining `<topic>` for `<audience>`"
- "I'm presenting Thursday on `<topic>` — build me an HTML page"

Output is saved to the current working directory using kebab-case names (e.g., `fapi-2.0-explained.html`).

For the full page template, design system, and failure modes the skill guards against, read [`SKILL.md`](SKILL.md).

## Project structure

```
skill-build-educational-site/
├── SKILL.md             — the skill itself (frontmatter + workflow + page template)
├── palette.json         — single source of truth for both palettes; shared with skill-style-guide
├── hooks/
│   └── lint-html.mjs    — PostToolUse linter (cheerio-based, gated by skill signatures)
├── evals/
│   ├── evals.json       — 3 test cases, 37 assertions
│   ├── predicates.mjs   — assertion-id → predicate function map
│   └── run.mjs          — eval runner CLI (--generate / --case / check-only default)
├── screenshot.mjs       — Playwright visual-validation script
├── package.json         — cheerio dependency
├── LICENSE
└── README.md
```

## License

[MIT](LICENSE) © 2026 James Buckett
