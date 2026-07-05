"use client";

// "Do this next" strip. Leads with the user's own tool→tool history (from
// lib/usage), then fills from curated related/category tools. Purely local —
// no network, no analytics. Renders nothing until it has suggestions.

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getTopNext } from "@/lib/usage";
import { getTool, type Tool } from "@/lib/tools";
import CategoryIcon from "@/components/CategoryIcon";

export default function DoNext({ slug, fallback }: { slug: string; fallback: string[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const merged: string[] = [];
    for (const s of [...getTopNext(slug, 4), ...fallback]) {
      if (s !== slug && !merged.includes(s)) merged.push(s);
    }
    setSlugs(merged.slice(0, 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const tools = slugs
    .map((s) => getTool(s))
    .filter((t): t is Tool => !!t && t.status === "live");

  if (tools.length === 0) return null;

  return (
    <section className="content-block do-next">
      <h2>Do this next</h2>
      <div className="do-next-row">
        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="do-next-chip"
            style={{ ["--cat" as string]: `var(--cat-${t.category})` }}
          >
            <CategoryIcon id={t.category} size={14} />
            {t.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
