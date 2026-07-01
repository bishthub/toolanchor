import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import CategoryIcon from "@/components/CategoryIcon";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, WEBSITE_ID, LAST_REVIEWED, formatUpdated } from "@/lib/site";
import {
  CATEGORIES,
  getCategory,
  getTool,
  toolsByCategory,
  type CategoryId,
} from "@/lib/tools";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug as CategoryId);
  if (!cat) return {};
  return {
    title: `${cat.name} — Free & Private`,
    description: cat.blurb,
    alternates: { canonical: `/category/${cat.id}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug as CategoryId);
  if (!cat) notFound();

  const tools = toolsByCategory(cat.id);
  const live = tools.filter((t) => t.status === "live");
  const url = `${SITE_URL}/category/${cat.id}`;
  const chooser = (cat.chooser ?? [])
    .map((c) => ({ ...c, tool: getTool(c.toolSlug) }))
    .filter((c) => c.tool && c.tool.status === "live");

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: `${cat.name} — ${SITE_NAME}`,
      description: cat.blurb,
      inLanguage: "en",
      dateModified: LAST_REVIEWED,
      isPartOf: { "@id": WEBSITE_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: cat.name,
      numberOfItems: live.length,
      itemListElement: live.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.name,
        url: `${SITE_URL}/tools/${t.slug}`,
      })),
    },
    ...(cat.faqs && cat.faqs.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: cat.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }]
      : []),
  ];

  return (
    <div
      className="container tool-page"
      style={{ ["--cat" as string]: `var(--cat-${cat.id})` }}
    >
      <JsonLd data={jsonLd} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span>{cat.name}</span>
      </nav>

      <div className="cat-head" style={{ marginTop: 6 }}>
        <span className="cat-emoji" aria-hidden="true"><CategoryIcon id={cat.id} size={19} /></span>
        <div>
          <span className="eyebrow">{live.length} free {cat.name.toLowerCase()}</span>
          <h1 style={{ margin: "8px 0 0" }}>{cat.name}</h1>
        </div>
      </div>
      <p className="lede" style={{ marginTop: 16 }}>{cat.blurb}</p>
      <p className="updated">Last updated: {formatUpdated(LAST_REVIEWED)}</p>

      <div className="grid">
        {tools.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>

      {chooser.length > 0 && (
        <section className="content-block">
          <h2>Which {cat.name.toLowerCase().replace(/ tools?$/, "")} tool should I use?</h2>
          <ul className="chooser">
            {chooser.map((c) => (
              <li key={c.toolSlug}>
                <strong>{c.need}</strong> →{" "}
                <Link href={`/tools/${c.tool!.slug}`}>{c.tool!.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="content-block">
        <h2>About these {cat.name.toLowerCase()}</h2>
        <p className="section-blurb">
          {cat.intro ?? (
            <>
              Every tool here runs entirely in your browser — your files and text
              never leave your device, there&apos;s no sign-up, and there are no usage
              limits.
            </>
          )}{" "}
          Pick a tool above to get started, or browse the{" "}
          <Link href="/tools" style={{ color: "var(--accent)" }}>full A–Z index</Link>.
        </p>
      </section>

      {cat.faqs && cat.faqs.length > 0 && (
        <section className="content-block">
          <h2>Frequently asked questions</h2>
          {cat.faqs.map((f, i) => (
            <details key={i} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </section>
      )}
    </div>
  );
}
