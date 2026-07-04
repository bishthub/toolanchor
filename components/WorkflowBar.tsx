"use client";

// Slim progress bar shown on a tool page while a workflow is active and this
// tool is the workflow's current step. Reads sessionStorage-backed state so it
// survives a reload (the workflow resumes; the file is re-selected).

import { useEffect, useState } from "react";
import { getActiveWorkflow, exitWorkflow, WORKFLOW_EVENT, type ActiveWorkflow } from "@/lib/workflow";
import { getWorkflow } from "@/lib/workflows";

export default function WorkflowBar({ slug }: { slug: string }) {
  const [active, setActive] = useState<ActiveWorkflow | null>(null);
  useEffect(() => {
    const read = () => setActive(getActiveWorkflow());
    read();
    window.addEventListener(WORKFLOW_EVENT, read);
    return () => window.removeEventListener(WORKFLOW_EVENT, read);
  }, []);

  if (!active) return null;
  const wf = getWorkflow(active.slug);
  const step = wf?.steps[active.step];
  if (!wf || !step || step.tool !== slug) return null; // only on the expected step

  return (
    <div className="workflow-bar">
      <div className="workflow-bar-text">
        <span className="workflow-bar-name">{wf.name}</span>
        <span className="workflow-bar-step">Step {active.step + 1} of {wf.steps.length} · {step.note}</span>
      </div>
      <div className="workflow-dots" aria-hidden="true">
        {wf.steps.map((_, i) => (
          <span key={i} className={`wf-dot ${i < active.step ? "done" : i === active.step ? "current" : ""}`} />
        ))}
      </div>
      <button type="button" className="workflow-exit" onClick={() => exitWorkflow()}>Exit</button>
    </div>
  );
}
