// ─────────────────────────────────────────────────────────────────────────
// Tool-to-tool file handoff. "Continue with →" (and the universal drop zone)
// store the output file(s) here, then navigate client-side to the next tool,
// which picks them up via takeHandoff(). Module memory survives Next.js client
// navigation; a full page reload simply drops the handoff (the user can
// re-select the file).
// ─────────────────────────────────────────────────────────────────────────

export interface Handoff {
  files: File[];
  from: string; // tool slug (or "drop") the file came from
  workflow?: { slug: string; step: number }; // set when advancing a workflow
}

let pending: Handoff | null = null;

export function setHandoff(
  files: File | File[],
  from: string,
  workflow?: { slug: string; step: number }
) {
  pending = { files: Array.isArray(files) ? files : [files], from, workflow };
}

export function takeHandoff(): Handoff | null {
  const p = pending;
  // Clear shortly after the first read (not synchronously — React strict
  // mode double-invokes state initializers during dev renders).
  if (p) {
    setTimeout(() => {
      if (pending === p) pending = null;
    }, 1500);
  }
  return p;
}
