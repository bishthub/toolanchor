import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTool, getCategory } from "@/lib/tools";
import { PRESETS, getPreset, presetsForTool } from "@/lib/presets";
import { SITE_NAME, SITE_URL, WEBSITE_ID, ORG_REF } from "@/lib/site";
import ToolPageRunner from "@/components/ToolPageRunner";
import CategoryIcon from "@/components/CategoryIcon";
import ToolUsageTracker from "@/components/ToolUsageTracker";
import PinButton from "@/components/PinButton";
import JsonLd from "@/components/JsonLd";

// Pre-render every preset page — pure static programmatic SEO.
export function generateStaticParams() {
  return PRESETS.map((p) => ({ slug: p.tool, preset: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; preset: string }>;
}): Promise<Metadata> {
  const { slug, preset } = await params;
  const p = getPreset(slug, preset);
  if (!p) return {};
  const url = `${SITE_URL}/tools/${p.tool}/${p.slug}`;
  return {
    title: p.metaTitle,
    description: p.description,
    alternates: { canonical: `/tools/${p.tool}/${p.slug}` },
    openGraph: {
      title: `${p.name} — ${SITE_NAME}`,
      description: p.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.name} — ${SITE_NAME}`,
      description: p.description,
    },
  };
}

export default async function PresetPage({
  params,
}: {
  params: Promise<{ slug: string; preset: string }>;
}) {
  const { slug, preset: presetSlug } = await params;
  const p = getPreset(slug, presetSlug);
  const tool = getTool(slug);
  if (!p || !tool || tool.status !== "live") notFound();

  const cat = getCategory(tool.category);
  const url = `${SITE_URL}/tools/${p.tool}/${p.slug}`;
  const siblings = presetsForTool(p.tool).filter((s) => s.slug !== p.slug);

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${p.name} — ${SITE_NAME}`,
      description: p.description,
      inLanguage: "en",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: ORG_REF,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-box", ".tool-head h1"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat?.name ?? "Tools", item: `${SITE_URL}/category/${tool.category}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}/tools/${tool.slug}` },
        { "@type": "ListItem", position: 4, name: p.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faqs.map((f) => ({
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
        <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
        <span className="sep">/</span>
        <span>{p.chip}</span>
      </nav>

      <div className="tool-head">
        {cat && <span className="eyebrow">{cat.name} · preset</span>}
        <h1>{p.name}</h1>
        <p className="lede">{p.description}</p>
      </div>

      <p className="answer-box">{p.answer}</p>

      <div className="tool-shell">
        <div className="tool-shell-bar">
          <span className="tool-shell-icon" aria-hidden="true">
            <CategoryIcon id={tool.category} size={16} />
          </span>
          <span className="label">{tool.name} — {p.chip}</span>
          <PinButton slug={tool.slug} />
          <span className="privacy-chip">Runs in your browser</span>
        </div>
        <div className="tool-shell-body">
          <ToolPageRunner slug={tool.slug} preset={p.params} />
        </div>
      </div>

      {/* Sibling presets — dense internal linking across the preset cluster */}
      {siblings.length > 0 && (
        <section className="content-block">
          <h2>Other {tool.name.toLowerCase()} presets</h2>
          <div className="preset-chips">
            <Link href={`/tools/${tool.slug}`} className="preset-chip">
              Custom size
            </Link>
            {siblings.map((s) => (
              <Link key={s.slug} href={`/tools/${s.tool}/${s.slug}`} className="preset-chip">
                {s.chip}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How to use — inherits the parent tool's steps */}
      <section className="content-block">
        <h2>How it works</h2>
        <ol className="steps">
          {tool.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="content-block">
        <h2>Frequently asked questions</h2>
        {p.faqs.map((f, i) => (
          <details key={i} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
