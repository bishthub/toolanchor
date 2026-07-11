import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { GLOSSARY } from "@/lib/glossary";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { alternatesFor } from "@/lib/hreflang";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Glossary — Plain-English tech definitions",
    description: `Clear, cited definitions of common tech terms — JWT, Base64, UUID, MIME type, HTTP status codes and more — each linked to the free ${SITE_NAME} tool that works with it.`,
    alternates: alternatesFor("/glossary", locale),
  };
}

export default function GlossaryIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${SITE_NAME} Glossary`,
    url: `${SITE_URL}/glossary`,
    hasDefinedTerm: GLOSSARY.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.short,
      url: `${SITE_URL}/glossary/${t.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Glossary</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Glossary</span>
        <h1>Tech terms, in plain English</h1>
        <p className="lede">
          Short, cited definitions of the terms behind our developer tools — what
          they mean, why they matter, and the free {SITE_NAME} tool that works with each.
        </p>
      </div>
      <div className="grid">
        {GLOSSARY.map((t) => (
          <Link key={t.slug} href={`/glossary/${t.slug}`} className="card">
            <span className="badge">Definition</span>
            <h3>{t.term}</h3>
            <p>{t.short}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
