"use client";

import { useState } from "react";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function run(minify: boolean) {
    setCopied(false);
    if (!input.trim()) { setOutput(""); setError(null); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
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
        <label>Paste JSON</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"hello":"world","nums":[1,2,3]}' />
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn" onClick={() => run(false)}>Format / Beautify</button>
        <button className="btn secondary" onClick={() => run(true)}>Minify</button>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

      {output && (
        <div className="field">
          <label>Result</label>
          <textarea readOnly value={output} style={{ fontFamily: "monospace", minHeight: 220 }} />
          <button className="btn" style={{ marginTop: 10 }} onClick={copy}>{copied ? "✓ Copied" : "Copy result"}</button>
        </div>
      )}

      <p className="privacy-note">🔒 Parsing and formatting happen in your browser — your JSON is never uploaded.</p>
    </div>
  );
}
