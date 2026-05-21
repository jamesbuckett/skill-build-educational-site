# Skill: Build Educational Site

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jamesbuckett/skill-build-educational-site?style=social)](https://github.com/jamesbuckett/skill-build-educational-site/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/jamesbuckett/skill-build-educational-site)](https://github.com/jamesbuckett/skill-build-educational-site/commits)
[![Open issues](https://img.shields.io/github/issues/jamesbuckett/skill-build-educational-site)](https://github.com/jamesbuckett/skill-build-educational-site/issues)

> Turns a topic name into a single self-contained HTML explainer page for technical and regulatory subjects.

## About

Turns a topic name into a single self-contained `.html` explainer page that reads as well to an exec sponsor as it does to a platform engineer. Optimised for technical and regulatory subjects — FAPI 2.0, PCI-DSS, SPIFFE/SPIRE, DORA, OAuth, zero-trust — with inlined CSS/JS, an exec/practitioner audience switcher, Mermaid or inline-SVG diagrams, comparison tables, glossary, and verified primary-source citations. Composes with [`skill-style-guide`](https://github.com/jamesbuckett/skill-style-guide) when both are installed — that skill provides the visual chassis (typography, dark mode, spacing scale) and this one provides the content architecture (sections, audience switcher, regulatory callouts, glossary).

## Quick Start

```bash
# Direct install (recommended)
git clone https://github.com/jamesbuckett/skill-build-educational-site.git ~/.claude/skills/skill-build-educational-site

# Or: symlink from a working copy (for active development)
git clone https://github.com/jamesbuckett/skill-build-educational-site.git ~/projects/skill-build-educational-site
ln -s ~/projects/skill-build-educational-site ~/.claude/skills/skill-build-educational-site
```

Then, inside any GitHub-backed repo, ask Claude to invoke the skill by its trigger phrase.

## Usage

Inside any project directory, prompt Claude:

> Build me a one-pager on FAPI 2.0 for execs and engineers.

Claude announces it's using `skill-build-educational-site` and writes a single `.html` file to the current working directory. Open it in a browser; ship it. The skill also bundles optional tooling — a Playwright screenshot validator, a PostToolUse linter that fires on every `Write`/`Edit` of an explainer page, and a 37-assertion eval harness — wired up via `npm install` in the working clone.

## Project Structure

```
.
├── SKILL.md            # skill definition and content architecture
├── palette.json        # shared colour palette (composes with skill-style-guide)
├── screenshot.mjs      # Playwright validator for produced pages
├── hooks/
│   └── lint-html.mjs   # PostToolUse linter for explainer-page outputs
└── evals/
    ├── run.mjs         # eval harness (generate + check)
    └── evals.json      # 37 assertions across regulatory-topic cases
```

## Contributing

Issues and pull requests welcome. Please open an issue first to discuss substantial changes.

## License

[MIT](LICENSE) © 2026 James Buckett
