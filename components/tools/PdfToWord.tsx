"use client";

import { useState } from "react";

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  async function run(f: File) {
    setBusy(true); setError(null); setUrl(null); setStatus("Reading PDF…");
    try {
      const pdfjs: any = await import("pdfjs-dist");
      const data = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Processing page ${i} of ${pdf.numPages}…`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str || "").join(" ") + "\n\n";
      }

      const docx = buildSimpleDocx(text);
      const blob = new Blob([docx as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      setUrl(URL.createObjectURL(blob));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not convert this PDF. Make sure it has selectable text (not a scanned image).");
    } finally { setBusy(false); }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); run(f); }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a PDF file with selectable text</label>
        <input type="file" accept="application/pdf" onChange={onFile} className="input" disabled={busy} />
      </div>
      {busy && <p style={{ color: "var(--muted)" }}>{status}</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {url && (
        <div style={{ marginTop: 16 }}>
          <a className="btn" href={url} download={file?.name?.replace(/\.pdf$/i, "") + ".docx"} style={{ display: "inline-flex" }}>⬇ Download Word document</a>
        </div>
      )}
      <p className="privacy-note">🔒 Runs in your browser — your PDF never leaves your device. Works with selectable text PDFs only.</p>
    </div>
  );
}

function buildSimpleDocx(text: string): Uint8Array  {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const paragraphs = text.split("\n").filter(Boolean).map((p) => `  <w:p><w:r><w:t>${esc(p)}</w:t></w:r></w:p>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${paragraphs}
</w:body>
</w:document>`;
  return new TextEncoder().encode(xml);
}
