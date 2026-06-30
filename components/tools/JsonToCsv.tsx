"use client";

import { useState } from "react";

function toCsvValue(v: unknown): string {
  const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function JsonToCsv() {
  const [input, setInput] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function convert() {
    setCopied(false);
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data) || !data.length) throw new Error("Expected a non-empty JSON array of objects.");
      const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row ?? {}))));
      const lines = [headers.map(toCsvValue).join(",")];
      for (const row of data) lines.push(headers.map((h) => toCsvValue((row ?? {})[h])).join(","));
      setCsv(lines.join("\n"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setCsv("");
    }
  }

  function download() {
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy() { await navigator.clipboard.writeText(csv); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>JSON array of objects</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="mono" placeholder='[{"name":"Sam","age":30},{"name":"Lee","age":25}]' />
      </div>
      <button className="btn" onClick={convert}>Convert to CSV</button>
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>⚠ {error}</p>}
      {csv && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>CSV</label>
          <textarea readOnly value={csv} className="mono" />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy CSV"}</button>
            <button className="btn secondary" onClick={download}>⬇ Download .csv</button>
          </div>
        </div>
      )}
      <p className="privacy-note">🔒 Converted locally in your browser.</p>
    </div>
  );
}
