import type { MetadataRoute } from "next";
import { CATEGORIES, LIVE_TOOLS, toolUpdated } from "@/lib/tools";
import { PRESETS } from "@/lib/presets";
import { GUIDES, guideUpdated } from "@/lib/guides";
import { ALTERNATIVES } from "@/lib/alternatives";
import { GLOSSARY } from "@/lib/glossary";
import { WORKFLOWS } from "@/lib/workflows";
import { LAST_REVIEWED } from "@/lib/site";
import { localeUrl, sitemapAlternates } from "@/lib/hreflang";

type Entry = {
  path: string; // locale-less path, e.g. "/tools/compress-pdf" ("/" for home)
  lastModified: Date | string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const reviewed = LAST_REVIEWED;

  const entries: Entry[] = [
    { path: "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { path: "/tools", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { path: "/ask", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/workflows", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/alternatives", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/about", lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { path: "/privacy", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { path: "/glossary", lastModified: reviewed, changeFrequency: "monthly", priority: 0.5 },
    ...CATEGORIES.map((c): Entry => ({ path: `/category/${c.id}`, lastModified: reviewed, changeFrequency: "weekly", priority: 0.7 })),
    ...LIVE_TOOLS.map((t): Entry => ({ path: `/tools/${t.slug}`, lastModified: toolUpdated(t), changeFrequency: "monthly", priority: 0.8 })),
    ...PRESETS.map((p): Entry => ({ path: `/tools/${p.tool}/${p.slug}`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.7 })),
    ...GUIDES.map((g): Entry => ({ path: `/guides/${g.slug}`, lastModified: guideUpdated(g), changeFrequency: "monthly", priority: 0.6 })),
    ...WORKFLOWS.map((w): Entry => ({ path: `/workflows/${w.slug}`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.6 })),
    ...ALTERNATIVES.map((a): Entry => ({ path: `/alternatives/${a.slug}`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.6 })),
    ...GLOSSARY.map((g): Entry => ({ path: `/glossary/${g.slug}`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.5 })),
  ];

  return entries.map((e) => ({
    url: localeUrl(e.path, "en"),
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
    alternates: { languages: sitemapAlternates(e.path) },
  }));
}
