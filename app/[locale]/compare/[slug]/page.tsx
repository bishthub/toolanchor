import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getComparison, COMPARISONS, comparisonUpdated } from "@/lib/comparisons";
import { alternatesFor, localeUrl } from "@/lib/hreflang";
import { SITE_URL, SITE_NAME, ORG_REF, WEBSITE_ID, formatUpdated } from "@/lib/site";
import { getTranslations } from "next-intl/server";
import ComparisonTable from "@/components/ComparisonTable";
import ToolCard from "@/components/ToolCard";
import { getTool } from "@/lib/tools";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const comp = getComparison(slug);
  if (!comp) return {};
  return {
    title: `${comp.name} — ${SITE_NAME}`,
    description: comp.description,
    alternates: alternatesFor(`/compare/${slug}`, locale),
    openGraph: {
      title: `${comp.name} — ${SITE_NAME}`,
      description: comp.description,
      url: localeUrl(`/compare/${slug}`, locale),
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const comp = getComparison(slug);
  if (!comp) notFound();

  const url = localeUrl(`/compare/${slug}`, locale);
  const updated = comparisonUpdated(comp);
  const t = await getTranslations("toolPage");

  const related = (comp.relatedToolSlugs ?? [])
    .map((s) => getTool(s))
    .filter((t): t is NonNullable<typeof t> => !!t && t.status === "live");

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: comp.name,
      description: comp.description,
      inLanguage: "en",
      dateModified: updated,
      isPartOf: { "@id": WEBSITE_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Comparisons", item: `${SITE_URL}/compare` },
        { "@type": "ListItem", position: 3, name: comp.name, item: url },
      ],
    },
  ];

  return (
    <div className="container tool-page tool-focus">
      <JsonLd data={jsonLd} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/compare">Comparisons</Link>
        <span className="sep">/</span>
        <span>{comp.name}</span>
      </nav>

      <div className="tool-head">
        {comp.altName && <span className="eyebrow">{comp.altName}</span>}
        <h1>{comp.name}</h1>
        <p className="lede">{comp.intro}</p>
        <p className="updated">{t("lastUpdated", { date: formatUpdated(updated) })}</p>
      </div>

      <p className="answer-box">{comp.answer}</p>

      <ComparisonTable comp={comp} />

      <section className="content-block">
        <h2>Which one wins?</h2>
        <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7 }}>{comp.verdict}</p>
      </section>

      {related.length > 0 && (
        <section className="content-block">
          <h2>Related tools</h2>
          <div className="grid">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
