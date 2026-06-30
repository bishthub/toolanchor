"use client";

import { useState } from "react";

export default function UrlEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  let output = "";
  let error: string | null = null;
  if (input) {
    try {
      output = mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
    } catch {
      error = "Could not decode — the input contains invalid percent-encoding.";
    }
  }

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
        <label>{mode === "encode" ? "Text" : "Encoded URL"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "hello world & friends" : "hello%20world%20%26%20friends"} />
      </div>
      <div className="field">
        <label>Output</label>
        <textarea readOnly value={error ?? output} className="mono" style={error ? { color: "#ff6b6b" } : undefined} />
      </div>
      <button className="btn" onClick={copy} disabled={!output || !!error}>{copied ? "✓ Copied" : "Copy output"}</button>
      <p className="privacy-note">🔒 Runs locally in your browser.</p>
    </div>
  );
}
