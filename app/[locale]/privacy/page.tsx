import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles your data — the short version: your files and text are processed in your browser and are never uploaded.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="container tool-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Privacy</span>
      </nav>
      <div className="tool-head">
        <span className="eyebrow">Privacy</span>
        <h1>Privacy Policy</h1>
        <p className="lede">Last updated: July 2026. The short version: {SITE_NAME} is built privacy-first — your files and text are processed locally in your browser and are not uploaded to our servers.</p>
      </div>

      <section className="content-block">
        <h2>Files and content you process</h2>
        <p className="section-blurb">
          The large majority of {SITE_NAME} tools (PDF, image, text, developer and
          calculator tools) run entirely in your browser using client-side
          JavaScript and WebAssembly. The files and text you work with <strong>never
          leave your device</strong> — they are not transmitted to us or to any third party.
        </p>
      </section>

      <section className="content-block">
        <h2>The one exception: opt-in “Deep AI analysis”</h2>
        <p className="section-blurb">
          The AI Content Detector offers an optional “Deep AI analysis” button. Only
          when you click it is the text you submitted sent to our server and on to
          AI providers (e.g. Google Gemini, Groq) to compute a more accurate score.
          The quick check remains 100% in your browser. We do not store the text; it
          is processed to return a score and then discarded. Rate limits are enforced
          per IP address to keep the free tier sustainable.
        </p>
      </section>

      <section className="content-block">
        <h2>Analytics</h2>
        <p className="section-blurb">
          If analytics are enabled, we use a privacy-friendly, cookieless analytics
          tool that records aggregate, anonymous usage (page views, referrers,
          country) with no personal data and no cross-site tracking. We use this only
          to understand which tools are useful.
        </p>
      </section>

      <section className="content-block">
        <h2>Cookies &amp; local storage</h2>
        <p className="section-blurb">
          We do not use tracking cookies. Some tools store data locally in your
          browser for your convenience (for example, the Online Notepad saves your
          note, and your light/dark theme preference is remembered). This data stays
          on your device and can be cleared at any time via your browser.
        </p>
      </section>

      <section className="content-block">
        <h2>Advertising</h2>
        <p className="section-blurb">
          If we display ads in the future, this policy will be updated to describe the
          ad provider and any choices available to you, and a cookie-consent notice
          will be shown where required.
        </p>
      </section>

      <section className="content-block">
        <h2>Your rights &amp; contact</h2>
        <p className="section-blurb">
          Because we don&apos;t collect personal data through the tools, there is
          generally nothing for us to access or delete. For any privacy question,
          contact us at <a href={`mailto:${SITE_EMAIL}`} style={{ color: "var(--accent)" }}>{SITE_EMAIL}</a> or via
          the <Link href="/contact" style={{ color: "var(--accent)" }}>contact page</Link>.
        </p>
      </section>
    </div>
  );
}
