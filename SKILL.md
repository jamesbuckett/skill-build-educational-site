---
name: skill-build-educational-site
description: >-
  Build a single self-contained HTML explainer page on a technical or regulatory topic. ALWAYS trigger when the user wants a deliverable webpage that explains something — phrasings include "one-pager", "primer", "explainer", "teaching page", "deep-dive page", "self-contained webpage", "single HTML file on X", "page on Y to execs and engineers". Trigger even without "educational site" — "presenting Thursday on X, build me an HTML page", "deep-dive page on Y", "brief my team, make an html page on Z" all qualify. Strong on regulated/security topics (FAPI, PCI-DSS, DORA, SPIFFE, CALM, FIPS, SLSA, SBOM, AI Act, OAuth, zero-trust) but works for any technical concept. Skip ONLY for different artifacts (slide deck, Confluence, README, ADR, dashboard, multi-page docs site) or chat-only answers. Output is one .html file with inlined CSS/JS, diagrams (Mermaid or hand-authored inline SVG), comparison tables, exec/practitioner audience switcher, regulatory callouts where the topic warrants them, and a glossary. Composes with the skill-style-guide skill — when both apply, that skill provides the visual chassis and this one provides the content architecture.
---

# skill-build-educational-site

## What this produces

One file: a self-contained `.html` document, no build step. Opens in any browser. Looks professional enough to share with a regulator, an executive sponsor, or a new joiner — same artifact, different reader.

External dependencies are minimised: Mermaid via CDN is the default when a page needs diagrams it would be painful to hand-author (sequence diagrams, C4 containers, large flowcharts), but **inline-SVG diagrams are a first-class alternative** and the right choice when the page needs to be strictly self-contained (corporate environments without CDN egress, archival use, true "send one file" portability). Choose per page, not per skill.

The page is **single-topic and dense**. Not a course, not a multi-page site. One concept, layered so it works for three audiences in the same file:

- **Executives** — want the TL;DR, the diagram, the regulatory implication, the trade-off table
- **Practitioners** — want the protocol detail, the config snippet, the failure modes
- **General learners** — want the analogy, the glossary, the "why does this matter"

A runtime audience switcher (a control in the header) toggles visibility of practitioner-depth blocks so the same file serves all three readers without forcing anyone to scroll past content that isn't for them.

## When to use

Use this skill any time the user wants explanatory content rendered as a deliverable page rather than a chat reply. Triggers include the obvious ("build an educational site / explainer / one-pager / primer / teaching page") and the less obvious — when the user describes a topic and a target audience and clearly wants something they can send to someone else, default to producing a page rather than a long chat answer.

Do **not** use this skill for:
- Multi-page documentation sites (use a static site generator)
- Interactive tutorials with embedded sandboxes (different problem)
- Internal architecture decision records (use ADR template)
- Plain conversational explanations (just answer in chat)

## Composition with the skill-style-guide skill

This skill is the **content architecture**: section sequence, the audience-switcher pattern, glossary discipline, the single-table comparison rule, the regulatory-callout shape. It does not own the visual chassis.

When the `skill-style-guide` skill is also in play (because the user named it or because they want the page to match the rest of their work), use this composition rule:

