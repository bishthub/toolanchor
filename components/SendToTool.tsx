"use client";

// ─────────────────────────────────────────────────────────────────────────
// "Continue with →" — chains a tool's output straight into another tool.
// Renders a row of target-tool chips; clicking one stores the output file
// in the handoff slot and navigates to the target, which auto-loads it.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTool, type Tool } from "@/lib/tools";
import { FILE_AUTOLOAD } from "@/lib/intent";
import { setHandoff } from "@/lib/handoff";
import CategoryIcon from "@/components/CategoryIcon";

const TARGETS: Record<"image" | "pdf", string[]> = {
  image: [
    "compress-image",
    "resize-image",
    "background-remover",
    "image-metadata-remover",
    "image-to-text",
  ],
  pdf: [
    "compress-pdf",
    "merge-pdf",
    "split-pdf",
    "rotate-pdf",
    "pdf-to-text",
    "pdf-to-images",
  ],
};

export default function SendToTool({
  kind,
  exclude,
  getFile,
}: {
  kind: "image" | "pdf";
  /** Current tool's slug — filtered out of the target list. */
  exclude: string;
  /** Produces the output file when a target is clicked. */
  getFile: () => Promise<File | null> | File | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const targets = TARGETS[kind]
    .filter((s) => s !== exclude && FILE_AUTOLOAD.has(s))
    .map((s) => getTool(s))
    .filter((t): t is Tool => !!t && t.status === "live");

  if (targets.length === 0) return null;

  async function send(slug: string) {
    if (busy) return;
    setBusy(true);
    try {
      const file = await getFile();
      if (!file) return;
      setHandoff(file, exclude);
      router.push(`/tools/${slug}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chain" aria-label="Continue with another tool">
      <span className="chain-label">Continue with</span>
      {targets.map((t) => (
        <button
          key={t.slug}
          type="button"
          className="chain-btn"
          disabled={busy}
          style={{ ["--cat" as string]: `var(--cat-${t.category})` }}
          onClick={() => send(t.slug)}
        >
          <CategoryIcon id={t.category} size={13} />
          {t.name}
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}
