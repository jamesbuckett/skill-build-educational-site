---
name: build-educational-site
description: >-
  Build a single self-contained HTML explainer page on a technical or regulatory topic. ALWAYS trigger when the user wants a deliverable webpage that explains something — phrasings include "one-pager", "primer", "explainer", "teaching page", "deep-dive page", "self-contained webpage", "single HTML file on X", "page on Y to execs and engineers". Trigger even without "educational site" — "presenting Thursday on X, build me an HTML page", "deep-dive page on Y", "brief my team, make an html page on Z" all qualify. Strong on regulated/security topics (FAPI, PCI-DSS, DORA, SPIFFE, CALM, FIPS, SLSA, SBOM, AI Act, OAuth, zero-trust) but works for any technical concept. Skip ONLY for different artifacts (slide deck, Confluence, README, ADR, dashboard, multi-page docs site) or chat-only answers. Output is one .html file with inlined CSS/JS, Mermaid, comparison tables, exec/practitioner audience switcher, regulatory callouts, glossary.
---

# build-educational-site

## What this produces

One file: a self-contained `.html` document, no build step, no external dependencies except CDN-loaded Mermaid. Opens in any browser. Looks professional enough to share with a regulator, an executive sponsor, or a new joiner — same artifact, different reader.

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

**Always verify online**, even if you think you know:
- Specific clause numbers, control IDs, requirement numbers (e.g., "PCI-DSS 4.0 Req 8.3.6", "DORA Article 28")
- Version numbers and effective dates of standards and regulations
- Names of current working groups, maintainers, or governing bodies
- URLs for primary sources (specs, regulator sites, FINOS pages)

**Trust model knowledge for**:
- Conceptual explanations, analogies, mental models
- Protocol mechanics and message flows
- Architecture patterns and trade-offs
- Historical context

Cite every regulatory or specification claim. Citations go in the "Further reading" section as links to the primary source — not blog posts, not Wikipedia, not vendor marketing.

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
- Mermaid diagrams actually render (no "Syntax error in text" boxes)
- Audience switcher toggles content correctly
- Glossary terms have working hover/expand affordances
- No console errors
- Page is responsive (collapses gracefully on mobile width)

If validation fails, fix and re-screenshot. Do not claim the artifact is ready until it renders cleanly.

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
  - Mermaid block: C4 context/container, sequence, or flowchart depending on topic
  - Caption underneath naming the diagram type and what it shows
  - For security/identity topics: label trust boundaries with the regulatory regime, mark PDP/PEP, show identity provenance (SPIFFE ID, OIDC sub, mTLS subject)

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

A simple two-button control in the header that toggles a body class. Practitioner-depth content is hidden by default (exec view) and revealed when the practitioner button is pressed. Save the user's choice to `localStorage` so it persists across refresh.

```html
<div class="audience-switch" role="group" aria-label="Audience">
  <button data-audience="exec" aria-pressed="true">Executive view</button>
  <button data-audience="practitioner" aria-pressed="false">Practitioner view</button>
</div>
```

```css
body:not(.show-practitioner) .practitioner-only { display: none; }
```

```js
const buttons = document.querySelectorAll('.audience-switch button');
const apply = (mode) => {
  document.body.classList.toggle('show-practitioner', mode === 'practitioner');
  buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.audience === mode));
  localStorage.setItem('audience', mode);
};
buttons.forEach(b => b.addEventListener('click', () => apply(b.dataset.audience)));
apply(localStorage.getItem('audience') || 'exec');
```

### Mermaid

Load from CDN and initialize with a theme matched to the palette:

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

Wrap diagrams in `<figure>` with a `<figcaption>` underneath naming the diagram type.

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
- [ ] All Mermaid diagrams render (not as text/error boxes)
- [ ] Audience switcher actually hides/shows practitioner content
- [ ] At least one regulatory callout exists if the topic warrants it
- [ ] Every regulatory clause/article/version number was verified online and is cited
- [ ] Glossary covers every acronym AND every multi-word term of art used heavily in the page (tokenization, trust domain, sender-constrained token, etc.) — not only capitalized abbreviations
- [ ] If the topic involves comparing two named variants, that comparison lives in a single <table> with side-by-side columns (not split across prose sections)
- [ ] Page is one file — no missing external CSS or JS references except Mermaid CDN
- [ ] No emoji anywhere in the rendered text
- [ ] Page renders sensibly down to ~600px viewport width

If a Playwright screenshot script exists in the repo, run it and capture desktop + mobile screenshots. Report screenshot paths to the user along with the HTML file path.

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
