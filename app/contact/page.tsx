import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, SITE_EMAIL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME} — tool requests, bug reports, feedback and partnership enquiries.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: `${SITE_URL}/contact`,
  };

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Contact</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Contact</span>
        <h1>Get in touch</h1>
        <p className="lede">
          Tool requests, bug reports, feedback or partnerships — we read everything.
        </p>
      </div>

      <section className="content-block">
        <div className="tool-shell">
          <div className="tool-shell-body">
            <p style={{ marginTop: 0 }}>Email us directly:</p>
            <a href={`mailto:${SITE_EMAIL}`} className="btn" style={{ display: "inline-flex" }}>
              ✉ {SITE_EMAIL}
            </a>
            <p className="section-blurb" style={{ marginTop: 18 }}>
              When reporting a bug, it helps to include the tool name, your browser,
              and what you expected vs. what happened. For a new tool request, tell us
              the task you&apos;re trying to do.
            </p>
          </div>
        </div>
      </section>

      <section className="content-block">
        <h2>Frequently asked</h2>
        <details className="faq"><summary>Are the tools really free?</summary><p>Yes — every tool is free with no account required, and there are no usage limits on the in-browser tools.</p></details>
        <details className="faq"><summary>Do you store my files?</summary><p>No. Almost every tool runs entirely in your browser, so files are never uploaded. See our <Link href="/privacy" style={{ color: "var(--accent)" }}>privacy policy</Link>.</p></details>
        <details className="faq"><summary>Can you build a tool I need?</summary><p>Quite possibly — send the request and the task you&apos;re trying to accomplish, and we&apos;ll consider it.</p></details>
      </section>
    </div>
  );
}
