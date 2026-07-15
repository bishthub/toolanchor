// ─────────────────────────────────────────────────────────────────────────
// Embeddable widgets — privacy-first tools any site can embed.
// Each slug here renders chrome-less at /embed/<slug> (framable by any
// origin) and appears in the /widgets builder. Widgets carry a small
// "Powered by ToolAnchor" attribution link back to the tool page.
// Keep this list to tools that are self-contained, compact and useful on a
// third-party page (calculators, generators, text utilities) — heavy
// file-processing tools need more space than a widget allows.
// ─────────────────────────────────────────────────────────────────────────

import { getTool, type Tool } from "@/lib/tools";

export const EMBEDDABLE_SLUGS: string[] = [
  // Calculators
  "percentage-calculator",
  "bmi-calculator",
  "age-calculator",
  "loan-emi-calculator",
  "mortgage-calculator",
  "compound-interest-calculator",
  "sip-calculator",
  "tip-calculator",
  "discount-calculator",
  "gpa-calculator",
  "date-difference-calculator",
  "days-until-calculator",
  "add-subtract-days",
  "salary-to-hourly",
  "fuel-cost-calculator",
  "scientific-calculator",
  "average-calculator",
  "fraction-calculator",
  "unit-converter",
  "temperature-converter",
  "calorie-calculator",
  "body-fat-calculator",
  "sleep-calculator",
  // Generators & utilities
  "password-generator",
  "qr-code-generator",
  "uuid-generator",
  "random-number-generator",
  "random-name-picker",
  "lorem-ipsum-generator",
  "countdown-timer",
  "stopwatch-timer",
  "pomodoro-timer",
  // Text & word tools
  "word-counter",
  "character-counter",
  "case-converter",
  "readability-checker",
  "wordle-solver",
  "word-unscrambler",
  "bracket-generator",
  // Developer & design
  "json-formatter",
  "color-converter",
  "css-gradient-generator",
  "box-shadow-generator",
  "unix-timestamp-converter",
];

export function isEmbeddable(slug: string): boolean {
  return EMBEDDABLE_SLUGS.includes(slug);
}

/** Embeddable tools resolved against the registry (skips any stale slugs). */
export function embeddableTools(): Tool[] {
  return EMBEDDABLE_SLUGS
    .map((s) => getTool(s))
    .filter((t): t is Tool => !!t && t.status === "live");
}

export interface EmbedOptions {
  theme: "auto" | "light" | "dark";
  accent: string;   // hex without "#", e.g. "4f46e5" ("" = site default)
  radius: number;   // px, iframe corner rounding
}

export const EMBED_DEFAULTS: EmbedOptions = { theme: "auto", accent: "", radius: 12 };

/** Query string for an /embed URL (omits values that match defaults). */
export function embedQuery(opts: EmbedOptions): string {
  const q = new URLSearchParams();
  if (opts.theme !== "auto") q.set("theme", opts.theme);
  if (opts.accent) q.set("accent", opts.accent);
  const s = q.toString();
  return s ? `?${s}` : "";
}
