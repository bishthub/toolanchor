import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTool, getCategory, LIVE_TOOLS, relatedTools, toolAnswer, toolUpdated } from "@/lib/tools";
import { presetsForTool } from "@/lib/presets";
import { SITE_NAME, SITE_URL, FOUNDING_YEAR, ORG_REF, WEBSITE_ID, formatUpdated } from "@/lib/site";
import ToolPageRunner from "@/components/ToolPageRunner";
import LocalBadge from "@/components/LocalBadge";
import ToolCard from "@/components/ToolCard";
import CategoryIcon from "@/components/CategoryIcon";
import ToolUsageTracker from "@/components/ToolUsageTracker";
import PinButton from "@/components/PinButton";
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
  const presets = presetsForTool(tool.slug);
  const url = `${SITE_URL}/tools/${tool.slug}`;
  const answer = toolAnswer(tool);
  const updated = toolUpdated(tool);

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
      browserRequirements: "Requires a modern web browser with JavaScript enabled.",
      softwareVersion: "1.0",
      inLanguage: "en",
      isAccessibleForFree: true,
      featureList: tool.keywords,
      datePublished: `${FOUNDING_YEAR}-01-01`,
      dateModified: updated,
      publisher: ORG_REF,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
      inLanguage: "en",
      dateModified: updated,
      isPartOf: { "@id": WEBSITE_ID },
      // Voice-assistant hint: the extractable answer + heading.
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-box", ".tool-head h1"] },
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
      description: answer,
      totalTime: "PT1M",
      tool: [{ "@type": "HowToTool", name: `${SITE_NAME} ${tool.name}` }],
      step: tool.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: `Step ${i + 1}`,
        text: s,
        url: `${url}#step-${i + 1}`,
      })),
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
      className="container tool-page tool-focus"
      style={{ ["--cat" as string]: `var(--cat-${tool.category})` }}
    >
      <JsonLd data={jsonLd} />
      <ToolUsageTracker slug={tool.slug} />

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
        {cat && <span className="eyebrow">{cat.name}</span>}
        <h1>{tool.name}</h1>
        <p className="lede">{tool.intro}</p>
        <p className="updated">Last updated: {formatUpdated(updated)}</p>
      </div>

      {/* Quick answer — the most extractable passage for AI answer engines. */}
      <p className="answer-box">{answer}</p>

      <LocalBadge local={tool.local !== false} />

      {/* One-tap presets — deep links that open this tool pre-configured. */}
      {presets.length > 0 && (
        <div className="preset-chips" style={{ margin: "-12px 0 26px" }}>
          <span className="preset-chips-label">Popular presets:</span>
          {presets.map((p) => (
            <Link key={p.slug} href={`/tools/${p.tool}/${p.slug}`} className="preset-chip">
              {p.chip}
            </Link>
          ))}
        </div>
      )}

      <div className="tool-shell">
        <div className="tool-shell-bar">
          <span className="tool-shell-icon" aria-hidden="true">
            <CategoryIcon id={tool.category} size={16} />
          </span>
          <span className="label">{tool.name}</span>
          <PinButton slug={tool.slug} />
          <span className="privacy-chip">{tool.local !== false ? "Runs in your browser" : "Local + opt-in AI"}</span>
        </div>
        <div className="tool-shell-body">
          <ToolPageRunner slug={tool.slug} />
        </div>
      </div>

      {/* How to use — body content for SEO */}
      <section className="content-block">
        <h2>How to use {tool.name}</h2>
        <ol className="steps">
          {tool.steps.map((s, i) => (
            <li key={i} id={`step-${i + 1}`}>{s}</li>
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
