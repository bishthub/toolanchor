import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_URL, SITE_EMAIL, organizationNode } from "@/lib/site";
import { LIVE_TOOLS, CATEGORIES } from "@/lib/tools";
import { alternatesFor } from "@/lib/hreflang";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "About",
    description: `What ${SITE_NAME} is, who it's for, and why every tool runs privately in your browser.`,
    alternates: alternatesFor("/about", locale),
  };
}

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
          {SITE_NAME} (also written “Tool Anchor”) is a free collection of {LIVE_TOOLS.length}+
          everyday online tools that run entirely in your browser — no uploads, no
          sign-up, no limits.
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
        <h2>How local processing works</h2>
        <p className="section-blurb">
          When you open a tool and choose a file, the work happens right there in the
          page — using the browser&apos;s Canvas API, WebAssembly (for things like PDF
          rendering and video), and the Web Crypto API. Your file is read into memory on
          your device, processed, and handed back as a download. It is never sent to a
          server. You can verify this yourself: open your browser&apos;s developer tools,
          switch to the <strong>Network</strong> tab, and run any tool — you won&apos;t see
          your file uploaded. Some tools fetch a processing engine (for example the video
          engine or the background-removal model) once from a CDN; that&apos;s program code,
          not your data. The one deliberate exception is the AI Content Detector&apos;s
          opt-in deep analysis, which is clearly labelled — see our{" "}
          <Link href="/privacy" style={{ color: "var(--accent)" }}>privacy page</Link>.
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
