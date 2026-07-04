"use client";

// ─────────────────────────────────────────────────────────────────────────
// "Continue with →" — chains a tool's output straight into another tool.
// Renders a row of target-tool chips; clicking one stores the output file
// in the handoff slot and navigates to the target, which auto-loads it.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTool, type Tool } from "@/lib/tools";
import { FILE_AUTOLOAD } from "@/lib/intent";
import { setHandoff } from "@/lib/handoff";
import { getActiveWorkflow, setWorkflowStep, exitWorkflow, WORKFLOW_EVENT } from "@/lib/workflow";
import { getWorkflow } from "@/lib/workflows";
import CategoryIcon from "@/components/CategoryIcon";

const TARGETS: Record<"image" | "pdf" | "media", string[]> = {
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
    "delete-pdf-pages",
  ],
  media: [
    "compress-video",
    "trim-video",
    "mute-video",
    "video-to-gif",
    "mp4-to-mp3",
    "audio-converter",
    "trim-audio",
  ],
};

export default function SendToTool({
  kind,
  exclude,
  getFile,
}: {
  kind: "image" | "pdf" | "media";
  /** Current tool's slug — filtered out of the target list. */
  exclude: string;
  /** Produces the output file when a target is clicked. */
  getFile: () => Promise<File | null> | File | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Workflow awareness: if a workflow is active and this tool is its current
  // step, surface the next step as the primary action.
  const [active, setActive] = useState<ReturnType<typeof getActiveWorkflow>>(null);
  useEffect(() => {
    const read = () => setActive(getActiveWorkflow());
    read();
    window.addEventListener(WORKFLOW_EVENT, read);
    return () => window.removeEventListener(WORKFLOW_EVENT, read);
  }, []);

  const wf = active ? getWorkflow(active.slug) : null;
  const onThisStep = !!(wf && wf.steps[active!.step]?.tool === exclude);
  const nextStep = onThisStep ? wf!.steps[active!.step + 1] : undefined;
  const isLastStep = onThisStep && !nextStep;
  const nextTool = nextStep ? getTool(nextStep.tool) : undefined;

  const targets = TARGETS[kind]
    .filter((s) => s !== exclude && FILE_AUTOLOAD.has(s))
    .map((s) => getTool(s))
    .filter((t): t is Tool => !!t && t.status === "live");

  if (targets.length === 0 && !onThisStep) return null;

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

  async function continueWorkflow() {
    if (busy || !wf || !nextStep || !nextTool) return;
    setBusy(true);
    try {
      const file = await getFile();
      if (!file) return;
      const step = active!.step + 1;
      setWorkflowStep(wf.slug, step);
      setHandoff(file, exclude, { slug: wf.slug, step });
      const q = nextStep.params ? `?${new URLSearchParams(nextStep.params)}` : "";
      router.push(`/tools/${nextStep.tool}${q}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {nextStep && nextTool && (
        <div className="chain workflow-next" aria-label="Continue this workflow">
          <span className="chain-label">Next in “{wf!.name}”</span>
          <button
            type="button"
            className="chain-btn primary"
            disabled={busy}
            style={{ ["--cat" as string]: `var(--cat-${nextTool.category})` }}
            onClick={continueWorkflow}
          >
            <CategoryIcon id={nextTool.category} size={13} />
            Next: {nextTool.name}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {isLastStep && (
        <div className="chain workflow-next" aria-label="Workflow complete">
          <span className="chain-label">Last step of “{wf!.name}” — download your result above.</span>
          <button type="button" className="chain-btn" onClick={() => exitWorkflow()}>Finish ✓</button>
        </div>
      )}

      {targets.length > 0 && (
        <div className="chain" aria-label="Continue with another tool">
          <span className="chain-label">{onThisStep ? "Or continue with" : "Continue with"}</span>
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
      )}
    </>
  );
}
