"use client";

import { useState } from "react";

// Minimal RFC-4180-ish CSV parser supporting quoted fields, commas and newlines.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim() !== ""));
}

export default function CsvToJson() {
  const [input, setInput] = useState("");
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function convert() {
    setCopied(false);
    try {
      const rows = parseCsv(input.trim());
      if (rows.length < 2) throw new Error("Need a header row plus at least one data row.");
      const headers = rows[0];
      const out = rows.slice(1).map((r) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
        return obj;
      });
      setJson(JSON.stringify(out, null, 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse CSV");
      setJson("");
    }
  }

  async function copy() { await navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>CSV (first row = headers)</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="mono" placeholder={"name,age\nSam,30\nLee,25"} />
      </div>
      <button className="btn" onClick={convert}>Convert to JSON</button>
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>⚠ {error}</p>}
      {json && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>JSON</label>
          <textarea readOnly value={json} className="mono" style={{ minHeight: 200 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy JSON"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 Parsed locally in your browser.</p>
    </div>
  );
}
