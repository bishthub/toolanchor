import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${SITE_NAME}'s free online tools.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container tool-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Terms</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Legal</span>
        <h1>Terms of Service</h1>
        <p className="lede">Last updated: July 2026. By using {SITE_NAME}, you agree to these terms.</p>
      </div>

      <section className="content-block">
        <h2>Use of the tools</h2>
        <p className="section-blurb">
          {SITE_NAME} provides free online utilities for personal and commercial use.
          You are responsible for the content you process and for ensuring you have
          the rights to it. Do not use the tools for anything unlawful or to infringe
          others&apos; rights.
        </p>
      </section>

      <section className="content-block">
        <h2>No warranty</h2>
        <p className="section-blurb">
          The tools are provided “as is”, without warranties of any kind. While we aim
          for accuracy, results (including file conversions, calculations and the AI
          detectors) may contain errors. The AI content and image detectors are
          indicative heuristics, not proof — do not rely on them as the sole basis for
          any decision, academic or otherwise. Always verify important results
          independently.
        </p>
      </section>

      <section className="content-block">
        <h2>Limitation of liability</h2>
        <p className="section-blurb">
          To the fullest extent permitted by law, {SITE_NAME} is not liable for any
          loss or damage arising from your use of the tools, including data loss.
          Keep backups of important files.
        </p>
      </section>

      <section className="content-block">
        <h2>Fair use of AI features</h2>
        <p className="section-blurb">
          The optional AI analysis features are rate-limited to keep them free and
          available to everyone. Automated or abusive use may be blocked.
        </p>
      </section>

      <section className="content-block">
        <h2>Changes &amp; contact</h2>
        <p className="section-blurb">
          We may update these terms; continued use means you accept the changes.
          Questions? Email <a href={`mailto:${SITE_EMAIL}`} style={{ color: "var(--accent)" }}>{SITE_EMAIL}</a>.
        </p>
      </section>
    </div>
  );
}
