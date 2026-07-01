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
  const fromName = handoff ? getTool(handoff.from)?.name ?? handoff.from : null;

  return (
    <>
      {handoff && (
        <p className="chain-note">
          Loaded <strong>{handoff.file.name}</strong> from {fromName} — keep going below.
        </p>
      )}
      <ToolRunner
        slug={slug}
        initialFiles={handoff ? [handoff.file] : undefined}
        preset={preset}
      />
    </>
  );
}
