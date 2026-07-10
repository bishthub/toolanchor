"use client";

import { useState, useMemo } from "react";

export default function ExcelToCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState(0);
  const [sheets, setSheets] = useState<string[]>([]);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setBusy(true); setError(null); setCsv("");
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(data, { type: "array" });
      setSheets(workbook.SheetNames);
      const first = workbook.SheetNames[0];
      setSheet(0);
      const ws = workbook.Sheets[first];
      const csvStr = XLSX.utils.sheet_to_csv(ws);
      setCsv(csvStr);
    } catch (err) {
      console.error(err);
      setError("Could not read this Excel file. Make sure it's a .xlsx file.");
    } finally { setBusy(false); }
  }

  function selectSheet(idx: number) {
    if (!file) return;
    setSheet(idx);
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: "array" });
        const ws = workbook.Sheets[workbook.SheetNames[idx]];
        setCsv(XLSX.utils.sheet_to_csv(ws));
      } catch {}
      setBusy(false);
    };
    reader.readAsArrayBuffer(file);
  }

  function download() {
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file?.name?.replace(/\.xlsx$/i, "") + ".csv";
    a.click();
  }

  return (
    <div>
      <div className="field">
        <label>Choose an Excel file (.xlsx)</label>
        <input type="file" accept=".xlsx" onChange={onFile} className="input" disabled={busy} />
      </div>
      {busy && <p style={{ color: "var(--muted)" }}>Reading Excel file…</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {sheets.length > 0 && (
        <div className="field" style={{ maxWidth: 300 }}>
          <label>Sheet</label>
          <select className="input" value={sheet} onChange={(e) => selectSheet(parseInt(e.target.value))}>
            {sheets.map((s, i) => <option key={i} value={i}>{s}</option>)}
          </select>
        </div>
      )}
      {csv && (
        <div className="field">
          <label>CSV preview</label>
          <textarea readOnly value={csv.slice(0, 2000)} style={{ minHeight: 120, fontFamily: "var(--font-mono), monospace", fontSize: ".82rem" }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={download}>⬇ Download CSV</button>
        </div>
      )}
      <p className="privacy-note">🔒 The Excel file is read entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
