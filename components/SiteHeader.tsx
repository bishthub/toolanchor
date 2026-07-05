"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CATEGORIES } from "@/lib/tools";
import { SITE_NAME } from "@/lib/site";
import { HeaderPaletteButton } from "@/components/CommandPalette";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import CategoryIcon from "@/components/CategoryIcon";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Resolve the effective theme on mount (stored choice → else system).
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      );
    }
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    document.documentElement.dataset.theme = next;
  }

  const themeButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
    >
      {mounted && theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Left: brand + primary nav */}
        <Link href="/" className="logo" aria-label={`${SITE_NAME} home`}>
          <span className="logo-mark" aria-hidden="true">◆</span>
          {SITE_NAME.slice(0, 4)}<span className="logo-accent">{SITE_NAME.slice(4)}</span>
        </Link>

        <nav className="nav-primary" aria-label="Primary">
          <Link href="/ask">{t("ask")}</Link>
          <Link href="/workflows">{t("workflows")}</Link>
          <Link href="/guides">{t("guides")}</Link>
        </nav>

        {/* Right: search + actions */}
        <div className="header-actions">
          <HeaderPaletteButton />
          <Link href="/tools" className="cta">{t("allTools")}</Link>
          <span className="header-divider" aria-hidden="true" />
          <LocaleSwitcher />
          {themeButton}
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile drawer */}
        <nav className="nav-drawer" data-open={open} aria-label="Mobile navigation">
          <Link href="/ask">{t("ask")}</Link>
          <Link href="/workflows">{t("workflows")}</Link>
          <Link href="/guides">{t("guides")}</Link>
          <Link href="/tools" className="cta">{t("allTools")}</Link>
          <div className="nav-drawer-cats">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={`/category/${c.id}`}>
                <span style={{ color: `var(--cat-${c.id})`, display: "inline-flex" }}>
                  <CategoryIcon id={c.id} size={15} />
                </span>
                {c.name}
              </Link>
            ))}
          </div>
          <div className="nav-drawer-foot">
            <span className="nav-drawer-foot-label">Language</span>
            <LocaleSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ── Inline icons (no external deps, stay crisp in both themes) ──────── */
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
