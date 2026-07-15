import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { embeddableTools } from "@/lib/embed";
import { SITE_NAME, SITE_URL, ORG_REF } from "@/lib/site";
import { alternatesFor } from "@/lib/hreflang";
import JsonLd from "@/components/JsonLd";
import WidgetBuilder from "@/components/WidgetBuilder";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Free Website Widgets — Privacy-First Calculators & Tools to Embed",
    description:
      "Embed free calculator and tool widgets on your website in one paste — BMI, loan, percentage, word counter, QR generator and 40+ more. No tracking, no cookies, no data collection. Customizable theme and colors.",
    alternates: alternatesFor("/widgets", locale),
  };
}

export default function WidgetsPage() {
  const tools = embeddableTools();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${SITE_NAME} Widgets`,
      url: `${SITE_URL}/widgets`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      description:
        "Free, privacy-first embeddable widgets: calculators, generators and text tools that run entirely in the visitor's browser.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: ORG_REF,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Embeddable widgets on ${SITE_NAME}`,
      numberOfItems: tools.length,
      itemListElement: tools.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.name,
        url: `${SITE_URL}/tools/${t.slug}`,
      })),
    },
  ];

  return (
    <div className="container tool-page">
      <JsonLd data={jsonLd} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="sep">/</span><span>Widgets</span>
      </nav>

      <div className="tool-head">
        <span className="eyebrow">Widgets</span>
        <h1>Free privacy-first widgets for your website</h1>
        <p className="lede">
          Embed any of {tools.length} calculators, generators and text tools on your site with one paste.
          Every widget runs entirely in your visitor&apos;s browser — no tracking, no cookies, no data
          collection, no sign-up. Pick a widget, match it to your design, copy the code.
        </p>
      </div>

      <WidgetBuilder tools={tools} />

      <section className="content-block" style={{ marginTop: 40 }}>
        <h2>Why embed {SITE_NAME} widgets?</h2>
        <ul>
          <li><strong>Actually private.</strong> The widget is a small iframe that computes everything on your visitor&apos;s device. No analytics scripts, no cookies, no data sent to us or anyone — safe to use under GDPR without a consent banner.</li>
          <li><strong>One paste, zero maintenance.</strong> Two lines of HTML. The widget auto-resizes to its content, follows your visitor&apos;s light/dark preference (or the theme you pick), and stays up to date automatically.</li>
          <li><strong>Matches your site.</strong> Set the theme, accent color, corner radius and width — or leave it on auto.</li>
          <li><strong>Fast.</strong> Widgets are statically served, lazy-loaded and add no JavaScript to your page beyond one tiny loader (or none, with the plain-iframe option).</li>
          <li><strong>Free.</strong> The only requirement is the small &quot;Powered by {SITE_NAME}&quot; attribution link that comes with each widget.</li>
        </ul>
      </section>

      <section className="content-block">
        <h2>How to add a widget to your site</h2>
        <ol className="steps">
          <li>Pick a widget above and customize the theme, accent color and size.</li>
          <li>Copy the embed code — the script version auto-resizes; the plain iframe works anywhere HTML is allowed.</li>
          <li>Paste it into your page, post or template where the widget should appear. WordPress (Custom HTML block), Webflow (Embed element), Notion sites, Ghost, Squarespace and plain HTML all work.</li>
        </ol>
      </section>

      <section className="content-block">
        <h2>FAQ</h2>
        <details className="faq">
          <summary>Do the widgets collect any data from my visitors?</summary>
          <p>No. The widget iframe contains no analytics, no cookies and no third-party requests. Calculations run in the visitor&apos;s browser and results never leave their device — which is why these widgets don&apos;t require a GDPR consent banner.</p>
        </details>
        <details className="faq">
          <summary>Will it slow my site down?</summary>
          <p>No — the iframe is lazy-loaded (it only loads when scrolled near) and served from a global CDN. The loader script is under 2&nbsp;KB.</p>
        </details>
        <details className="faq">
          <summary>Can I use widgets on WordPress, Webflow or Notion?</summary>
          <p>Yes. Use a Custom HTML block (WordPress), an Embed element (Webflow, Framer, Squarespace) or paste the iframe code (Notion-based site builders that allow embeds). If your platform strips scripts, use the plain-iframe code.</p>
        </details>
        <details className="faq">
          <summary>Can I remove the attribution link?</summary>
          <p>The &quot;Powered by {SITE_NAME}&quot; link is what keeps the widgets free — it must stay visible. It&apos;s deliberately small and unobtrusive.</p>
        </details>
        <details className="faq">
          <summary>A widget I want isn&apos;t in the list — can you add it?</summary>
          <p><Link href="/contact">Tell us which one</Link>. Most self-contained tools can be made embeddable quickly.</p>
        </details>
      </section>
    </div>
  );
}
