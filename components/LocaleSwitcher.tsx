"use client";

// Language toggle. Links the current page to each locale (next-intl keeps the
// same path and swaps the prefix), so switching stays on the same tool/page.

import { useLocale } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABEL: Record<string, string> = { en: "EN", es: "ES" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="locale-switcher" aria-label="Language">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`locale-opt ${l === locale ? "on" : ""}`}
          aria-current={l === locale ? "true" : undefined}
        >
          {LABEL[l] ?? l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
