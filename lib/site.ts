// Central site config. Change SITE_URL to your real domain before deploying —
// it drives canonical URLs, Open Graph tags, the sitemap and JSON-LD.
export const SITE_NAME = "ToolAnchor";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://toolanchor.com";
export const SITE_DESCRIPTION =
  "A growing A-Z collection of free, fast, privacy-first online tools for PDF, images, text, developers and everyday calculations. No uploads, no sign-up.";
