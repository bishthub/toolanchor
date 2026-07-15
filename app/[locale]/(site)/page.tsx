import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ToolAssistant from "@/components/ToolAssistant";
import ToolCard from "@/components/ToolCard";
import CategoryIcon from "@/components/CategoryIcon";
import YourTools from "@/components/YourTools";
import { HeroPaletteButton } from "@/components/CommandPalette";
import {
  CATEGORIES, LIVE_TOOLS, TRENDING_TOOLS, POPULAR_TOOLS,
  sampleTools, liveCountByCategory,
} from "@/lib/tools";
import { localizeTool, localizeCategory } from "@/lib/i18n-content";
import { alternatesFor } from "@/lib/hreflang";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternatesFor("/", locale) };
}

// The rotating verb in the hero — one phrase per category colour.
const ROTATOR_WORDS: Record<string, { text: string; cat: string }[]> = {
  en: [
    { text: "Compress PDFs.", cat: "pdf" },
    { text: "Resize images.", cat: "image" },
    { text: "Trim videos.", cat: "media" },
    { text: "Format JSON.", cat: "developer" },
    { text: "Crunch numbers.", cat: "calculator" },
  ],
  es: [
    { text: "Comprime PDF.", cat: "pdf" },
    { text: "Redimensiona imágenes.", cat: "image" },
    { text: "Recorta vídeos.", cat: "media" },
    { text: "Formatea JSON.", cat: "developer" },
    { text: "Haz cálculos.", cat: "calculator" },
  ],
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const em = { em: (chunks: React.ReactNode) => <em>{chunks}</em> };
  const rotator = ROTATOR_WORDS[locale] ?? ROTATOR_WORDS.en;
  const liveCount = LIVE_TOOLS.length;

  // Marquee inventory — a taste of the workshop, always linkable.
  const seen = new Set<string>();
  const ticker = [...POPULAR_TOOLS, ...TRENDING_TOOLS, ...LIVE_TOOLS]
    .filter((tool) => !seen.has(tool.slug) && (seen.add(tool.slug), true))
    .slice(0, 16)
    .map((tool) => localizeTool(tool, locale));

  const trending = TRENDING_TOOLS.map((tool) => localizeTool(tool, locale));
  const popular = POPULAR_TOOLS.map((tool) => localizeTool(tool, locale));

  return (
    <>
      <div className="container">
        <section className="hero">
          <span className="eyebrow reveal">{t("eyebrow")}</span>
          <h1 className="reveal">
            <span className="rotator" aria-hidden="true">
              <span className="rotator-track">
                {[...rotator, rotator[0]].map((w, i) => (
                  <span key={i} style={{ ["--rw" as string]: `var(--cat-${w.cat})` }}>
                    {w.text}
                  </span>
                ))}
              </span>
            </span>
            <span className="sr-only">{t("srHeading")}</span>
            {t.rich("titleTail", em)}
          </h1>
          <p className="sub reveal">{t("sub", { count: liveCount })}</p>

          <div className="hero-search reveal">
            <HeroPaletteButton hint={t("searchHint", { count: liveCount })} />
            <p className="hero-drop-hint">{t("dropHint")}</p>
          </div>

          <div className="cat-chips reveal">
            {CATEGORIES.map((c) => {
              const lc = localizeCategory(c, locale);
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.id}`}
                  className="cat-chip"
                  style={{ ["--cat" as string]: `var(--cat-${c.id})` }}
                >
                  <CategoryIcon id={c.id} size={15} /> {lc.name}
                  <span className="n">{liveCountByCategory(c.id)}</span>
                </Link>
              );
            })}
          </div>

          <div className="trust reveal">
            <span><span className="dot" /> <b>{liveCount}</b>&nbsp;{t("trustLiveTools")}</span>
            <span><b>0</b>&nbsp;{t("trustUploads")}</span>
            <span><b>100%</b>&nbsp;{t("trustFree")}</span>
            <span><b>No</b>&nbsp;{t("trustSignup")}</span>
          </div>
        </section>
      </div>

      {/* Workshop inventory ticker — full-bleed, pauses on hover */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((half) => (
            <div className="marquee-half" key={half}>
              {ticker.map((tool) => (
                <Link
                  key={`${half}-${tool.slug}`}
                  href={`/tools/${tool.slug}`}
                  tabIndex={-1}
                  style={{ ["--cat" as string]: `var(--cat-${tool.category})` }}
                >
                  {tool.name}
                  <span className="star" aria-hidden="true"> &nbsp;✦</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <YourTools />

        {trending.length > 0 && (
          <section>
            <div className="section-head">
              <h2>{t.rich("trendingHead", em)}</h2>
              <span className="count">{t("trendingTag")}</span>
            </div>
            <div className="grid">
              {trending.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        )}

        {popular.length > 0 && (
          <section>
            <div className="section-head">
              <h2>{t("popularHead")}</h2>
              <Link href="/tools" className="more">{t("viewAll", { count: liveCount })}</Link>
            </div>
            <div className="grid">
              {popular.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        )}

        {/* Describe-it assistant — for people who don't know the tool's name */}
        <section className="assistant-section">
          <div className="section-head">
            <h2>{t.rich("assistantHead", em)}</h2>
          </div>
          <p className="section-blurb">{t("assistantBlurb")}</p>
          <ToolAssistant />
        </section>

        {/* Compact category overview — a few samples each, links to full pages. */}
        <section>
          <div className="section-head">
            <h2>{t.rich("browseHead", em)}</h2>
          </div>
          {CATEGORIES.map((cat) => {
            const lc = localizeCategory(cat, locale);
            const samples = sampleTools(cat.id, 4).map((tool) => localizeTool(tool, locale));
            const total = liveCountByCategory(cat.id);
            if (!samples.length) return null;
            return (
              <div key={cat.id} style={{ ["--cat" as string]: `var(--cat-${cat.id})`, marginBottom: 34 }}>
                <div className="cat-head">
                  <span className="cat-emoji" aria-hidden="true"><CategoryIcon id={cat.id} size={19} /></span>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", margin: 0 }}>{lc.name}</h3>
                    <p className="section-blurb">{lc.blurb}</p>
                  </div>
                  <Link href={`/category/${cat.id}`} className="more" style={{ marginLeft: "auto", alignSelf: "center" }}>
                    {t("allN", { count: total })}
                  </Link>
                </div>
                <div className="grid">
                  {samples.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Final CTA to the full A-Z directory */}
        <section style={{ textAlign: "center", padding: "26px 0 20px" }}>
          <Link href="/tools" className="btn" style={{ display: "inline-flex" }}>
            {t("browseAll", { count: liveCount })}
          </Link>
        </section>
      </div>
    </>
  );
}
