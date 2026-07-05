# Phase 9 — Internationalization (i18n): project plan

Phase 9 is not like Phases 1–8. Those were additive — new files, new tools, a
new component. i18n is a **structural refactor of every route** plus a **large
content-translation effort**, on a **live, SEO-driven site**. Getting URLs,
canonicals or hreflang wrong can hurt rankings, and it can't be verified by a
headless build alone. So this file scopes it as its own project (as PLAN.md
instructs) and names the decisions that gate implementation.

## Codebase facts that shape the approach

- **Not a static export.** No `output: "export"`; `/api/ai-detect` runs as a
  Netlify serverless function. → `next-intl` middleware works here. Good.
- **19 `page.tsx` routes**, several dynamic and high-cardinality:
  `/tools/[slug]` (~118), `/tools/[slug]/[preset]` (~24), `/workflows/[slug]` (6),
  `/category/[slug]`, `/guides/[slug]`, `/alternatives/[slug]`, `/glossary/[slug]`,
  plus static pages (home, about, privacy, terms, contact, ask, tools, workflows,
  guides, alternatives, glossary).
- **Content lives in TS registries**: `lib/tools.ts` (name/description/intro/steps/
  faqs/answer/keywords per tool), `lib/presets.ts`, `lib/workflows.ts`,
  `lib/guides.ts`, `lib/alternatives.ts`, `lib/glossary.ts`, category prose in
  `CATEGORIES`. This is the bulk of what must be translated.
- **Chrome strings are inline in components** (SiteHeader, footer in layout.tsx,
  CommandPalette, WorkflowBar, SendToTool, BatchFileList, LocalBadge, DoNext,
  tool-page scaffolding labels, homepage copy). These must be extracted to a
  message catalog.
- **Intent matching** (`lib/intent.ts` ALIASES) is English-only; non-English
  phrasing ("pdf chhota karo") needs per-locale alias sets.
- **Generated files** that must emit per-locale + hreflang: `app/sitemap.ts`,
  `app/llms.txt/route.ts`. `public/sw.js` precache list references routes.

## Recommended architecture

1. **Routing**: `next-intl` with `app/[locale]/…`. Default `en` served at bare
   URLs via `localePrefix: "as-needed"` (no `/en/`), other locales prefixed
   (`/hi/…`). Add `middleware.ts` for locale negotiation. Root `app/layout.tsx`
   stays minimal; move the current layout to `app/[locale]/layout.tsx` and set
   `<html lang={locale}>`.
2. **Keep registries structural, move prose out.** `lib/tools.ts` stays the
   source of truth for slugs/category/status/flags. Move translatable prose to
   `content/<locale>/tools.ts` (keyed by slug); a resolver merges structure +
   locale prose, falling back to `en` for any missing key. Same pattern for
   presets/workflows/guides/etc. This keeps one structural registry and lets us
   **ship locale-by-locale and tool-by-tool without breakage** (missing → English).
3. **Chrome catalog**: `messages/<locale>.json` for UI strings; components use
   `useTranslations()` / `getTranslations()`.
4. **SEO**: every page emits `alternates.languages` (hreflang) + a self canonical;
   sitemap emits one entry per locale per page with `alternates`. llms.txt can stay
   English (or add a localized note).
5. **Intent**: `ALIASES` becomes per-locale; `matchTools` takes a locale and reads
   that locale's aliases layered over English.
6. **Render strategy (build cost)**: full static gen of every page × every locale
   is ~150 pages × N locales (plus per-page opengraph images ≈ double). At 5
   locales that's ~1500+ prerenders — watch Netlify build minutes. Recommended:
   **statically generate `en` (as today); render non-`en` on-demand with ISR**
   (`revalidate`) so build time stays flat and locale pages still cache at the
   edge. Revisit full pregen per-locale once content is stable.

## Rollout order (each step ships safely; English never breaks)

1. **Foundation**: next-intl install, `middleware.ts`, `app/[locale]/` move, locale
   config with `en` only. Site behaves identically; URLs unchanged. Verify build.
2. **Chrome extraction**: pull inline UI strings into `messages/en.json`, wire
   `useTranslations`. Still English-only. Verify nothing shifted.
3. **Content resolver**: introduce `content/en/*` (re-exporting today's prose) +
   the merge/fallback resolver. No visible change.
4. **Add locale #1** (pilot — recommend Hindi given the India-focused calculators):
   translate chrome + top ~20 tools, wire hreflang + sitemap + intent aliases.
   Ship `/hi/`. Measure build/QA.
5. **Backfill** remaining tools for locale #1, then repeat per locale.

## Risks / watch-items

- **SEO**: canonical + hreflang must be exactly right; a bad rollout can deindex.
  Do not push locale URLs until hreflang validates.
- **Every internal `<Link href>`** must become locale-aware (next-intl `Link`).
  Missing one silently drops the user back to `en` — needs a sweep.
- **Build time / Netlify limits** (see render strategy).
- **Translation quality**: machine translation of tool prose risks the
  professional/neutral brand ("Graphite"). Needs a quality bar + spot-check.
- **Cannot be verified headlessly** — needs real browser + hreflang testing tools.

## Gating decisions (needed before writing code)

1. Which locales, and how many to pilot first?
2. Translation source & quality bar (machine + human spot-check? which engine?).
3. Confirm sub-path URLs (`/hi/`) and the SEO-restructure risk on the live site.
4. Render strategy: ISR for non-en (flat build) vs full static pregen (big build).
