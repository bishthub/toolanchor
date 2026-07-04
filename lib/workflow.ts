// ─────────────────────────────────────────────────────────────────────────
// Active-workflow state. Which workflow (if any) the user is stepping through,
// kept in sessionStorage so it survives a page reload (the file doesn't — the
// user re-selects it — but the workflow resumes). Call only from the client.
// ─────────────────────────────────────────────────────────────────────────

const KEY = "ta:workflow";
export const WORKFLOW_EVENT = "ta:workflow";

export interface ActiveWorkflow {
  slug: string;
  step: number; // zero-based index into the workflow's steps
}

export function getActiveWorkflow(): ActiveWorkflow | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.slug === "string" && typeof v?.step === "number" ? v : null;
  } catch {
    return null;
  }
}

function write(v: ActiveWorkflow | null) {
  try {
    if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event(WORKFLOW_EVENT));
  } catch {
    /* ignore */
  }
}

export function startWorkflow(slug: string) {
  write({ slug, step: 0 });
}

export function setWorkflowStep(slug: string, step: number) {
  write({ slug, step });
}

export function exitWorkflow() {
  write(null);
}
