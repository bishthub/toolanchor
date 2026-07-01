import Link from "next/link";
// Quick-search temporarily disabled — the Assistant below covers search.
// import ToolSearch from "@/components/ToolSearch";
import ToolAssistant from "@/components/ToolAssistant";
import ToolCard from "@/components/ToolCard";
import {
  CATEGORIES, LIVE_TOOLS, TRENDING_TOOLS, POPULAR_TOOLS,
  sampleTools, liveCountByCategory,
} from "@/lib/tools";

export default function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow reveal">Free · Private · In-browser</span>
        <h1 className="reveal">
          Every tool you need, <em>right in your browser.</em>
        </h1>
        <p className="sub reveal">
          Fast, free, privacy-first online tools for PDFs, images, text, code and
          everyday math. Most run entirely on your device — nothing is ever
          uploaded. Browse everything{" "}
          <Link href="/tools">A&nbsp;to&nbsp;Z</Link>.
        </p>
        <div className="hero-assistant reveal">
          <ToolAssistant />
        </div>
        <div className="trust reveal">
          <span><span className="dot" /> <b>{LIVE_TOOLS.length}</b>&nbsp;live tools</span>
          <span><b>0</b>&nbsp;uploads</span>
          <span><b>100%</b>&nbsp;free</span>
          <span><b>No</b>&nbsp;sign-up</span>
        </div>
      </section>

      {TRENDING_TOOLS.length > 0 && (
        <section>
          <div className="section-head">
            <h2>✨ New &amp; Trending</h2>
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

      {/* Compact category overview — a few samples each, links to full pages.
          Keeps the homepage short instead of dumping all 87 tools. */}
      <section>
        <div className="section-head">
          <h2>Browse by category</h2>
        </div>
        {CATEGORIES.map((cat) => {
          const samples = sampleTools(cat.id, 4);
          const total = liveCountByCategory(cat.id);
          if (!samples.length) return null;
          return (
            <div key={cat.id} style={{ ["--cat" as string]: `var(--cat-${cat.id})`, marginBottom: 30 }}>
              <div className="cat-head">
                <span className="cat-emoji" aria-hidden="true">{cat.emoji}</span>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{cat.name}</h3>
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
      <section style={{ textAlign: "center", padding: "10px 0 20px" }}>
        <Link href="/tools" className="btn" style={{ display: "inline-flex" }}>
          Browse all {LIVE_TOOLS.length} tools A–Z →
        </Link>
      </section>
    </div>
  );
}
