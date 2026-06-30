"use client";

import { useState } from "react";

function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join(" ");
}
function binaryToText(bin: string): string {
  const groups = bin.trim().split(/\s+/).filter(Boolean);
  const bytes = groups.map((g) => parseInt(g, 2));
  if (groups.some((g) => !/^[01]{1,8}$/.test(g)) || bytes.some((b) => isNaN(b))) {
    throw new Error("Invalid binary — use space-separated groups of 0s and 1s.");
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

export default function BinaryTextConverter() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  let output = "";
  let error: string | null = null;
  if (input) {
    try { output = mode === "encode" ? textToBinary(input) : binaryToText(input); }
    catch (e) { error = e instanceof Error ? e.message : "Conversion error"; }
  }

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Direction</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "encode" ? "" : "secondary"}`} onClick={() => setMode("encode")}>Text → Binary</button>
          <button type="button" className={`btn ${mode === "decode" ? "" : "secondary"}`} onClick={() => setMode("decode")}>Binary → Text</button>
        </div>
      </div>
      <div className="field">
        <label>{mode === "encode" ? "Text" : "Binary"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="mono" placeholder={mode === "encode" ? "Hello" : "01001000 01101001"} />
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
