import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/** Absolute URL for a locale-less path in a given locale (en = bare, else /xx/…). */
export function localeUrl(pathname: string, locale: string): string {
  const p = pathname === "/" ? "" : pathname;
  return locale === routing.defaultLocale ? `${SITE_URL}${p || "/"}` : `${SITE_URL}/${locale}${p}`;
}

/**
 * Canonical + hreflang alternates for a page, given its locale-less path and the
 * current locale. Canonical is the current locale's URL; languages lists every
 * locale plus x-default (English). Feed straight into Metadata.alternates.
 */
export function alternatesFor(pathname: string, locale: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(pathname, l);
  languages["x-default"] = localeUrl(pathname, routing.defaultLocale);
  return { canonical: localeUrl(pathname, locale), languages };
}

/** Per-locale alternates map for a sitemap entry (no x-default in sitemaps). */
export function sitemapAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(pathname, l);
  return languages;
}
