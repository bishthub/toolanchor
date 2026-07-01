// ─────────────────────────────────────────────────────────────────────────
// Tool-to-tool file handoff. "Continue with →" stores the output file here,
// then navigates client-side to the next tool, which picks it up via
// takeHandoff(). Module memory survives Next.js client navigation; a full
// page reload simply drops the handoff (the user can re-select the file).
// ─────────────────────────────────────────────────────────────────────────

export interface Handoff {
  file: File;
  from: string; // tool slug the file came from
}

let pending: Handoff | null = null;

export function setHandoff(file: File, from: string) {
  pending = { file, from };
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
