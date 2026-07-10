"use client";

import { useState, useMemo } from "react";

export default function HtmlPreview() {
  const [html, setHtml] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { color: #4f46e5; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Edit the HTML on the left to see changes live.</p>
  <button onclick="alert('Hello!')">Click me</button>
</body>
</html>`);

  const srcDoc = useMemo(() => html, [html]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minHeight: 400 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>HTML / CSS / JS</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            style={{
              minHeight: 400, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem",
              resize: "vertical", margin: 0, width: "100%",
            }}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Live preview</label>
          <iframe
            srcDoc={srcDoc}
            style={{
              width: "100%", height: 420, border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", background: "#fff",
            }}
            title="HTML preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
      <p className="privacy-note">🔒 Runs entirely in your browser. JavaScript is sandboxed in the iframe.</p>
    </div>
  );
}
