"use client";

// ─────────────────────────────────────────────────────────────────────────
// Shared batch runner for the file tools. Given a list of input files and a
// per-file `process` function, it runs them sequentially (to bound memory),
// shows per-file status + savings, and offers per-file and "Download all
// (.zip)" downloads. A failing file errors on its own row without stopping the
// batch. Everything stays in the browser — nothing is uploaded.
//
// Re-run: the parent owns the processing options and passes them into
// `process`; bumping `runToken` reprocesses every file with the latest options
// (so a 50-file batch isn't re-run on every slider tick — only on demand).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { downloadAsZip } from "@/lib/zip";

export interface BatchOutput {
  blob: Blob;
  name: string;
}

type Status = "queued" | "processing" | "done" | "error";

interface Row {
  file: File;
  status: Status;
  out?: BatchOutput;
  outSize?: number;
  error?: string;
}

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function saved(orig: number, out: number): number {
  if (!orig) return 0;
  return Math.round((1 - out / orig) * 100);
}

export default function BatchFileList({
  files,
  process,
  zipName,
  runToken = 0,
  showSavings = true,
  onClear,
}: {
  files: File[];
  process: (file: File) => Promise<BatchOutput>;
  zipName: string;
  runToken?: number;
  showSavings?: boolean;
  onClear?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => files.map((f) => ({ file: f, status: "queued" as const })));
  const processRef = useRef(process);
  processRef.current = process;

  useEffect(() => {
    let cancelled = false;
    setRows(files.map((f) => ({ file: f, status: "queued" as const })));
    (async () => {
      for (let i = 0; i < files.length; i++) {
        if (cancelled) return;
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "processing" } : r)));
        try {
          const out = await processRef.current(files[i]);
          if (cancelled) return;
          setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "done", out, outSize: out.blob.size } : r)));
        } catch (err) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : "Could not process this file.";
          setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: message } : r)));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files, runToken]);

  const done = rows.filter((r) => r.status === "done" && r.out);
  const active = rows.some((r) => r.status === "processing" || r.status === "queued");

  function downloadOne(r: Row) {
    if (!r.out) return;
    const url = URL.createObjectURL(r.out.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.out.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadAll() {
    if (done.length === 0) return;
    await downloadAsZip(done.map((r) => ({ name: r.out!.name, data: r.out!.blob })), zipName);
  }

  return (
    <div className="batch">
      <div className="batch-bar">
        <span className="batch-progress">
          {active ? `Processing ${done.length + rows.filter((r) => r.status === "error").length}/${rows.length}…` : `${done.length} of ${rows.length} ready`}
        </span>
        <div className="batch-actions">
          <button type="button" className="btn" onClick={downloadAll} disabled={done.length === 0}>
            ⬇ Download all ({done.length}) .zip
          </button>
          {onClear && (
            <button type="button" className="btn secondary" onClick={onClear} disabled={active}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ul className="batch-list">
        {rows.map((r, i) => (
          <li key={`${r.file.name}-${i}`} className={`batch-row batch-${r.status}`}>
            <span className="batch-name" title={r.file.name}>{r.file.name}</span>
            <span className="batch-size">
              {r.status === "done" && r.outSize != null ? (
                <>
                  {fmt(r.file.size)} → {fmt(r.outSize)}
                  {showSavings && r.file.size > 0 && (
                    <span className="batch-saved"> −{Math.max(0, saved(r.file.size, r.outSize))}%</span>
                  )}
                </>
              ) : (
                fmt(r.file.size)
              )}
            </span>
            <span className="batch-status">
              {r.status === "queued" && "Queued"}
              {r.status === "processing" && "Working…"}
              {r.status === "error" && <span className="batch-err" title={r.error}>Failed</span>}
              {r.status === "done" && (
                <button type="button" className="batch-dl" onClick={() => downloadOne(r)}>Download</button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