- **Defer to skill-style-guide on**: palette, typography, spacing scale, the dark-mode toggle, Lucide icon idiom, personal-branding row, screenshot harness, and the reusable components in `references/long-form-components.md` (callout, comparison table, definition-list glossary, reading list, audience switcher, practitioner-only reveal, inline-SVG diagram frame, TL;DR card).
- **Keep from this skill**: the page structure below, the research workflow, the "lead with TL;DR" discipline, the dual-audience model, the glossary failure-modes, the comparison-table-as-single-table rule, and the regulatory-callout content shape (regime name + clause + citation).
- The palette, typography, layout-width, and design-system blocks **lower down in this file are overridden** when skill-style-guide is composing. They remain in this file as a self-contained fallback for when skill-style-guide is not in play (e.g. a single deliverable for a stakeholder outside the user's normal context).

If both skills apply but the user has not specified which, ask once. Default to composed-with-skill-style-guide for any page the user is likely to share through their normal channels; default to standalone for one-off deliverables to external stakeholders who won't see other pages.

## Workflow

Follow these phases in order. Each phase has a clear exit condition; don't move on until it's met.

### Phase 1 — Scope the page

Before writing anything, confirm:

1. **Topic** — one concept, stated narrowly. "FAPI 2.0" not "API security". "PCI-DSS 4.0 scope reduction strategies" not "PCI compliance".
2. **Primary audience tilt** — even with the audience switcher, one of the three readers usually leads. Ask if it isn't obvious.
3. **Regulatory frame** — if the topic touches PCI-DSS, DORA, MAS TRM, APRA CPS 234, SWIFT CSCF, SOX, OJK PDP, RBI guidelines, FAPI/Open Banking, or similar — note which regimes are in scope. These get callout boxes later.
4. **Source material** — usually none; the user gives a topic name and expects the skill to do the research. If they provide PDFs, links, or notes, treat those as authoritative and supplement with your own knowledge.

If any of the above is materially ambiguous, ask **one focused question** before proceeding. Don't interview the user — they came here to get a page, not to fill out a form.

### Phase 2 — Research (hybrid)

Draft from model knowledge first; verify online only where staleness or precision matters. This balance is deliberate — full web-research-from-scratch is slow and often surfaces the same primary sources Claude already knows; pure model knowledge is fast but risks confidently asserting outdated version numbers, retired clause IDs, or superseded guidance.

The verification rule below is **scoped to the kinds of claims that appear in the rendered page**. A page on a pure protocol / cryptography / architecture topic with no regulatory framing doesn't trigger the regulator-side checks; verifying clause IDs that never appear in the page is wasted effort.

**When the page makes regulatory, specification, or quantitative claims, verify online** — even if you think you know:
- Specific clause numbers, control IDs, requirement numbers (e.g., "PCI-DSS 4.0 Req 8.3.6", "DORA Article 28") — verify the number and that the clause still exists in the current revision
- Version numbers and effective dates of standards and regulations
- Names of current working groups, maintainers, or governing bodies
- URLs for primary sources (specs, regulator sites, FINOS pages)
- Quantitative claims load-bearing to the page's argument (qubit counts, supply distributions, performance figures)

**Trust model knowledge for**:
- Conceptual explanations, analogies, mental models
- Protocol mechanics and message flows
- Architecture patterns and trade-offs
- Historical context

Cite every regulatory or specification claim that does appear. Citations go in the "Further reading" section as links to the primary source — not blog posts, not Wikipedia, not vendor marketing.

### Phase 3 — Outline before HTML

Write the outline as a short bulleted list (in your own working notes, not in the page). For each section, decide:

- Which audience it serves (exec / practitioner / both)
- Whether it needs a diagram, a table, a code block, a callout, or pure prose
- One-sentence statement of what the reader should walk away knowing

A 6-section outline beats a 14-section outline. Cut anything that doesn't earn its place.

### Phase 4 — Build the HTML

Use the template structure (next section). Inline all CSS in a `<style>` block in `<head>`. Inline all JS in a `<script>` block at the end of `<body>`. The only external resource is Mermaid via CDN.

Name the file using kebab-case based on the topic: `fapi-2.0-explained.html`, `pci-dss-4.0-scope-reduction.html`, `spiffe-spire-workload-identity.html`. Save to the current working directory unless the user specifies otherwise.

### Phase 5 — Validate visually

After writing the file, verify it renders correctly. Use the Playwright screenshot script if one exists in the repo (the user's standard pattern — see their CLAUDE.md). If no screenshot script is present, open the file in a headless browser via Playwright or note to the user that visual validation was skipped.

Check:
- Diagrams actually render (no "Syntax error in text" boxes from Mermaid, no broken paths in inline SVG)
- Audience switcher toggles content correctly and is keyboard-navigable (arrow keys between segments)
- Glossary terms have working hover/expand affordances
- No console errors
- Page is responsive (collapses gracefully on mobile width)

If validation fails, fix and re-screenshot. Do not claim the artifact is ready until it renders cleanly.

**When `npx playwright install chromium` fails** (e.g. Ubuntu 26.04 ARM64, snap-only distros without sudo, restricted corporate hosts): see the same fallback sequence documented in skill-style-guide's "Screenshot iteration loop → When `npx playwright install chromium` fails" section. Briefly: try a system chromium (`sudo apt install chromium-browser` or `sudo snap install chromium`), or CDP-connect to a manually-launched Chrome with `--remote-debugging-port`, or hand off the install command to the user. Don't silently skip visual validation; note explicitly which checks were run and which were blocked.

## Page template

Use this section structure. Order matters — the reader's eye should flow from "what is this and why do I care" down to detail.

```
<header>
  - Topic title (h1)
  - One-line subtitle (what kind of thing this is)
  - Audience switcher control (Exec | Practitioner)
  - Last-updated date

<TL;DR section>
  - Lead with one bold sentence (the answer if reader reads nothing else)
  - 3-5 bullet takeaways underneath
  - This section ALWAYS visible regardless of audience

<Conceptual overview>
  - 2-4 paragraphs of plain-language framing
  - Includes the "why does this exist" / "what problem does it solve"
  - Visible to all audiences

<Architecture or flow diagram>
  - Either a Mermaid block (C4 context/container, sequence, flowchart) OR a hand-authored inline SVG, depending on the page's portability needs and diagram shape
  - Caption underneath naming the diagram type and what it shows
  - For security/identity topics: label trust boundaries with the regulatory regime, mark PDP/PEP, show identity provenance (SPIFFE ID, OIDC sub, mTLS subject)
  - See "Diagrams: Mermaid vs. inline SVG" below for the picking rule

<Mechanics / deep dive>
  - This is where practitioner-only content lives
  - Wrap practitioner-depth blocks in <div class="practitioner-only">
  - Include code/config snippets where they earn their place: protocol examples, CALM JSON, Structurizr DSL, kubectl manifests, config blocks
  - Use syntax-highlighted <pre><code> blocks

<Comparison or trade-off table>
  - If there's a meaningful axis of comparison (FAPI 1 vs FAPI 2, old PCI-DSS scope vs new, x.509 SVID vs JWT SVID, etc.), include a table
  - When the topic involves two named variants the reader needs to compare side-by-side, use a SINGLE <table> with the variants as adjacent columns — not separate prose sections, not stacked cards. The reader should scan across rows to spot deltas without scrolling between sections. Even when each variant has more nuance than a table can hold, lead with the table and elaborate underneath.
  - Keep tables to <8 rows; if it's longer, split into multiple smaller tables

<Regulatory callouts>
  - One callout box per applicable regime
  - Each callout names the regime, the specific clause(s) or article(s), and how the topic maps to it
  - Example: "PCI-DSS 4.0 — Req 8.3.6 (MFA on all access into the CDE)"
  - Cite primary sources

<Glossary>
  - Inline definitions for jargon used in the page — this includes multi-word terms of art, not only capitalized acronyms. A failure mode this skill is specifically guarding against: page leans heavily on "tokenization" or "sender-constrained token" or "trust domain", glossary defines CDE/SAD/PAN/HSM but skips the multi-word concept. If a reader who has never met the term would stumble on it, define it.
  - Render as a <dl> at the bottom OR as <details> elements next to first use
  - Cover only terms actually used; don't pad

<Further reading>
  - Links to primary sources only: spec documents, regulator publications, FINOS pages, official standards bodies
  - 5-10 links typical
  - Each link gets a one-line annotation explaining why the reader would click it
```

## Design system

Aesthetic target: **JPMC-ready professional**. The page should look like it belongs on an internal enterprise portal, not a personal blog. Conservative palette, generous whitespace, strong typographic hierarchy, **no emoji anywhere in the rendered output**.

### Palette

```
--ink:         #0B1F33    /* primary text — deep navy, not pure black */
--ink-muted:   #4A5A6B    /* secondary text */
--paper:       #FAFBFC    /* page background */
--surface:     #FFFFFF    /* card / callout background */
--rule:        #E1E6EB    /* borders, dividers */
--accent:      #1B4F8C    /* links, primary brand — corporate blue */
--accent-soft: #E8F0FA    /* tinted backgrounds for callouts */
--warn:        #8B4513    /* regulatory callout accent — saddle brown, not red */
--warn-soft:   #FDF4E8
--code-bg:     #F4F6F8
```

Do not introduce additional colors. If you need to distinguish more than two callout types, vary the left border thickness or icon shape rather than introducing new hues.

### Typography

- Body: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` at 16px / 1.65 line-height
- Headings: same family, weight 600, with strong size contrast (h1 2.25rem, h2 1.5rem, h3 1.125rem)
- Code: `ui-monospace, "SF Mono", Menlo, Consolas, monospace` at 14px
- Measure: cap text columns at ~70ch; do not run paragraphs the full width of the viewport on desktop

### Spacing and structure

- Center the content column at `max-width: 860px` with generous side margins
- Section spacing: 4rem between major sections, 1.5rem within sections
- Callouts and tables get their own visual weight — borders or tinted backgrounds, not just whitespace

### What to avoid

- Emoji in headings, captions, or body (this user explicitly disallows it in technical output)
- Drop shadows beyond a subtle 1px border or 2px hairline shadow
- Gradient backgrounds
- Sans-serif and serif mixed in the same page
- "Marketing site" patterns: huge hero images, animated CTAs, testimonial sections

## Implementation patterns

### Audience switcher

A segmented two-option control in the header that toggles a body class. Practitioner-depth content is hidden by default (exec view) and revealed when the practitioner option is selected. Save the user's choice to `localStorage` so it persists across refresh.

Use the ARIA `radiogroup` pattern rather than two unrelated buttons — it gives keyboard users arrow-key navigation between segments and is correctly announced by screen readers. (When composing with `skill-style-guide`, this same component lives in `references/long-form-components.md` against the skill-style-guide palette and is the version to copy.)

```html
<div class="audience-switch" role="radiogroup" aria-label="Audience">
  <button type="button" role="radio" data-audience="exec" aria-checked="true" tabindex="0">Executive view</button>
  <button type="button" role="radio" data-audience="practitioner" aria-checked="false" tabindex="-1">Practitioner view</button>
</div>
```

```css
body:not(.show-practitioner) .practitioner-only { display: none; }
```

```js
const switchEl = document.querySelector('.audience-switch[role="radiogroup"]');
const radios = Array.from(switchEl.querySelectorAll('[role="radio"]'));
const apply = (mode) => {
  document.body.classList.toggle('show-practitioner', mode === 'practitioner');
  radios.forEach((r) => {
    const isOn = r.dataset.audience === mode;
    r.setAttribute('aria-checked', isOn ? 'true' : 'false');
    r.setAttribute('tabindex', isOn ? '0' : '-1');
  });
  localStorage.setItem('audience', mode);
};
radios.forEach((r) => {
  r.addEventListener('click', () => apply(r.dataset.audience));
  r.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const idx = radios.indexOf(r);
    const next = radios[(idx + (e.key === 'ArrowRight' ? 1 : radios.length - 1)) % radios.length];
    next.focus();
    apply(next.dataset.audience);
  });
});
apply(localStorage.getItem('audience') || 'exec');
```

If the page genuinely has no practitioner-only blocks, don't ship the switcher at all — a control that does nothing is a failure mode (see "Failure modes to avoid" below).

### Diagrams: Mermaid vs. inline SVG

Both are valid. Pick per page, not per skill, with this rule:

- **Mermaid via CDN** is the default when the diagram is one of Mermaid's strong shapes — sequence diagrams, C4 contexts/containers, decision flowcharts, state machines, gantt charts — and the page's portability requirements allow a CDN dependency.
- **Hand-authored inline SVG** is the right choice when (a) the page must be strictly self-contained with zero external dependencies (regulated environments without CDN egress, archival use, attachment-on-email portability), (b) the diagram shape isn't well served by Mermaid's grammars (lifecycle timelines, address-type comparison strips, custom 2-axis charts, scaled supply distributions), or (c) you need the diagram to respect the page's theme variables natively. Inline SVG can read `currentColor` and `var(--accent)` directly, which makes light/dark switching free.

Wrap either form in a `<figure>` with a `<figcaption>` underneath naming the diagram type and what it shows.

#### Mermaid setup

Load from CDN and initialise with a theme matched to the page palette. The colour values below are for the standalone palette in this file; when composing with skill-style-guide, replace them with that skill's CSS variable values so Mermaid tracks the active theme.

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#E8F0FA',
      primaryTextColor: '#0B1F33',
      primaryBorderColor: '#1B4F8C',
      lineColor: '#4A5A6B',
      fontFamily: 'system-ui, sans-serif'
    }
  });
</script>
```

