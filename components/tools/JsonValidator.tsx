"use client";

import { useState, useMemo } from "react";

export default function JsonValidator() {
  const [input, setInput] = useState("");
  const [tabSize, setTabSize] = useState(2);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, tabSize);
      return { valid: true, formatted, error: null, size: formatted.length };
    } catch (e: any) {
      const msg = e.message || "Invalid JSON";
      // Extract line/col from error like "Unexpected token at position 42"
      let line = 0, col = 0;
      const pos = e.position ?? e.pos;
      if (pos !== undefined && pos >= 0) {
        const before = input.slice(0, pos);
        line = (before.match(/\n/g) || []).length + 1;
        const lastNewline = before.lastIndexOf("\n");
        col = pos - lastNewline;
      }
      return { valid: false, formatted: null, error: { message: msg, line, col } };
    }
  }, [input, tabSize]);

  function minify() {
    try { setInput(JSON.stringify(JSON.parse(input))); } catch {}
  }

  return (
    <div>
      <div className="field">
        <label>JSON input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "value", "number": 42, "arr": [1, 2, 3]}'
          style={{ minHeight: 180, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      {result && (
        <>
          {result.valid ? (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Valid JSON</span>
                <span style={{ color: "var(--muted)", fontSize: ".82rem" }}>{result.size} characters</span>
                <button className="btn secondary" style={{ padding: "4px 10px", fontSize: ".78rem", marginLeft: "auto" }} onClick={minify}>Minify</button>
              </div>
              <div className="field">
                <label>Formatted</label>
                <textarea readOnly value={result.formatted || ""} style={{ minHeight: 180, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={() => navigator.clipboard.writeText(result.formatted || "")}>Copy formatted</button>
                  <button className="btn secondary" onClick={() => { setInput(result.formatted || ""); }}>Replace input</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "12px 16px", background: "color-mix(in srgb, var(--danger) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", borderRadius: "var(--radius-sm)", marginBottom: 12 }}>
              <p style={{ color: "var(--danger)", fontWeight: 600 }}>✗ Invalid JSON</p>
              <p style={{ color: "var(--text)", fontSize: ".9rem", marginTop: 4 }}>{result.error?.message}</p>
              {result.error?.line !== undefined && result.error?.line > 0 && (
                <p style={{ color: "var(--muted)", fontSize: ".82rem", fontFamily: "var(--font-mono), monospace" }}>At line {result.error.line}, column {result.error.col}</p>
              )}
            </div>
          )}
        </>
      )}

      <div className="field" style={{ maxWidth: 120 }}>
        <label>Tab size</label>
        <select className="input" value={tabSize} onChange={(e) => setTabSize(parseInt(e.target.value))}>
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
      </div>

      <p className="privacy-note">🔒 JSON is validated entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
