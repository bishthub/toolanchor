import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { WORKFLOWS } from "@/lib/workflows";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Workflows — guided multi-step tasks",
  description: `Guided, multi-step workflows that chain ${SITE_NAME}'s tools together — like turning photos into a compressed PDF — carrying your file from step to step, all in your browser.`,
  alternates: { canonical: "/workflows" },
};

export default function WorkflowsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} workflows`,
    numberOfItems: WORKFLOWS.length,
    itemListElement: WORKFLOWS.map((w, i) => ({
      "@type": "ListItem", position: i + 1, name: w.name, url: `${SITE_URL}/workflows/${w.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Workflows</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Workflows</span>
        <h1>Guided workflows</h1>
        <p className="lede">
          Some jobs take more than one tool. A workflow chains them together and carries your
          file from step to step — so you never re-upload and never have to hunt for the next
          tool. Everything runs in your browser.
        </p>
      </div>
      <div className="grid">
        {WORKFLOWS.map((w) => (
          <Link key={w.slug} href={`/workflows/${w.slug}`} className="card">
            <span className="badge">{w.steps.length} step{w.steps.length === 1 ? "" : "s"}</span>
            <h3>{w.name}</h3>
            <p>{w.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
