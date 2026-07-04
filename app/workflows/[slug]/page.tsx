import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WORKFLOWS, getWorkflow } from "@/lib/workflows";
import { getTool } from "@/lib/tools";
import { SITE_NAME, SITE_URL, WEBSITE_ID, ORG_REF } from "@/lib/site";
import StartWorkflowButton from "@/components/StartWorkflowButton";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return WORKFLOWS.map((w) => ({ slug: w.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) return {};
  return {
    title: w.name,
    description: w.description,
    alternates: { canonical: `/workflows/${w.slug}` },
    openGraph: { title: `${w.name} — ${SITE_NAME}`, description: w.description, url: `${SITE_URL}/workflows/${w.slug}`, type: "website" },
  };
}

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) notFound();

  const url = `${SITE_URL}/workflows/${w.slug}`;
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: w.name,
      description: w.answer,
      totalTime: "PT2M",
      step: w.steps.map((s, i) => {
        const t = getTool(s.tool);
        return { "@type": "HowToStep", position: i + 1, name: t?.name ?? s.tool, text: s.note, url: `${SITE_URL}/tools/${s.tool}` };
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url, name: `${w.name} — ${SITE_NAME}`, description: w.description,
      inLanguage: "en", isPartOf: { "@id": WEBSITE_ID }, publisher: ORG_REF,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-box", ".tool-head h1"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Workflows", item: `${SITE_URL}/workflows` },
        { "@type": "ListItem", position: 3, name: w.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: w.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span>
        <Link href="/workflows">Workflows</Link><span className="sep">/</span><span>{w.name}</span>
      </nav>

      <div className="tool-head">
        <span className="eyebrow">Workflow · {w.steps.length} steps</span>
        <h1>{w.name}</h1>
        <p className="lede">{w.intro}</p>
      </div>

      <p className="answer-box">{w.answer}</p>

      <div style={{ margin: "18px 0 28px" }}>
        <StartWorkflowButton wf={w} />
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>
          Starts at step 1. Your file is carried between steps automatically — nothing is uploaded.
        </p>
      </div>

      <section className="content-block">
        <h2>The steps</h2>
        <ol className="steps">
          {w.steps.map((s, i) => {
            const t = getTool(s.tool);
            return (
              <li key={i}>
                <strong>{t?.name ?? s.tool}</strong> — {s.note}{" "}
                <Link href={`/tools/${s.tool}`} style={{ color: "var(--accent)" }}>open tool</Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="content-block">
        <h2>Frequently asked questions</h2>
        {w.faqs.map((f, i) => (
          <details key={i} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
