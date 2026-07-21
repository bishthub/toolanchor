import { defineRouting } from "next-intl/routing";

// Locale routing. English is the default and served at bare URLs (no /en/
// prefix); other locales are prefixed (/es/…). English is prerendered at build;
// non-English pages render on-demand (ISR) so build time stays flat.
export const routing = defineRouting({
  locales: ["en", "es", "pt", "hi", "id"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Don't let the NEXT_LOCALE cookie drive routing. With `as-needed`, cookie
  // detection makes the middleware 307-redirect any unprefixed English URL
  // (e.g. /guides) to whatever locale the cookie holds. After switching to a
  // non-English locale and back to English, the stale cookie + Next's cached
  // redirect made nav links "stick" to the previously selected language. The
  // locale now comes purely from the URL prefix, so switching back to English
  // (bare URLs) works reliably. hreflang/alternates still cover discovery.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
