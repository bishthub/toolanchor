import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ALTERNATIVES, getAlternative, alternativeUpdated } from "@/lib/alternatives";
import { getTool } from "@/lib/tools";
import { SITE_NAME, SITE_URL, WEBSITE_ID, formatUpdated } from "@/lib/site";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAlternative(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `/alternatives/${a.slug}` },
    openGraph: { title: `${a.title} — ${SITE_NAME}`, description: a.description, type: "article", url: `${SITE_URL}/alternatives/${a.slug}` },
  };
}

export default async function AlternativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAlternative(slug);
  if (!a) notFound();

  const tools = a.toolSlugs.map(getTool).filter((t) => t && t.status === "live");
  const url = `${SITE_URL}/alternatives/${a.slug}`;
  const answer = a.answer ?? a.intro;
  const updated = alternativeUpdated(a);

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Alternatives", item: `${SITE_URL}/alternatives` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "WebPage",
      "@id": `${url}#webpage`, url, name: `${a.title} — ${SITE_NAME}`,
      description: a.description, inLanguage: "en", dateModified: updated,
      isPartOf: { "@id": WEBSITE_ID },
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-box", ".tool-head h1"] },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: a.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span>
        <Link href="/alternatives">Alternatives</Link><span className="sep">/</span><span>{a.competitor}</span>
      </nav>

      <div className="tool-head">
        <span className="eyebrow">{SITE_NAME} vs {a.competitor}</span>
        <h1>{a.title}</h1>
        <p className="lede">{a.intro}</p>
        <p className="updated">Last updated: {formatUpdated(updated)}</p>
      </div>

      {/* Quick answer — the most extractable passage for AI answer engines. */}
      <p className="answer-box">{answer}</p>

      <section className="content-block">
        <h2>How they compare</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>Feature</th>
                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)", color: "var(--accent)" }}>{SITE_NAME}</th>
                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{a.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {a.comparison.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>✅ {row.us}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-block">
        <h2>Why choose {SITE_NAME}</h2>
        <ul className="steps">{a.whyUs.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </section>

      {tools.length > 0 && (
        <section className="content-block">
          <h2>The tools that replace {a.competitor}</h2>
          <div className="grid">
            {tools.map((t) => <ToolCard key={t!.slug} tool={t!} />)}
          </div>
        </section>
      )}

      <section className="content-block">
        <h2>FAQ</h2>
        {a.faqs.map((f, i) => (
          <details key={i} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>
    </div>
  );
}
