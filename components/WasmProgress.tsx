"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared WASM download / processing progress bar.
// Replaces plain-text status messages in WASM-heavy tools with a visual
// progress bar that shows what's happening (download → init → process).
// ─────────────────────────────────────────────────────────────────────────────

export default function WasmProgress({
  status,
  pct,
}: {
  status: string;
  pct?: number;
}) {
  if (!status) return null;

  const indeterminate = pct === undefined || pct < 0;

  return (
    <div className="wasm-progress" role="status" aria-live="polite">
      <div className="wasm-bar-track">
        <div
          className={`wasm-bar-fill${indeterminate ? " wasm-indeterminate" : ""}`}
          style={indeterminate ? {} : { width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="wasm-label">{status}</span>

      <style jsx>{`
        .wasm-progress {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0;
        }
        .wasm-bar-track {
          flex: 1; max-width: 320px; height: 6px;
          background: var(--border);
          border-radius: 999px; overflow: hidden;
        }
        .wasm-bar-fill {
          height: 100%; background: var(--accent);
          border-radius: 999px;
          transition: width .25s ease;
        }
        .wasm-bar-fill.wasm-indeterminate {
          width: 30%;
          animation: wasm-slide 1.6s ease-in-out infinite;
        }
        @keyframes wasm-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(calc(320px / 0.3 + 100%)); }
        }
        .wasm-label {
          font-size: .82rem; color: var(--muted);
          white-space: nowrap; min-width: 0;
          overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
