"use client";

// Wraps ToolRunner on tool/preset pages so a file handed off from another
// tool ("Continue with →") is auto-loaded, with a small provenance note.

import { useState } from "react";
import ToolRunner from "@/components/tools/registry";
import { takeHandoff, type Handoff } from "@/lib/handoff";
import { getTool } from "@/lib/tools";

export default function ToolPageRunner({
  slug,
  preset,
}: {
  slug: string;
  preset?: Record<string, string>;
}) {
  const [handoff] = useState<Handoff | null>(() => takeHandoff());
  const files = handoff?.files ?? [];
  const first = files[0];
  const fromName =
    handoff && handoff.from !== "drop" ? getTool(handoff.from)?.name ?? handoff.from : null;

  return (
    <>
      {first && (
        <p className="chain-note">
          Loaded <strong>{first.name}</strong>
          {files.length > 1 && ` and ${files.length - 1} more`}
          {fromName ? ` from ${fromName}` : ""} — keep going below.
        </p>
      )}
      <ToolRunner
        slug={slug}
        initialFiles={files.length ? files : undefined}
        preset={preset}
      />
    </>
  );
}
