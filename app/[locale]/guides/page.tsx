import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { GUIDES } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Guides — How-to tutorials",
  description: `Free step-by-step guides for everyday tasks — compress a PDF, remove an image background, extract text from an image and more, using ${SITE_NAME}'s in-browser tools.`,
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} guides`,
    numberOfItems: GUIDES.length,
    itemListElement: GUIDES.map((g, i) => ({
      "@type": "ListItem", position: i + 1, name: g.title, url: `${SITE_URL}/guides/${g.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Guides</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Guides</span>
        <h1>How-to guides</h1>
        <p className="lede">Short, practical walkthroughs for common tasks — each one shows you the fastest free way, using tools that run in your browser.</p>
      </div>
      <div className="grid">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card">
            <span className="badge">Guide</span>
            <h3>{g.title}</h3>
            <p>{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