#### Inline-SVG diagram frame

Use a `<figure>` wrapper, a viewBox for responsive scaling, and theme-tracking fills:

```html
<figure class="diagram-frame" aria-labelledby="diagram-caption">
  <svg viewBox="0 0 720 200" role="img" xmlns="http://www.w3.org/2000/svg" aria-labelledby="diagram-caption">
    <rect x="40" y="40" width="200" height="60" rx="6" fill="var(--accent)" opacity="0.85"/>
    <text x="140" y="76" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="700">Emphasis</text>
    <rect x="280" y="40" width="200" height="60" rx="6" fill="currentColor" opacity="0.10"/>
    <text x="380" y="76" font-size="14" fill="currentColor" text-anchor="middle">Neutral</text>
  </svg>
  <figcaption id="diagram-caption">Caption naming the diagram type and what it shows.</figcaption>
</figure>
```

`currentColor` and `var(--accent)` mean the SVG re-paints automatically when the user toggles dark mode — no separate dark-theme variant needed.

### Regulatory callouts

Render as a left-bordered box with the regime name as the heading:

```html
<aside class="reg-callout">
  <h3>PCI-DSS 4.0</h3>
  <p>Requirement 8.3.6 — MFA on all non-console access into the cardholder data environment (CDE).</p>
  <p class="cite"><a href="https://docs-prv.pcisecuritystandards.org/...">Primary source</a></p>
</aside>
```

