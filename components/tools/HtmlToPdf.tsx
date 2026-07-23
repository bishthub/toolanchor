"use client";

import { useMemo, useRef, useState } from "react";

const SAMPLE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 1.6rem; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; }
  </style>
</head>
<body>
  <h1>Invoice #1042</h1>
  <p>Replace this sample with your own HTML — headings, tables, images and CSS all carry over to the PDF.</p>
  <table>
    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
    <tr><td>Design work</td><td>12 h</td><td>$960.00</td></tr>
    <tr><td>Hosting (annual)</td><td>1</td><td>$120.00</td></tr>
  </table>
</body>
</html>`;

type PageSize = "A4" | "Letter";
type Margin = "default" | "none" | "narrow";

function injectPageCss(html: string, size: PageSize, margin: Margin): string {
  // @page margin stays 0 so the browser doesn't stamp its date/title/URL header
  // and footer onto the PDF; the chosen margin is applied as body padding instead.
  const pad = margin === "none" ? "0" : margin === "narrow" ? "10mm" : "18mm";
  const style = `<style>@page { size: ${size}; margin: 0; } @media print { body { padding: ${pad}; } }</style>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + style);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => m + `<head>${style}</head>`);
  return style + html;
}

export default function HtmlToPdf() {
  const [html, setHtml] = useState(SAMPLE);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [margin, setMargin] = useState<Margin>("default");
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => injectPageCss(html, pageSize, margin), [html, pageSize, margin]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text()
      .then((text) => { setHtml(text); setError(null); })
      .catch(() => setError("Couldn't read that file — make sure it's a text .html file."));
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
        <label>Open an HTML file (optional)</label>
        <input className="input" type="file" accept=".html,.htm,text/html" onChange={onFile} />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minHeight: 400 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>HTML</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="mono"
            style={{ minHeight: 400, fontSize: ".85rem", resize: "vertical", margin: 0, width: "100%" }}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Preview</label>
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            style={{
              width: "100%", height: 420, border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", background: "#fff",
            }}
            title="HTML to PDF preview"
            // allow-modals lets the sandboxed preview open the print dialog.
            sandbox="allow-same-origin allow-modals"
          />
        </div>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

      <button className="btn" style={{ marginTop: 14 }} onClick={saveAsPdf}>Save as PDF</button>
      <p style={{ fontSize: ".85rem", opacity: 0.75, marginTop: 8 }}>
        In the print dialog that opens, choose <strong>Save as PDF</strong> as the destination. Because the browser
        prints the page natively, the PDF is true vector output — crisp, selectable text at any zoom, not a screenshot.
      </p>

      <p className="privacy-note">🔒 Rendered and printed entirely in your browser — your HTML is never uploaded.</p>
    </div>
  );
}
