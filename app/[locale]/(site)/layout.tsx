import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { localizeCategory } from "@/lib/i18n-content";
import { CATEGORIES, LIVE_TOOLS } from "@/lib/tools";
import { SITE_NAME, SITE_ALTERNATE_NAMES, SITE_URL, SITE_DESCRIPTION, WEBSITE_ID, ORG_REF, organizationNode } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import CommandPalette from "@/components/CommandPalette";
import FileDragGlow from "@/components/FileDragGlow";
import UniversalDrop from "@/components/UniversalDrop";
import PwaRegister from "@/components/PwaRegister";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";

// Site chrome (header, footer, command palette, analytics, entity JSON-LD)
// for every regular page. The /embed/<slug> widget routes live outside this
// group and render bare — see ../embed/[slug]/page.tsx.

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tf = await getTranslations("footer");

  // Site-wide structured data: enables the sitelinks search box + entity graph.
  // The WebSite and Organization share stable @ids so every page's page-level
  // schema can reference the same entity (publisher/isPartOf) instead of
  // re-declaring it — a cleaner entity graph for search + AI answer engines.
  const siteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAMES,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: ORG_REF,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tools?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    organizationNode(true),
  ];

  return (
    <>
      <JsonLd data={siteJsonLd} />
      <Analytics />
      <a href="#main" className="skip-link">Skip to content</a>

      <SiteHeader />
      <CommandPalette />
      <FileDragGlow />
      <UniversalDrop />

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo" aria-label={`${SITE_NAME} home`}>
                <span className="logo-mark" aria-hidden="true">◆</span>
                {SITE_NAME.slice(0, 4)}<span className="logo-accent">{SITE_NAME.slice(4)}</span>
              </Link>
              <p>{tf("tagline", { count: LIVE_TOOLS.length })}</p>
            </div>

            <div className="footer-col">
              <h4>{tf("browse")}</h4>
              <Link href="/tools">{tf("allToolsAZ")}</Link>
              <Link href="/ask">{tf("askTask")}</Link>
              <Link href="/workflows">{tf("workflows")}</Link>
              <Link href="/guides">{tf("guides")}</Link>
              <Link href="/glossary">{tf("glossary")}</Link>
              <Link href="/alternatives">{tf("alternatives")}</Link>
              <Link href="/compare">Comparisons</Link>
              <Link href="/widgets">Widgets</Link>
            </div>

            <div className="footer-col">
              <h4>{tf("categories")}</h4>
              {CATEGORIES.map((c) => (
                <Link key={c.id} href={`/category/${c.id}`}>{localizeCategory(c, locale).name}</Link>
              ))}
            </div>

            <div className="footer-col">
              <h4>{tf("company")}</h4>
              <Link href="/about">{tf("about")}</Link>
              <Link href="/contact">{tf("contact")}</Link>
              <Link href="/privacy">{tf("privacy")}</Link>
              <Link href="/terms">{tf("terms")}</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="pill">
              <span className="dot" /> {tf("inBrowser")}
            </span>
            <PwaRegister />
            <span>{tf("freeForever", { site: SITE_NAME })}</span>
          </div>

          <div className="footer-mega" aria-hidden="true">{SITE_NAME}</div>
        </div>
      </footer>
    </>
  );
}