### Glossary

Two acceptable patterns — pick one per page, don't mix:

1. **Inline `<details>`** next to first use: `<details><summary>PDP</summary>Policy Decision Point — the component that evaluates...</details>`
2. **Bottom-of-page `<dl>`** — definition list with `<dt>` for the term and `<dd>` for the definition. Better for pages with many terms.

### Code blocks

`<pre><code class="lang-json">...</code></pre>`. Use a lightweight syntax highlighter (highlight.js from CDN is acceptable) if the page has more than one code block. If only one code block, hand-style it.

## Validation

After producing the file, do a self-check before declaring done:

- [ ] File opens cleanly in a browser (no console errors)
- [ ] All diagrams render — Mermaid blocks produce diagrams, not "Syntax error in text" boxes; inline SVGs paint with no broken paths
- [ ] Audience switcher actually hides/shows practitioner content AND is keyboard-navigable with arrow keys between segments
- [ ] If the topic involves regulatory framing, at least one regulatory callout exists; if it doesn't, no callout is shipped just for show
- [ ] Every regulatory clause/article/version number that appears in the rendered text was verified online and is cited
- [ ] Glossary covers every acronym AND every multi-word term of art used heavily in the page (tokenization, trust domain, sender-constrained token, etc.) — not only capitalized abbreviations
- [ ] If the topic involves comparing two named variants, that comparison lives in a single <table> with side-by-side columns (not split across prose sections)
- [ ] Page is one file — no missing external CSS or JS references; if Mermaid is in use, that is the only external dependency, otherwise the page is fully self-contained
- [ ] No emoji anywhere in the rendered text
- [ ] Page renders sensibly down to ~600px viewport width

