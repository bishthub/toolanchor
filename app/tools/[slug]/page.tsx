import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTool, getCategory, LIVE_TOOLS, relatedTools } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import ToolRunner from "@/components/tools/registry";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

// Pre-render a static page for every LIVE tool (great for SEO + speed).
export function generateStaticParams() {
  return LIVE_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const url = `${SITE_URL}/tools/${tool.slug}`;
  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      title: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "live") notFound();

  const cat = getCategory(tool.category);
  const related = relatedTools(tool);
  const url = `${SITE_URL}/tools/${tool.slug}`;

  // ── Structured data for rich results + AI search ──────────────────────
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.description,
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat?.name ?? "Tools", item: `${SITE_URL}/category/${tool.category}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${tool.name}`,
      step: tool.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div
      className="container tool-page"
      style={{ ["--cat" as string]: `var(--cat-${tool.category})` }}
    >
      <JsonLd data={jsonLd} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {cat && (
          <>
            <span className="sep">/</span>
            <Link href={`/category/${cat.id}`}>{cat.name}</Link>
          </>
        )}
        <span className="sep">/</span>
        <span>{tool.name}</span>
      </nav>

      <div className="tool-head">
        {cat && <span className="eyebrow">{cat.emoji} {cat.name}</span>}
        <h1>{tool.name}</h1>
        <p className="lede">{tool.intro}</p>
      </div>

      <div className="tool-shell">
        <div className="tool-shell-bar">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="label">{tool.name.toLowerCase().replace(/\s+/g, "-")}</span>
          <span className="privacy-chip">🔒 Runs in your browser</span>
        </div>
        <div className="tool-shell-body">
          <ToolRunner slug={tool.slug} />
        </div>
      </div>

      {/* How to use — body content for SEO */}
      <section className="content-block">
        <h2>How to use {tool.name}</h2>
        <ol className="steps">
          {tool.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {/* FAQ — matches the FAQPage JSON-LD above */}
      <section className="content-block">
        <h2>Frequently asked questions</h2>
        {tool.faqs.map((f, i) => (
          <details key={i} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      {/* Related tools — internal linking */}
      {related.length > 0 && (
        <section className="content-block">
          <h2>Related {cat?.name.toLowerCase()}</h2>
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
