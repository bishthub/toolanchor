"use client";

import { useState } from "react";

// UTF-8 safe encode/decode (handles emoji and non-ASCII).
function encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function decode(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  let output = "";
  let error: string | null = null;
  if (input) {
    try {
      output = mode === "encode" ? encode(input) : decode(input);
    } catch {
      error = "That doesn't look like valid Base64.";
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
        <label>{mode === "encode" ? "Plain text" : "Base64 input"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "Type text to encode…" : "Paste Base64 to decode…"} />
      </div>

      <div className="field">
        <label>Output</label>
        <textarea readOnly value={error ?? output} style={error ? { color: "#ff6b6b" } : undefined} />
      </div>

      <button className="btn" onClick={copy} disabled={!output || !!error}>{copied ? "✓ Copied" : "Copy output"}</button>

      <p className="privacy-note">🔒 Encoding/decoding runs in your browser — your data is never uploaded.</p>
    </div>
  );
}
