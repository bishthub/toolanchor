"use client";

// Wraps ToolRunner on tool/preset pages so a file handed off from another
// tool ("Continue with →") is auto-loaded, with a small provenance note.

import { useRef, useState } from "react";
import ToolRunner from "@/components/tools/registry";
import WorkflowBar from "@/components/WorkflowBar";
import { takeHandoff, type Handoff } from "@/lib/handoff";
import { getTool } from "@/lib/tools";
import { trackEvent } from "@/lib/track";

export default function ToolPageRunner({
  slug,
  preset,
}: {
  slug: string;
  preset?: Record<string, string>;
}) {
  const [handoff] = useState<Handoff | null>(() => takeHandoff());
  // "tool_used" = first real interaction with the tool this page view —
  // separates people who actually use it from those who land and bounce.
  const used = useRef(false);
  const markUsed = () => {
    if (used.current) return;
    used.current = true;
    trackEvent("tool_used", { tool: slug });
  };
  const files = handoff?.files ?? [];
  const first = files[0];
  const fromName =
    handoff && handoff.from !== "drop" ? getTool(handoff.from)?.name ?? handoff.from : null;

  return (
    <>
      <WorkflowBar slug={slug} />
      {first && (
        <p className="chain-note">
          Loaded <strong>{first.name}</strong>
          {files.length > 1 && ` and ${files.length - 1} more`}
          {fromName ? ` from ${fromName}` : ""} — keep going below.
        </p>
      )}
      <div
        style={{ display: "contents" }}
        onPointerDownCapture={markUsed}
        onKeyDownCapture={markUsed}
        onDropCapture={markUsed}
      >
        <ToolRunner
          slug={slug}
          initialFiles={files.length ? files : undefined}
          preset={preset}
        />
      </div>
    </>
  );
}
