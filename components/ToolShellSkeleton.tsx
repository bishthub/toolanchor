"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer for tool pages — matches the tool-shell shape (bar + body)
// so the user sees an accurate placeholder while the dynamic import loads.
// One source of truth shared by every dynamic() loading fallback in registry.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export default function ToolShellSkeleton({ label }: { label?: string }) {
  return (
    <div className="tool-shell" aria-busy="true" aria-label={`Loading ${label ?? "tool"}`}>
      {/* Tool-shell bar skeleton */}
      <div className="tool-shell-bar">
        <span className="sk-icon" />
        <span className="sk-label" />
        <span className="sk-badge" />
      </div>
      {/* Tool-shell body skeleton */}
      <div className="tool-shell-body">
        <div className="sk-field" style={{ width: "40%" }}>
          <div className="sk-line" style={{ width: "40%", height: 14, marginBottom: 10 }} />
          <div className="sk-block" style={{ height: 54 }} />
        </div>
        <div className="sk-row">
          <div className="sk-field" style={{ width: "30%" }}>
            <div className="sk-line" style={{ width: "50%", height: 14, marginBottom: 10 }} />
            <div className="sk-block" style={{ height: 44 }} />
          </div>
          <div className="sk-field" style={{ width: "30%" }}>
            <div className="sk-line" style={{ width: "50%", height: 14, marginBottom: 10 }} />
            <div className="sk-block" style={{ height: 44 }} />
          </div>
        </div>
        <div className="sk-btn" />
        <p className="sk-note" />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-label {
          display: block; width: 120px; height: 16px; border-radius: 6px;
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-badge {
          margin-left: auto; width: 80px; height: 22px; border-radius: 7px;
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .sk-field { display: flex; flex-direction: column; }
        .sk-line {
          border-radius: 5px;
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-block {
          border-radius: var(--radius-sm);
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-btn {
          width: 160px; height: 44px; border-radius: var(--radius-sm);
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .sk-note {
          width: 70%; height: 14px; border-radius: 5px;
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/** Shorthand for the registry — returns a component that renders the skeleton. */
export function sk(label?: string) {
  return function SkeletonWrapper() {
    return <ToolShellSkeleton label={label} />;
  };
}
