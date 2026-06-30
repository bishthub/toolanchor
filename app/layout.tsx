import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { CATEGORIES, LIVE_TOOLS } from "@/lib/tools";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

// Self-hosted via next/font → no layout shift, no external request (great CWV/SEO).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Hanken_Grotesk({
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
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
  ],
};

// Set theme before paint to avoid a flash of the wrong palette.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Site-wide structured data: enables the sitelinks search box + entity graph.
  const siteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tools?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      slogan: "Free, fast, privacy-first online tools.",
    },
  ];

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <JsonLd data={siteJsonLd} />
        <a href="#main" className="skip-link">Skip to content</a>

        <SiteHeader />

        <main id="main">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <Link href="/" className="logo" aria-label="ToolHub home">
                  <span className="logo-mark" aria-hidden="true">◆</span>
                  Tool<span className="logo-accent">Hub</span>
                </Link>
                <p>
                  Free online tools that run entirely in your browser. No uploads,
                  no sign-up, no limits — {LIVE_TOOLS.length} tools and counting.
                </p>
              </div>

              <div className="footer-col">
                <h4>Browse</h4>
                <Link href="/tools">All tools (A–Z)</Link>
                {CATEGORIES.slice(0, 2).map((c) => (
                  <Link key={c.id} href={`/category/${c.id}`}>{c.name}</Link>
                ))}
              </div>

              <div className="footer-col">
                <h4>Categories</h4>
                {CATEGORIES.slice(2).map((c) => (
                  <Link key={c.id} href={`/category/${c.id}`}>{c.name}</Link>
                ))}
              </div>

              <div className="footer-col">
                <h4>Popular</h4>
                {LIVE_TOOLS.slice(0, 5).map((t) => (
                  <Link key={t.slug} href={`/tools/${t.slug}`}>{t.name}</Link>
                ))}
              </div>
            </div>

            <div className="footer-bottom">
              <span className="pill">
                <span className="dot" /> 100% in-browser · nothing is uploaded
              </span>
              <span>© {SITE_NAME}. Free forever.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
