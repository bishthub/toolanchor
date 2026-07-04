import type { Metadata } from "next";
import Link from "next/link";
import { Schibsted_Grotesk, Geist, JetBrains_Mono } from "next/font/google";
import { CATEGORIES, LIVE_TOOLS } from "@/lib/tools";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, WEBSITE_ID, ORG_REF, organizationNode } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import CommandPalette from "@/components/CommandPalette";
import FileDragGlow from "@/components/FileDragGlow";
import UniversalDrop from "@/components/UniversalDrop";
import PwaRegister from "@/components/PwaRegister";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import "./globals.css";

// Self-hosted via next/font → no layout shift, no external request (great CWV/SEO).
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free online tools, all in one place`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free online tools, A to Z`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free online tools, A to Z`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

// Set theme before paint to avoid a flash of the wrong palette.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Discoverability pointer to the llms.txt manifest for AI crawlers. */}
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
      </head>
      <body>
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
                <p>
                  Free online tools that run entirely in your browser. No uploads,
                  no sign-up, no limits — {LIVE_TOOLS.length} tools and counting.
                </p>
              </div>

              <div className="footer-col">
                <h4>Browse</h4>
                <Link href="/tools">All tools (A–Z)</Link>
                <Link href="/ask">Ask (describe a task)</Link>
                <Link href="/workflows">Workflows</Link>
                <Link href="/guides">Guides</Link>
                <Link href="/glossary">Glossary</Link>
                <Link href="/alternatives">Alternatives</Link>
              </div>

              <div className="footer-col">
                <h4>Categories</h4>
                {CATEGORIES.map((c) => (
                  <Link key={c.id} href={`/category/${c.id}`}>{c.name}</Link>
                ))}
              </div>

              <div className="footer-col">
                <h4>Company</h4>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="pill">
                <span className="dot" /> 100% in-browser · nothing is uploaded
              </span>
              <PwaRegister />
              <span>© {SITE_NAME}. Free forever.</span>
            </div>

            <div className="footer-mega" aria-hidden="true">{SITE_NAME}</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
