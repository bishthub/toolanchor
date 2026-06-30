import Link from "next/link";
// Quick-search temporarily disabled — the Assistant below covers search.
// import ToolSearch from "@/components/ToolSearch";
import ToolAssistant from "@/components/ToolAssistant";
import ToolCard from "@/components/ToolCard";
import { CATEGORIES, LIVE_TOOLS, TRENDING_TOOLS, toolsByCategory } from "@/lib/tools";

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
        {/* Quick-search temporarily disabled — the Assistant above handles search.
        <div className="hero-search reveal" style={{ marginTop: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "0 0 8px" }}>
            Or jump straight to a tool:
          </p>
          <ToolSearch />
        </div>
        */}
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
            <Link href="/tools" className="more">View all →</Link>
          </div>
          <div className="grid">
            {TRENDING_TOOLS.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}

      {LIVE_TOOLS.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Popular tools</h2>
            <span className="count">{LIVE_TOOLS.length} live</span>
            <Link href="/tools" className="more">View all →</Link>
          </div>
          <div className="grid">
            {LIVE_TOOLS.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((cat) => {
        const tools = toolsByCategory(cat.id);
        if (!tools.length) return null;
        return (
          <section key={cat.id} style={{ ["--cat" as string]: `var(--cat-${cat.id})` }}>
            <div className="cat-head">
              <span className="cat-emoji" aria-hidden="true">{cat.emoji}</span>
              <div>
                <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{cat.name}</h2>
                <p className="section-blurb">{cat.blurb}</p>
              </div>
              <Link
                href={`/category/${cat.id}`}
                className="more"
                style={{ marginLeft: "auto", alignSelf: "center" }}
              >
                View all →
              </Link>
            </div>
            <div className="grid">
              {tools.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
