import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, SITE_EMAIL, organizationNode } from "@/lib/site";
import { LIVE_TOOLS, CATEGORIES } from "@/lib/tools";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE_NAME} is, who it's for, and why every tool runs privately in your browser.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: `${SITE_URL}/about`,
    mainEntity: organizationNode(),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>About</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">About</span>
        <h1>About {SITE_NAME}</h1>
        <p className="lede">
          {SITE_NAME} is a free collection of {LIVE_TOOLS.length}+ everyday online tools that run
          entirely in your browser — no uploads, no sign-up, no limits.
        </p>
      </div>

      <section className="content-block">
        <h2>Why we built it</h2>
        <p className="section-blurb">
          Most “free” online tools upload your files to a server, gate features behind
          sign-ups, or bury the tool under ads. We wanted the opposite: fast, focused
          utilities that do one job well and respect your privacy. Because our tools
          process everything locally with modern browser technology (Canvas,
          WebAssembly, the Web Crypto API), your files and text never leave your
          device — which is faster and fundamentally more private.
        </p>
      </section>

      <section className="content-block">
        <h2>What you&apos;ll find</h2>
        <p className="section-blurb">
          {CATEGORIES.map((c) => c.name).join(", ")} — {LIVE_TOOLS.length} tools in all, from
          merging PDFs and removing image backgrounds to counting words, generating QR
          codes and checking whether text or an image looks AI-generated. Not sure
          which tool you need? Just <Link href="/ask" style={{ color: "var(--accent)" }}>describe your task</Link> and
          we&apos;ll run the right one.
        </p>
      </section>

      <section className="content-block">
        <h2>Our principles</h2>
        <ul className="steps">
          <li><strong>Private by default</strong> — files are processed in your browser, not uploaded.</li>
          <li><strong>Free, with no sign-up</strong> — every tool, no account required.</li>
          <li><strong>Honest</strong> — where a tool is a heuristic (like the AI detectors), we say so.</li>
          <li><strong>Fast</strong> — lightweight, static pages that load instantly.</li>
        </ul>
      </section>

      <section className="content-block">
        <h2>Get in touch</h2>
        <p className="section-blurb">
          Have a tool request or feedback? We&apos;d love to hear it — email{" "}
          <a href={`mailto:${SITE_EMAIL}`} style={{ color: "var(--accent)" }}>{SITE_EMAIL}</a> or use
          the <Link href="/contact" style={{ color: "var(--accent)" }}>contact page</Link>.
        </p>
      </section>
    </div>
  );
}
