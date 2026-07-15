import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTool } from "@/lib/tools";
import { isEmbeddable, EMBEDDABLE_SLUGS } from "@/lib/embed";
import { SITE_URL } from "@/lib/site";
import EmbedShell from "@/components/EmbedShell";
import ToolRunner from "@/components/tools/registry";

// Chrome-less, framable widget pages (no header/footer — this route sits
// outside the (site) layout group). Not indexed: they'd be thin duplicates
// of the tool pages. Their job is to run inside iframes on other sites and
// carry an attribution link back to the canonical tool page.
// Netlify serves /embed/* with `Content-Security-Policy: frame-ancestors *`,
// which overrides the site-wide X-Frame-Options in modern browsers.

export function generateStaticParams() {
  return EMBEDDABLE_SLUGS.map((slug) => ({ slug }));
}

// Apply ?theme= and ?accent= before the widget below it paints, so the
// widget matches the host page without a flash.
const EMBED_THEME_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search);var t=p.get('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}var a=p.get('accent');if(a&&/^[0-9a-fA-F]{3,8}$/.test(a)){var s=document.documentElement.style;s.setProperty('--accent','#'+a);s.setProperty('--accent-strong','#'+a);s.setProperty('--accent-soft','color-mix(in srgb, #'+a+' 12%, transparent)');s.setProperty('--cat','#'+a);}}catch(e){}})();`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || !isEmbeddable(slug)) return {};
  return {
    title: `${tool.name} — ToolAnchor widget`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "live" || !isEmbeddable(slug)) notFound();

  const toolUrl = `${SITE_URL}/tools/${tool.slug}?utm_source=embed&utm_medium=widget`;

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      <script dangerouslySetInnerHTML={{ __html: EMBED_THEME_SCRIPT }} />
      <EmbedShell toolUrl={toolUrl} toolName={tool.name}>
        <ToolRunner slug={tool.slug} />
      </EmbedShell>
    </div>
  );
}
