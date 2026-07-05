import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { GLOSSARY, getTerm, termUpdated } from "@/lib/glossary";
import { getTool } from "@/lib/tools";
import { SITE_NAME, SITE_URL, WEBSITE_ID, ORG_REF, formatUpdated } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) return {};
  return {
    title: `What is ${t.term}?`,
    description: t.short,
    keywords: [t.term, ...(t.aka ?? [])],
    alternates: { canonical: `/glossary/${t.slug}` },
    openGraph: { title: `What is ${t.term}? — ${SITE_NAME}`, description: t.short, type: "article", url: `${SITE_URL}/glossary/${t.slug}` },
  };
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) notFound();

  const tool = t.toolSlug ? getTool(t.toolSlug) : undefined;
  const relatedTerms = t.related.map(getTerm).filter(Boolean);
  const url = `${SITE_URL}/glossary/${t.slug}`;
  const updated = termUpdated(t);

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: t.term,
      alternateName: t.aka,
      description: t.definition,
      url,
      inDefinedTermSet: `${SITE_URL}/glossary`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `What is ${t.term}? — ${SITE_NAME}`,
      description: t.short,
      inLanguage: "en",
      dateModified: updated,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: ORG_REF,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".definition", ".tool-head h1"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Glossary", item: `${SITE_URL}/glossary` },
        { "@type": "ListItem", position: 3, name: t.term, item: url },
      ],
    },
    ...(t.faqs && t.faqs.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: t.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }]
      : []),
  ];

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span>
        <Link href="/glossary">Glossary</Link><span className="sep">/</span><span>{t.term}</span>
      </nav>

      <div className="tool-head">
        <span className="eyebrow">Definition</span>
        <h1>What is {t.term}?</h1>
        {t.aka && t.aka.length > 0 && (
          <p className="lede">Also known as: {t.aka.join(", ")}.</p>
        )}
        <p className="updated">Last updated: {formatUpdated(updated)}</p>
      </div>

      {/* Self-contained definition — the passage AI answer engines extract. */}
      <dl className="definition">
        <dt>{t.term}</dt>
        <dd>{t.definition}</dd>
      </dl>

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

      {t.sections.map((s, i) => (
        <section key={i} className="content-block">
          <h2>{s.h2}</h2>
          <p className="section-blurb">{s.body}</p>
        </section>
      ))}

      {t.faqs && t.faqs.length > 0 && (
        <section className="content-block">
          <h2>FAQ</h2>
          {t.faqs.map((f, i) => (
            <details key={i} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </section>
      )}

      {relatedTerms.length > 0 && (
        <section className="content-block">
          <h2>Related terms</h2>
          <div className="grid">
            {relatedTerms.map((r) => (
              <Link key={r!.slug} href={`/glossary/${r!.slug}`} className="card">
                <span className="badge">Definition</span>
                <h3>{r!.term}</h3>
                <p>{r!.short}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {t.sources && t.sources.length > 0 && (
        <section className="content-block">
          <h2>Sources &amp; further reading</h2>
          <ul className="steps">
            {t.sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--accent)" }}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
