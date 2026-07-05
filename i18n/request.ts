import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Per-request locale + messages. Falls back to the default locale for anything
// unrecognized, and to English messages if a locale catalog is missing a key
// (spread en first, then overlay the locale's catalog).
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const en = (await import("../messages/en.json")).default;
  const messages =
    locale === "en"
      ? en
      : { ...en, ...(await import(`../messages/${locale}.json`)).default };

  return { locale, messages };
});
