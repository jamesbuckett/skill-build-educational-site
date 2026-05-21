// Predicates for evals.json assertions. Keyed by assertion ID.
//
// Each predicate receives a context object and returns true on pass,
// or a string explaining the failure on fail.
//
// Context:
//   $          — cheerio root for the produced HTML
//   html       — raw HTML string
//   bodyText   — body text with <script> / <style> stripped
//   dir        — output directory for the case (where the HTML lives)
//   files      — list of files in that dir
//   caseName   — eval case name (e.g. "fapi-2.0-explainer")
//   expectedFilename — kebab-case filename the prompt asks the agent to save

const headingMatches = ($, re) => {
  let found = false;
  $("h1, h2, h3, h4").each((_, el) => {
    if (re.test($(el).text())) found = true;
  });
  return found;
};

const externalLinkCount = ($, hostRe) => {
  let n = 0;
  $('a[href^="http"]').each((_, el) => {
    const href = ($(el).attr("href") || "").toLowerCase();
    if (!hostRe || hostRe.test(href)) n++;
  });
  return n;
};

export const predicates = {
  // --- structural (shared across all cases) ----------------------------
  single_html_file: ({ files, expectedFilename }) =>
    files.includes(expectedFilename) ||
    `no '${expectedFilename}' in output dir (saw: ${files.join(", ") || "<empty>"})`,

  self_contained: ({ $ }) => {
    const ext = $('link[rel="stylesheet"][href^="http"]');
    if (ext.length === 0) return true;
    const urls = ext.map((_, el) => $(el).attr("href")).get();
    return `external CSS links: ${urls.join(", ")}`;
  },

  has_tldr: ({ $ }) =>
    headingMatches($, /\b(tl[;:]?dr|executive summary|summary)\b/i) ||
    "no <h1>-<h4> matched /tl;dr|executive summary|summary/",

  has_audience_switcher: ({ $ }) => {
    const radiogroup = $('[role="radiogroup"][aria-label*="Audience" i]');
    if (radiogroup.length === 0) return "no [role=radiogroup][aria-label*='Audience']";
    const radios = radiogroup.find('[role="radio"]');
    if (radios.length < 2) return `only ${radios.length} role=radio under switcher`;
    if ($(".practitioner-only").length === 0)
      return "switcher present but no .practitioner-only blocks";
    return true;
  },

  embeds_mermaid: ({ $ }) =>
    $(".mermaid, pre.mermaid").length > 0 || "no .mermaid or <pre class=mermaid> blocks",

  has_comparison_table: ({ $ }) => {
    const tables = $("table");
    if (tables.length === 0) return "no <table> elements";
    const rich = tables.filter((_, t) => $(t).find("tr").length >= 3);
    return rich.length > 0 || `${tables.length} table(s) found but none with >=3 rows`;
  },

  has_glossary: ({ $ }) => {
    const dlTerms = $("dl dt").length;
    const detailEls = $("details summary").length;
    if (dlTerms >= 2 || detailEls >= 2) return true;
    return `<dl dt> count=${dlTerms}, <details summary> count=${detailEls}`;
  },

  has_citations: ({ $ }) => {
    const heading = headingMatches($, /\b(further reading|references|citations|sources)\b/i);
    if (!heading) return "no 'Further reading'/'References' heading";
    const ext = externalLinkCount($);
    return ext >= 3 || `only ${ext} external links`;
  },

  no_emoji: ({ bodyText }) => {
    const m = bodyText.match(/\p{Extended_Pictographic}/gu);
    return !m || `found ${m.length}: ${[...new Set(m)].slice(0, 5).join(" ")}`;
  },

  // --- FAPI-specific ---------------------------------------------------
  mentions_oauth_oidc: ({ bodyText }) =>
    /oauth|openid|oidc/i.test(bodyText) || "no oauth/openid/oidc mention",

  mentions_sender_constraints: ({ bodyText }) =>
    /dpop|mtls|m-tls|sender-constrained|sender constrained/i.test(bodyText) ||
    "no DPoP / mTLS / sender-constrained mention",

  regulatory_framing: ({ $, bodyText }) => {
    const regimes = /open banking|psd2|psd3|mas\b|apra|fca|finma|cmf|trm|ojk/i;
    if (!regimes.test(bodyText)) return "no regulatory regime mentioned";
    // soft check: at least one callout-shaped block
    const callout = $(".reg-callout, .callout, [class*='callout'], aside").length > 0;
    return callout || "regime named but no callout-shaped block";
  },

  // --- PCI-DSS-specific ------------------------------------------------
  cites_specific_requirements: ({ bodyText }) => {
    const reqRe = /\b(?:req(?:uirement)?\s*\.?\s*)?(\d+\.\d+(?:\.\d+)?)\b/gi;
    const matches = [...bodyText.matchAll(reqRe)].map((m) => m[1]);
    const unique = [...new Set(matches)];
    return unique.length >= 3 || `only ${unique.length} unique requirement numbers: ${unique.join(", ")}`;
  },

  covers_tokenization_and_segmentation: ({ bodyText }) => {
    const t = bodyText.toLowerCase();
    const tok = t.includes("tokeniz") || t.includes("tokenis");
    const seg = t.includes("segment");
    if (tok && seg) return true;
    return `tokenization=${tok}, segmentation=${seg}`;
  },

  mentions_cde: ({ bodyText }) =>
    /\bCDE\b|cardholder data environment/i.test(bodyText) || "no CDE / cardholder data environment",

  // --- SPIFFE-specific -------------------------------------------------
  shows_spiffe_id_format: ({ html }) =>
    /spiffe:\/\/[a-z0-9.-]+\/[^\s<"']*/i.test(html) ||
    "no spiffe://trust-domain/workload URI in page",

  covers_both_svid_types: ({ bodyText }) => {
    const t = bodyText.toLowerCase();
    const x509 = t.includes("x.509") || t.includes("x509");
    const jwt = t.includes("jwt");
    if (x509 && jwt) return true;
    return `x.509=${x509}, jwt=${jwt}`;
  },

  has_code_or_config: ({ $ }) =>
    $("pre code, pre").length > 0 || "no <pre><code> or <pre> blocks",

  identity_provenance_on_diagram: ({ $ }) => {
    const blocks = $(".mermaid, pre.mermaid");
    if (blocks.length === 0) return "no mermaid blocks to inspect";
    const hasSpiffe = blocks
      .map((_, el) => $(el).text())
      .get()
      .some((t) => /spiffe:\/\//.test(t));
    return hasSpiffe || "no SPIFFE IDs on any Mermaid block";
  },
};

// Filenames expected by each case (parsed from the prompt for stability).
export const expectedFilenames = {
  "fapi-2.0-explainer": "fapi-2.0-explained.html",
  "pci-dss-4.0-scope-reduction": "pci-dss-4.0-scope-reduction.html",
  "spiffe-spire-workload-identity": "spiffe-spire-workload-identity.html",
};
