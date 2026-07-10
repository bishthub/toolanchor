"use client";

import { useState, useMemo } from "react";

export default function CssMinifier() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    const original = input.length;

    // Minify
    let min = input
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove comments
      .replace(/\s*([{}:;,])\s*/g, "$1") // remove spaces around tokens
      .replace(/\s+/g, " ") // collapse remaining whitespace
      .replace(/;}/g, "}") // remove last semicolon before }
      .trim();

    // Format (basic)
    let formatted = min
      .replace(/{/g, " {\n  ")
      .replace(/;/g, ";\n  ")
      .replace(/}/g, "\n}\n")
      .replace(/  \n/g, "\n")
      .trim();

    const saved = original > 0 ? Math.round((1 - min.length / original) * 100) : 0;

    return {
      min,
      formatted,
      originalSize: original,
      minSize: min.length,
      saved,
    };
  }, [input]);

  return (
    <div>
      <div className="field">
        <label>CSS input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="body { margin: 0; padding: 20px; background: #fff; }"
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      {result && (
        <>
          <div className="stats" style={{ marginTop: 8 }}>
            <div className="stat"><div className="n">{result.originalSize} B</div><div className="l">Original</div></div>
            <div className="stat"><div className="n">{result.minSize} B</div><div className="l">Minified</div></div>
            <div className="stat"><div className="n" style={{ color: result.saved > 0 ? "var(--ok)" : "var(--muted)" }}>{result.saved}%</div><div className="l">Saved</div></div>
          </div>

          <div className="field">
            <label>Minified</label>
            <textarea readOnly value={result.min} style={{ minHeight: 100, fontFamily: "var(--font-mono), monospace", fontSize: ".82rem" }} />
            <button className="btn" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(result.min)}>Copy minified</button>
          </div>

          <div className="field">
            <label>Formatted</label>
            <textarea readOnly value={result.formatted} style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".82rem" }} />
            <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(result.formatted)}>Copy formatted</button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Runs in your browser — your CSS never leaves your device.</p>
    </div>
  );
}
