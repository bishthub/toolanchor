import { defineRouting } from "next-intl/routing";

// Locale routing. English is the default and served at bare URLs (no /en/
// prefix); other locales are prefixed (/es/…). English is prerendered at build;
// non-English pages render on-demand (ISR) so build time stays flat.
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
