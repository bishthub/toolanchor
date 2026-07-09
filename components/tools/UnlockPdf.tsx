"use client";

import { useEffect, useState } from "react";
import { runQpdf, QpdfError } from "@/lib/qpdf";
import WasmProgress from "@/components/WasmProgress";

export default function UnlockPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
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
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    try {
      const input = new Uint8Array(await file.arrayBuffer());
      // qpdf --decrypt --password=<pw> in out
      const out = await runQpdf(
        input,
        (i, o) => ["--decrypt", `--password=${pw}`, i, o],
        setStatus
      );
      setUrl(URL.createObjectURL(new Blob([out.slice().buffer], { type: "application/pdf" })));
      setStatus("");
    } catch (err) {
      console.error(err);
      // qpdf exit code 2 = invalid password / structure.
      if (err instanceof QpdfError && err.code === 2) {
        setError("Wrong password, or this PDF isn't password-protected.");
      } else {
        setError("Could not unlock this PDF. Check the password and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a password-protected PDF</label>
        <input type="file" accept="application/pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); setUrl(null); }} className="input" disabled={busy} />
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label>Password</label>
        <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} disabled={busy} autoComplete="off" />
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "🔓 Unlock PDF"}
      </button>

      {busy && <WasmProgress status={status || "Working…"} />}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <a className="btn" href={url} download={file ? `${file.name.replace(/\.pdf$/i, "")}-unlocked.pdf` : "unlocked.pdf"} style={{ display: "inline-flex" }}>⬇ Download unlocked PDF</a>
        </div>
      )}

      <p className="privacy-note">🔒 Only works with the correct password — this is self-service unlocking, not cracking. Everything runs in your browser via qpdf; your PDF and password are never uploaded.</p>
    </div>
  );
}
