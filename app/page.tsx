import Link from "next/link";
import ToolAssistant from "@/components/ToolAssistant";
import ToolCard from "@/components/ToolCard";
import CategoryIcon from "@/components/CategoryIcon";
import YourTools from "@/components/YourTools";
import { HeroPaletteButton } from "@/components/CommandPalette";
import {
  CATEGORIES, LIVE_TOOLS, TRENDING_TOOLS, POPULAR_TOOLS,
  sampleTools, liveCountByCategory,
} from "@/lib/tools";

// The rotating verb in the hero — one phrase per category colour.
const ROTATOR_WORDS = [
  { text: "Compress PDFs.", cat: "pdf" },
  { text: "Resize images.", cat: "image" },
  { text: "Trim videos.", cat: "media" },
  { text: "Format JSON.", cat: "developer" },
  { text: "Crunch numbers.", cat: "calculator" },
];

export default function HomePage() {
  // Marquee inventory — a taste of the workshop, always linkable.
  const seen = new Set<string>();
  const ticker = [...POPULAR_TOOLS, ...TRENDING_TOOLS, ...LIVE_TOOLS]
    .filter((t) => !seen.has(t.slug) && (seen.add(t.slug), true))
    .slice(0, 16);

  return (
    <>
      <div className="container">
        <section className="hero">
          <span className="eyebrow reveal">Free · Private · In-browser</span>
          <h1 className="reveal">
            <span className="rotator" aria-hidden="true">
              <span className="rotator-track">
                {[...ROTATOR_WORDS, ROTATOR_WORDS[0]].map((w, i) => (
                  <span key={i} style={{ ["--rw" as string]: `var(--cat-${w.cat})` }}>
                    {w.text}
                  </span>
                ))}
              </span>
            </span>
            <span className="sr-only">Compress PDFs, resize images, trim videos, format JSON —</span>
            Right in your <em>browser.</em>
          </h1>
          <p className="sub reveal">
            {LIVE_TOOLS.length} fast, free, privacy-first tools for PDFs, images,
            video, text, code and everyday math. Your files never leave your
            device — and you can prove it: open your browser&apos;s Network tab
            and watch nothing upload.
          </p>

          <div className="hero-search reveal">
            <HeroPaletteButton hint={`Search ${LIVE_TOOLS.length} tools — merge PDF, resize image, word count…`} />
            <p className="hero-drop-hint">…or drop a file anywhere and we&apos;ll show what you can do with it.</p>
          </div>

          <div className="cat-chips reveal">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="cat-chip"
                style={{ ["--cat" as string]: `var(--cat-${c.id})` }}
              >
                <CategoryIcon id={c.id} size={15} /> {c.name}
                <span className="n">{liveCountByCategory(c.id)}</span>
              </Link>
            ))}
          </div>

          <div className="trust reveal">
            <span><span className="dot" /> <b>{LIVE_TOOLS.length}</b>&nbsp;live tools</span>
            <span><b>0</b>&nbsp;uploads</span>
            <span><b>100%</b>&nbsp;free</span>
            <span><b>No</b>&nbsp;sign-up</span>
          </div>
        </section>
      </div>

      {/* Workshop inventory ticker — full-bleed, pauses on hover */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((half) => (
            <div className="marquee-half" key={half}>
              {ticker.map((t) => (
                <Link
                  key={`${half}-${t.slug}`}
                  href={`/tools/${t.slug}`}
                  tabIndex={-1}
                  style={{ ["--cat" as string]: `var(--cat-${t.category})` }}
                >
                  {t.name}
                  <span className="star" aria-hidden="true"> &nbsp;✦</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <YourTools />

        {TRENDING_TOOLS.length > 0 && (
          <section>
            <div className="section-head">
              <h2>New &amp; <em>trending</em></h2>
              <span className="count">just added</span>
            </div>
            <div className="grid">
              {TRENDING_TOOLS.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        )}

        {POPULAR_TOOLS.length > 0 && (
          <section>
            <div className="section-head">
              <h2>Popular tools</h2>
              <Link href="/tools" className="more">View all {LIVE_TOOLS.length} →</Link>
            </div>
            <div className="grid">
              {POPULAR_TOOLS.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        )}

        {/* Describe-it assistant — for people who don't know the tool's name */}
        <section className="assistant-section">
          <div className="section-head">
            <h2>Don&apos;t know the tool&apos;s name? <em>Just describe it.</em></h2>
          </div>
          <p className="section-blurb">
            Type what you&apos;re trying to do — or drop a file — and we&apos;ll open the
            right tool instantly.
          </p>
          <ToolAssistant />
        </section>

        {/* Compact category overview — a few samples each, links to full pages. */}
        <section>
          <div className="section-head">
            <h2>Browse by <em>category</em></h2>
          </div>
          {CATEGORIES.map((cat) => {
            const samples = sampleTools(cat.id, 4);
            const total = liveCountByCategory(cat.id);
            if (!samples.length) return null;
            return (
              <div key={cat.id} style={{ ["--cat" as string]: `var(--cat-${cat.id})`, marginBottom: 34 }}>
                <div className="cat-head">
                  <span className="cat-emoji" aria-hidden="true"><CategoryIcon id={cat.id} size={19} /></span>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", margin: 0 }}>{cat.name}</h3>
                    <p className="section-blurb">{cat.blurb}</p>
                  </div>
                  <Link href={`/category/${cat.id}`} className="more" style={{ marginLeft: "auto", alignSelf: "center" }}>
                    All {total} →
                  </Link>
                </div>
                <div className="grid">
                  {samples.map((t) => (
                    <ToolCard key={t.slug} tool={t} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Final CTA to the full A-Z directory */}
        <section style={{ textAlign: "center", padding: "26px 0 20px" }}>
          <Link href="/tools" className="btn" style={{ display: "inline-flex" }}>
            Browse all {LIVE_TOOLS.length} tools A–Z →
          </Link>
        </section>
      </div>
    </>
  );
}
