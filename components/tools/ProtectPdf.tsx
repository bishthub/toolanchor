"use client";

import { useEffect, useState } from "react";
import { runQpdf } from "@/lib/qpdf";
import WasmProgress from "@/components/WasmProgress";

export default function ProtectPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) { setFile(f); setError(null); setUrl(null); }
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    if (pw.length < 3) { setError("Choose a password of at least 3 characters."); return; }
    if (pw !== pw2) { setError("The two passwords don't match."); return; }
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    try {
      const input = new Uint8Array(await file.arrayBuffer());
      // qpdf --encrypt <user-pw> <owner-pw> 256 -- in out  (AES-256)
      const out = await runQpdf(
        input,
        (i, o) => ["--encrypt", pw, pw, "256", "--", i, o],
        setStatus
      );
      setUrl(URL.createObjectURL(new Blob([out.slice().buffer], { type: "application/pdf" })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not protect this PDF. If it's already encrypted, unlock it first.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a PDF file</label>
        <input type="file" accept="application/pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); setUrl(null); }} className="input" disabled={busy} />
      </div>

      <div className="row">
        <div className="field">
          <label>Password</label>
          <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} disabled={busy} autoComplete="new-password" />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} disabled={busy} autoComplete="new-password" />
        </div>
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "🔒 Protect PDF"}
      </button>

      {busy && <WasmProgress status={status || "Working…"} />}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <a className="btn" href={url} download={file ? `${file.name.replace(/\.pdf$/i, "")}-protected.pdf` : "protected.pdf"} style={{ display: "inline-flex" }}>⬇ Download protected PDF</a>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>Keep your password safe — it can’t be recovered if lost.</p>
        </div>
      )}

      <p className="privacy-note">🔒 Encryption (AES-256) runs in your browser via qpdf — your PDF and password are never uploaded. First run downloads the engine (~1.3 MB, cached after).</p>
    </div>
  );
}
