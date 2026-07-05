import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ALTERNATIVES } from "@/lib/alternatives";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Free Alternatives to Popular Tools",
  description: `Free, private alternatives to iLovePDF, Smallpdf, remove.bg, TinyPNG, GPTZero and more — all running in your browser on ${SITE_NAME}.`,
  alternates: { canonical: "/alternatives" },
};

export default function AlternativesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Free alternatives on ${SITE_NAME}`,
    numberOfItems: ALTERNATIVES.length,
    itemListElement: ALTERNATIVES.map((a, i) => ({
      "@type": "ListItem", position: i + 1, name: a.title, url: `${SITE_URL}/alternatives/${a.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Alternatives</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Alternatives</span>
        <h1>Free alternatives to popular tools</h1>
        <p className="lede">Prefer tools that are free, need no sign-up, and keep your files on your device? Here&apos;s how {SITE_NAME} compares to well-known apps.</p>
      </div>
      <div className="grid">
        {ALTERNATIVES.map((a) => (
          <Link key={a.slug} href={`/alternatives/${a.slug}`} className="card">
            <span className="badge">vs {a.competitor}</span>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
