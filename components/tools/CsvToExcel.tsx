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

export default function CsvToExcel() {
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null); setRows(null);
    try {
      const text = await f.text();
      setInput(text);
      setFileName(f.name);
      const parsed = parseCsv(text.trim());
      if (parsed.length === 0) throw new Error("empty");
      setRows(parsed);
    } catch {
      setError("Could not read this file. Make sure it's a plain-text .csv file.");
    }
  }

  function convert() {
    setError(null);
    try {
      const parsed = parseCsv(input.trim());
      if (parsed.length === 0) throw new Error("empty");
      setRows(parsed);
    } catch {
      setError("Could not parse this CSV. Check for unclosed quotes.");
      setRows(null);
    }
  }

  async function download() {
    if (!rows) return;
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const data = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName ? fileName.replace(/\.csv$/i, "") + ".xlsx" : "data.xlsx";
      a.click();
    } catch {
      setError("Could not generate the Excel file.");
    } finally { setBusy(false); }
  }

  const cols = rows ? Math.max(...rows.map((r) => r.length)) : 0;

  return (
    <div>
      <div className="field">
        <label>Choose a CSV file (.csv)</label>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="input" disabled={busy} />
      </div>

      <div className="field">
        <label>…or paste CSV (first row = headers)</label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setFileName(null); setRows(null); }}
          placeholder={"name,age\nSam,30\nLee,25"}
          style={{ minHeight: 140, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      <button className="btn" onClick={convert} disabled={busy || !input.trim()}>Convert to Excel</button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>⚠ {error}</p>}

      {rows && (
        <>
          <div className="stats" style={{ marginTop: 14 }}>
            <div className="stat"><div className="n">{rows.length}</div><div className="l">Rows</div></div>
            <div className="stat"><div className="n">{cols}</div><div className="l">Columns</div></div>
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={download} disabled={busy}>
            {busy ? "Generating…" : "⬇ Download .xlsx"}
          </button>
        </>
      )}

      <p className="privacy-note">🔒 The CSV is parsed and converted entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
