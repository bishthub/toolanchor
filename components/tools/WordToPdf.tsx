"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type PageSize = "A4" | "Letter";
type Margin = "default" | "narrow" | "none";

function isDocx(f: File): boolean {
  return f.type === DOCX_MIME || /\.docx$/i.test(f.name);
}

function buildDoc(bodyHtml: string, size: PageSize, margin: Margin): string {
  const marginCss = margin === "none" ? " margin: 0;" : margin === "narrow" ? " margin: 10mm;" : "";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: ${size};${marginCss} }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; line-height: 1.55; padding: 24px; max-width: none; }
  h1 { font-size: 1.7rem; margin: 1.1em 0 .45em; line-height: 1.25; }
  h2 { font-size: 1.35rem; margin: 1em 0 .4em; line-height: 1.3; }
  h3 { font-size: 1.15rem; margin: .9em 0 .35em; }
  h4, h5, h6 { font-size: 1rem; margin: .8em 0 .3em; }
  p { margin: .6em 0; }
  ul, ol { margin: .6em 0; padding-left: 1.6em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; }
  img { max-width: 100%; height: auto; }
  blockquote { margin: .8em 0; padding-left: 1em; border-left: 3px solid #ccc; color: #444; }
  a { color: #1a4fa0; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export default function WordToPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [margin, setMargin] = useState<Margin>("default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(
    () => (html ? buildDoc(html, pageSize, margin) : ""),
    [html, pageSize, margin]
  );

  async function convert(f: File) {
    setBusy(true); setError(null); setHtml(""); setWarnings([]);
    setFileName(f.name);
    try {
      const mod: any = await import("mammoth");
      const mammoth = mod.default ?? mod;
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (!result.value || !result.value.trim()) {
        setError("No readable content was found in this document.");
        return;
      }
      setHtml(result.value);
      const notes: string[] = Array.from(
        new Set(result.messages.map((m: { message: string }) => m.message))
      );
      setWarnings(notes);
    } catch (err) {
      console.error(err);
      setError("This file doesn't look like a .docx document.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find(isDocx);
    if (f) convert(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isDocx(f)) {
      setError("This file doesn't look like a .docx document.");
      e.target.value = "";
      return;
    }
    convert(f);
    e.target.value = "";
  }

  function saveAsPdf() {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      setError("The preview isn't ready yet — wait a moment and try again.");
      return;
    }
    setError(null);
    try {
      win.focus();
      win.print();
    } catch {
      setError("Your browser blocked printing the preview. Try again, or use your browser's own Print option on the preview.");
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a Word document (.docx)</label>
        <input
          type="file"
          className="input"
          accept={`.docx,${DOCX_MIME}`}
          onChange={onFile}
          disabled={busy}
        />
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Page size</label>
          <select className="input" value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Margins</label>
          <select className="input" value={margin} onChange={(e) => setMargin(e.target.value as Margin)}>
            <option value="default">Default</option>
            <option value="narrow">Narrow</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>Converting {fileName}…</p>}
      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

      {html && (
        <>
          <div className="field" style={{ marginTop: 4 }}>
            <label>Preview{fileName ? ` — ${fileName}` : ""}</label>
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              style={{
                width: "100%", height: 480, border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", background: "#fff",
              }}
              title="Word to PDF preview"
              sandbox="allow-same-origin allow-modals"
            />
          </div>

          {warnings.length > 0 && (
            <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
              Some content was simplified during conversion ({warnings.length}{" "}
              {warnings.length === 1 ? "note" : "notes"}) — intricate layout features like text
              boxes or headers/footers don't carry over one-to-one.
            </p>
          )}

          <button className="btn" style={{ marginTop: 10 }} onClick={saveAsPdf}>Save as PDF</button>
          <p style={{ fontSize: ".85rem", opacity: 0.75, marginTop: 8 }}>
            In the print dialog that opens, choose <strong>Save as PDF</strong> as the destination.
            Because the browser prints the page natively, the PDF is true vector output — crisp,
            selectable text at any zoom, not a screenshot.
          </p>
        </>
      )}

      <p className="privacy-note">🔒 Converted and printed entirely in your browser — your document is never uploaded.</p>
    </div>
  );
}
