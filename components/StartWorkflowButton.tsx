"use client";

import { useRouter } from "@/i18n/navigation";
import { startWorkflow } from "@/lib/workflow";
import type { Workflow } from "@/lib/workflows";

export default function StartWorkflowButton({ wf }: { wf: Workflow }) {
  const router = useRouter();
  function start() {
    startWorkflow(wf.slug);
    const first = wf.steps[0];
    const q = first.params ? `?${new URLSearchParams(first.params)}` : "";
    router.push(`/tools/${first.tool}${q}`);
  }
  return (
    <button type="button" className="btn" onClick={start}>
      Start workflow →
    </button>
  );
}
