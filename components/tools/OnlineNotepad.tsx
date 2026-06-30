"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "toolanchor-notepad";

export default function OnlineNotepad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount (client only).
  useEffect(() => {
    try { setText(localStorage.getItem(KEY) ?? ""); } catch { /* ignore */ }
  }, []);

  function onChange(v: string) {
    setText(v);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try { localStorage.setItem(KEY, v); setSaved(true); } catch { /* ignore */ }
    }, 400);
  }

  function clear() {
    setText("");
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setSaved(true);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "note.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="field">
        <label>Your notes {saved ? "· ✓ saved" : "· saving…"}</label>
        <textarea value={text} onChange={(e) => onChange(e.target.value)} placeholder="Start typing — your note saves automatically on this device." style={{ minHeight: 280 }} />
      </div>
      <div className="row" style={{ alignItems: "center" }}>
        <button className="btn secondary" onClick={download} disabled={!text}>⬇ Download .txt</button>
        <button className="btn secondary" onClick={clear} disabled={!text}>Clear</button>
        <span style={{ color: "var(--muted)", fontSize: ".85rem", marginLeft: "auto" }}>{words} words · {text.length} characters</span>
      </div>
      <p className="privacy-note">🔒 Saved only in this browser on this device — never uploaded.</p>
    </div>
  );
}
