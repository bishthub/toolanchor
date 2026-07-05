// Central site config. Change SITE_URL to your real domain before deploying —
// it drives canonical URLs, Open Graph tags, the sitemap and JSON-LD.
export const SITE_NAME = "ToolAnchor";
// Spelling variants people actually type into Google. Fed to WebSite/Organization
// `alternateName` so Google's site-name system links "Tool Anchor" (two words)
// and the bare domain to this site instead of the anchor-hardware companies
// that currently own that SERP.
export const SITE_ALTERNATE_NAMES = ["Tool Anchor", "toolanchor", "toolanchor.com"];
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://toolanchor.com";
export const SITE_DESCRIPTION =
  "A growing A-Z collection of free, fast, privacy-first online tools for PDF, images, text, developers and everyday calculations. No uploads, no sign-up.";
// Public contact address (override per-environment). Used on the Contact page,
// legal pages and Organization structured data.
export const SITE_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@toolanchor.com";

// ── Freshness ──────────────────────────────────────────────────────────────
// Date the catalogue was last reviewed site-wide (ISO yyyy-mm-dd). Individual
// tools/guides may override with their own `updated` field. Drives the visible
// "Last updated" line and `dateModified` in structured data — a strong
// freshness signal for both search and AI answer engines. Bump on each review.
export const LAST_REVIEWED = "2026-07-01";
// When the project launched — used as datePublished / foundingDate. Must not
// predate the site actually existing (Google treats impossible dates as noise).
export const FOUNDING_YEAR = "2026";
export const LAUNCH_DATE = "2026-07-01";

// ── Entity graph (E-E-A-T / GEO) ─────────────────────────────────────────────
// Stable @id nodes so pages can reference the same Website/Organization entity
// instead of re-declaring inline copies. A well-formed, cross-linked entity is
// what lets AI engines and Google's Knowledge Graph recognise "ToolAnchor".
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Off-site profiles that represent this brand. Populate as you create them
// (X, GitHub, Product Hunt, AlternativeTo, etc.); each strengthens the entity.
export const SITE_SAME_AS: string[] = [
  // "https://x.com/toolanchor",
  // "https://github.com/toolanchor",
  // "https://www.producthunt.com/products/toolanchor",
];

/** The canonical Organization node. Pass withContext for a standalone block. */
export function organizationNode(withContext = false) {
  return {
    ...(withContext ? { "@context": "https://schema.org" } : {}),
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    email: SITE_EMAIL,
    slogan: "Free, fast, privacy-first online tools.",
    foundingDate: FOUNDING_YEAR,
    ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
  };
}

/** Lightweight reference to the Organization, e.g. `publisher: ORG_REF`. */
export const ORG_REF = { "@id": ORG_ID };

/** Format an ISO date (yyyy-mm-dd) as e.g. "July 2026" for display. */
export function formatUpdated(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