If a Playwright screenshot script exists in the repo, run it and capture desktop + mobile screenshots. Report screenshot paths to the user along with the HTML file path. If the harness fails to install (see Phase 5 fallback), report which checks were run statically and which were blocked — do not declare visual validation passed when it wasn't run.

## Failure modes to avoid

A few patterns this skill is specifically trying to prevent:

- **Content padding** — writing six paragraphs of intro before the reader sees the diagram or the takeaway. Lead with substance.
- **Marketing-site drift** — calls-to-action, hero animations, "trusted by" sections. This is technical writing, not a landing page.
- **Confidently wrong regulatory claims** — citing a clause number from memory that was renumbered three revisions ago. Verify clause IDs every time.
- **Diagram-as-decoration** — putting a Mermaid block in just because. Every diagram should answer a specific question the prose can't answer as efficiently.
- **Audience switcher with nothing to switch** — if there's no practitioner-depth content, drop the switcher; don't ship a control that does nothing.
- **Glossary padding** — defining "API" or "user" or other terms the reader already knows. Glossary is for jargon and acronyms that earn definition.
- **Acronym-only glossary** — the inverse failure mode. Page leans on "tokenization" or "trust domain" for ten paragraphs, glossary only lists three-letter codes. Multi-word terms of art need definitions too.
- **Comparison split across sections** — explaining variant A in section 3 and variant B in section 5 forces the reader to flip back and forth. Put them in a single side-by-side table; elaborate underneath if needed.
