import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { COMPARISONS } from "@/lib/comparisons";
import { alternatesFor } from "@/lib/hreflang";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Compare Free Online Tools — ${SITE_NAME}`,
  description: "Side-by-side comparisons of file formats, PDF tools, image tools and more. See which tool or format wins for your use case.",
};

export default function CompareIndexPage() {
  return (
    <div className="container tool-page tool-focus">
      <div className="tool-head">
        <span className="eyebrow">Tool comparisons</span>
        <h1>Compare formats &amp; tools</h1>
        <p className="lede">
          Side-by-side comparisons to help you pick the right format or tool for your task.
        </p>
      </div>

      {COMPARISONS.length === 0 && (
        <p style={{ color: "var(--muted)", marginTop: 24 }}>No comparisons yet — coming soon.</p>
      )}

      <div className="grid" style={{ marginTop: 32 }}>
        {COMPARISONS.map((comp) => (
          <Link
            key={comp.slug}
            href={`/compare/${comp.slug}`}
            className="card"
          >
            <div className="card-top">
              <span className="card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </span>
            </div>
            <h3>{comp.name}</h3>
            <p>{comp.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
