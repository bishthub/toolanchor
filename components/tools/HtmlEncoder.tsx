"use client";

import { useState } from "react";

const ENC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function encodeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENC[c]);
}
function decodeHtml(s: string): string {
  // Use the browser's parser for robust decoding of all entities.
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

export default function HtmlEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = input ? (mode === "encode" ? encodeHtml(input) : decodeHtml(input)) : "";

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Mode</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "encode" ? "" : "secondary"}`} onClick={() => setMode("encode")}>Encode →</button>
          <button type="button" className={`btn ${mode === "decode" ? "" : "secondary"}`} onClick={() => setMode("decode")}>Decode ←</button>
        </div>
      </div>
      <div className="field">
        <label>{mode === "encode" ? "Text / HTML" : "Encoded entities"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "<div>Hello & welcome</div>" : "&lt;div&gt;Hello &amp; welcome&lt;/div&gt;"} />
      </div>
      <div className="field">
        <label>Output</label>
        <textarea readOnly value={output} className="mono" />
      </div>
      <button className="btn" onClick={copy} disabled={!output}>{copied ? "✓ Copied" : "Copy output"}</button>
      <p className="privacy-note">🔒 Runs locally in your browser.</p>
    </div>
  );
}
