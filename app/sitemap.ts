import type { MetadataRoute } from "next";
import { CATEGORIES, LIVE_TOOLS, toolUpdated } from "@/lib/tools";
import { GUIDES, guideUpdated } from "@/lib/guides";
import { ALTERNATIVES } from "@/lib/alternatives";
import { GLOSSARY } from "@/lib/glossary";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const reviewed = LAST_REVIEWED;

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/ask`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/alternatives`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${c.id}`, lastModified: reviewed, changeFrequency: "weekly", priority: 0.7,
  }));
  const toolPages: MetadataRoute.Sitemap = LIVE_TOOLS.map((t) => ({
    url: `${SITE_URL}/tools/${t.slug}`, lastModified: toolUpdated(t), changeFrequency: "monthly", priority: 0.8,
  }));
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`, lastModified: guideUpdated(g), changeFrequency: "monthly", priority: 0.6,
  }));
  const altPages: MetadataRoute.Sitemap = ALTERNATIVES.map((a) => ({
    url: `${SITE_URL}/alternatives/${a.slug}`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.6,
  }));
  const glossaryPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/glossary`, lastModified: reviewed, changeFrequency: "monthly", priority: 0.5 },
    ...GLOSSARY.map((g) => ({
      url: `${SITE_URL}/glossary/${g.slug}`, lastModified: reviewed, changeFrequency: "monthly" as const, priority: 0.5,
    })),
  ];

  return [...staticPages, ...categoryPages, ...toolPages, ...guidePages, ...altPages, ...glossaryPages];
}
