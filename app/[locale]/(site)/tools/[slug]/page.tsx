import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTool, LIVE_TOOLS, relatedTools, toolAnswer, toolUpdated } from "@/lib/tools";
import { getLocalizedTool, getLocalizedCategory, localizeTool } from "@/lib/i18n-content";
import { alternatesFor, localeUrl } from "@/lib/hreflang";
import { presetsForTool } from "@/lib/presets";
import { isEmbeddable } from "@/lib/embed";
import { SITE_NAME, SITE_URL, LAUNCH_DATE, ORG_REF, WEBSITE_ID, formatUpdated } from "@/lib/site";
import { getTranslations } from "next-intl/server";
import ToolPageRunner from "@/components/ToolPageRunner";
import LocalBadge from "@/components/LocalBadge";
import DoNext from "@/components/DoNext";
import ToolCard from "@/components/ToolCard";
import CategoryIcon from "@/components/CategoryIcon";
import ToolUsageTracker from "@/components/ToolUsageTracker";
import PinButton from "@/components/PinButton";
import JsonLd from "@/components/JsonLd";

// Pre-render a static page for every LIVE tool (great for SEO + speed).
export function generateStaticParams() {
  return LIVE_TOOLS.map((t) => ({ slug: t.slug }));
}

// SERP titles carry the modifiers people actually type ("merge pdf online free",
// "free word counter") — the bare tool name wastes the ~60-char budget. File
// tools lead with the no-upload privacy angle; the rest with "free online".
const FILE_CATEGORIES = new Set(["pdf", "image", "media"]);
const TITLE_TAIL: Record<string, { file: string; other: string }> = {
  en: { file: "Free Online, No Upload", other: "Free Online Tool" },
  es: { file: "Gratis y Sin Subir Archivos", other: "Herramienta Online Gratis" },
  pt: { file: "Grátis e Sem Upload", other: "Ferramenta Online Grátis" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getLocalizedTool(slug, locale);
  if (!tool) return {};
  const url = localeUrl(`/tools/${tool.slug}`, locale);
  const tail = TITLE_TAIL[locale] ?? TITLE_TAIL.en;
  return {
    title: `${tool.name} — ${FILE_CATEGORIES.has(tool.category) ? tail.file : tail.other}`,
    description: tool.description,
    keywords: tool.keywords,
    alternates: alternatesFor(`/tools/${tool.slug}`, locale),
    openGraph: {
      title: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const base = getTool(slug);
  if (!base || base.status !== "live") notFound();
  const tool = localizeTool(base, locale);

  const cat = getLocalizedCategory(tool.category, locale);
  const related = relatedTools(base).map((t) => localizeTool(t, locale));
  const presets = presetsForTool(tool.slug);
  const url = localeUrl(`/tools/${tool.slug}`, locale);
  const answer = toolAnswer(tool);
  const updated = toolUpdated(tool);
  const t = await getTranslations("toolPage");

  // ── Structured data for rich results + AI search ──────────────────────
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.description,
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires a modern web browser with JavaScript enabled.",
      softwareVersion: "1.0",
      inLanguage: "en",
      isAccessibleForFree: true,
      featureList: tool.keywords,
      datePublished: LAUNCH_DATE,
      dateModified: updated,
      publisher: ORG_REF,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${tool.name} — ${SITE_NAME}`,
      description: tool.description,
      inLanguage: "en",
      dateModified: updated,
      isPartOf: { "@id": WEBSITE_ID },
      // Voice-assistant hint: the extractable answer + heading.
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-box", ".tool-head h1"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat?.name ?? "Tools", item: `${SITE_URL}/category/${tool.category}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${tool.name}`,
      description: answer,
      totalTime: "PT1M",
      tool: [{ "@type": "HowToTool", name: `${SITE_NAME} ${tool.name}` }],
      step: tool.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: `Step ${i + 1}`,
        text: s,
        url: `${url}#step-${i + 1}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div
      className="container tool-page tool-focus"
      style={{ ["--cat" as string]: `var(--cat-${tool.category})` }}
    >
      <JsonLd data={jsonLd} />
      <ToolUsageTracker slug={tool.slug} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{t("home")}</Link>
        {cat && (
          <>
            <span className="sep">/</span>
            <Link href={`/category/${cat.id}`}>{cat.name}</Link>
          </>
        )}
        <span className="sep">/</span>
        <span>{tool.name}</span>
      </nav>

      <div className="tool-head">
        {cat && <span className="eyebrow">{cat.name}</span>}
        <h1>{tool.name}</h1>
        <p className="lede">{tool.intro}</p>
        <p className="updated">{t("lastUpdated", { date: formatUpdated(updated) })}</p>
      </div>

      {/* Quick answer — the most extractable passage for AI answer engines. */}
      <p className="answer-box">{answer}</p>

      <LocalBadge local={tool.local !== false} />

      {/* One-tap presets — deep links that open this tool pre-configured. */}
      {presets.length > 0 && (
        <div className="preset-chips" style={{ margin: "-12px 0 26px" }}>
          <span className="preset-chips-label">{t("popularPresets")}</span>
          {presets.map((p) => (
            <Link key={p.slug} href={`/tools/${p.tool}/${p.slug}`} className="preset-chip">
              {p.chip}
            </Link>
          ))}
        </div>
      )}

      <div className="tool-shell">
        <div className="tool-shell-bar">
          <span className="tool-shell-icon" aria-hidden="true">
            <CategoryIcon id={tool.category} size={16} />
          </span>
          <span className="label">{tool.name}</span>
          <PinButton slug={tool.slug} />
          <span className="privacy-chip">{tool.local !== false ? t("runsInBrowser") : t("localOptInAi")}</span>
        </div>
        <div className="tool-shell-body">
          <ToolPageRunner slug={tool.slug} />
        </div>
      </div>

      <DoNext slug={tool.slug} fallback={[...(tool.related ?? []), ...related.map((rt) => rt.slug)]} />

      {/* Widget promo — turns every visitor who likes a tool into a potential embed (backlink). */}
      <aside className="widget-promo">
        <div>
          <strong>
            {isEmbeddable(tool.slug)
              ? `Want this ${tool.category === "calculator" ? "calculator" : "tool"} on your website?`
              : "Want a free widget for your website?"}
          </strong>
          <p>
            Free embeddable widget — matches your site&apos;s theme and colors, auto-resizes,
            and collects zero data from your visitors. One paste to install.
          </p>
        </div>
        <Link
          href={isEmbeddable(tool.slug) ? `/widgets?tool=${tool.slug}` : "/widgets"}
          className="btn secondary"
          style={{ whiteSpace: "nowrap" }}
        >
          Get the widget →
        </Link>
      </aside>

      {/* How to use — body content for SEO */}
      <section className="content-block">
        <h2>{t("howToUse", { name: tool.name })}</h2>
        <ol className="steps">
          {tool.steps.map((s, i) => (
            <li key={i} id={`step-${i + 1}`}>{s}</li>
          ))}
        </ol>
      </section>

      {/* FAQ — matches the FAQPage JSON-LD above */}
      <section className="content-block">
        <h2>{t("faq")}</h2>
        {tool.faqs.map((f, i) => (
          <details key={i} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      {/* Related tools — internal linking */}
      {related.length > 0 && (
        <section className="content-block">
          <h2>{t("related", { category: cat?.name.toLowerCase() ?? "" })}</h2>
          <div className="grid">
            {related.map((rt) => (
              <ToolCard key={rt.slug} tool={rt} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
