"use client";

import { useState } from "react";
import { parse, stringify } from "yaml";

export default function JsonToYaml() {
  const [mode, setMode] = useState<"j2y" | "y2j">("j2y");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  let output = "";
  let error: string | null = null;
  if (input.trim()) {
    try {
      output = mode === "j2y" ? stringify(JSON.parse(input)) : JSON.stringify(parse(input), null, 2);
    } catch (e) {
      error = e instanceof Error ? e.message : "Conversion error";
    }
  }

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Direction</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "j2y" ? "" : "secondary"}`} onClick={() => setMode("j2y")}>JSON → YAML</button>
          <button type="button" className={`btn ${mode === "y2j" ? "" : "secondary"}`} onClick={() => setMode("y2j")}>YAML → JSON</button>
        </div>
      </div>
      <div className="field">
        <label>{mode === "j2y" ? "JSON" : "YAML"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="mono" placeholder={mode === "j2y" ? '{"name":"Sam","tags":["a","b"]}' : "name: Sam\ntags:\n  - a\n  - b"} />
      </div>
      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}
      {output && (
        <div className="field">
          <label>{mode === "j2y" ? "YAML" : "JSON"}</label>
          <textarea readOnly value={output} className="mono" style={{ minHeight: 180 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy result"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 Converted locally in your browser.</p>
    </div>
  );
}
