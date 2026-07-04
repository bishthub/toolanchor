"use client";

// ─────────────────────────────────────────────────────────────────────────
// The privacy claim, made explicit and verifiable, on every tool page.
// For local tools (the default) it states the file never leaves the device
// and offers a "prove it" note pointing at the Network tab. For the rare
// server-backed tool (e.g. the AI content detector) it says so honestly.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from "react";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.2 2.9 7.7 7 8.9 4.1-1.2 7-4.7 7-8.9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  );
}

export default function LocalBadge({ local = true }: { local?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`local-badge ${local ? "is-local" : "is-server"}`}>
      <button
        type="button"
        className="local-badge-main"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="local-badge-icon" aria-hidden="true">{local ? <ShieldIcon /> : <ServerIcon />}</span>
        {local
          ? "Runs locally — your file never leaves your device"
          : "Quick check is local — deep AI analysis is opt-in"}
        <span className="local-badge-toggle">{open ? "Hide" : local ? "Prove it" : "Details"}</span>
      </button>
      {open && (
        <div className="local-badge-note">
          {local ? (
            <>
              Everything runs in your browser. Want proof? Open your browser&apos;s developer
              tools, switch to the <strong>Network</strong> tab, and use the tool — you&apos;ll see
              no upload of your file. (Some tools download a processing engine once from a CDN;
              that&apos;s code, not your data — your file itself is never sent anywhere.)
            </>
          ) : (
            <>
              The quick check runs entirely in your browser. Only if you click <strong>Run deep AI
              analysis</strong> is your text sent to our server (and on to AI models) for a more
              accurate score — it&apos;s analysed for that and not stored. Every other tool on this
              site is fully on-device; avoid pasting anything sensitive into deep analysis.
            </>
          )}
        </div>
      )}
    </div>
  );
}
