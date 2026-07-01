import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES, getGuide } from "@/lib/guides";
import { getTool } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: `${g.title} — ${SITE_NAME}`, description: g.description, type: "article", url: `${SITE_URL}/guides/${g.slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const tool = getTool(g.toolSlug);
  const related = g.related.map(getTool).filter((t) => t && t.status === "live");
  const url = `${SITE_URL}/guides/${g.slug}`;

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: g.title, description: g.description, url,
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
    {
      "@context": "https://schema.org", "@type": "HowTo", name: g.title,
      step: g.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span>
        <Link href="/guides">Guides</Link><span className="sep">/</span><span>{g.title}</span>
      </nav>

      <div className="tool-head">
        <span className="eyebrow">Guide</span>
        <h1>{g.title}</h1>
        <p className="lede">{g.intro}</p>
      </div>

      {/* Prominent CTA to the tool */}
      {tool && (
        <div className="tool-shell">
          <div className="tool-shell-body" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{tool.name}</strong>
              <p className="section-blurb" style={{ margin: "4px 0 0" }}>{tool.description}</p>
            </div>
            <Link href={`/tools/${tool.slug}`} className="btn" style={{ display: "inline-flex", whiteSpace: "nowrap" }}>Open the tool →</Link>
          </div>
        </div>
      )}

      <section className="content-block">
        <h2>Step by step</h2>
        <ol className="steps">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </section>

      {g.sections.map((s, i) => (
        <section key={i} className="content-block">
          <h2>{s.h2}</h2>
          <p className="section-blurb">{s.body}</p>
        </section>
      ))}

      <section className="content-block">
        <h2>FAQ</h2>
        {g.faqs.map((f, i) => (
          <details key={i} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>

      {related.length > 0 && (
        <section className="content-block">
          <h2>Related tools</h2>
          <div className="grid">
            {related.map((t) => <ToolCard key={t!.slug} tool={t!} />)}
          </div>
        </section>
      )}
    </div>
  );
}
