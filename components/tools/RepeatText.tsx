"use client";

import { useState } from "react";

const SEPARATORS: Record<string, string> = { "New line": "\n", Space: " ", Comma: ", ", None: "" };

export default function RepeatText() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(10);
  const [sep, setSep] = useState("New line");
  const [copied, setCopied] = useState(false);

  const n = Math.min(Math.max(count, 1), 10000);
  const out = text ? Array(n).fill(text).join(SEPARATORS[sep]) : "";

  async function copy() { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Text to repeat</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type text…" style={{ minHeight: 90 }} />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Times (max 10000)</label>
          <input type="number" className="input" min={1} max={10000} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label>Separator</label>
          <select className="input" value={sep} onChange={(e) => setSep(e.target.value)}>
            {Object.keys(SEPARATORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Result</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy result"}</button>
      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
