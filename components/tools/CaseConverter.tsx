"use client";

import { useState } from "react";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

const transforms: { label: string; fn: (s: string) => string }[] = [
  { label: "UPPERCASE", fn: (s) => s.toUpperCase() },
  { label: "lowercase", fn: (s) => s.toLowerCase() },
  { label: "Title Case", fn: (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) },
  { label: "Sentence case", fn: (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()) },
  { label: "camelCase", fn: (s) => words(s).map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join("") },
  { label: "snake_case", fn: (s) => words(s).map((w) => w.toLowerCase()).join("_") },
  { label: "kebab-case", fn: (s) => words(s).map((w) => w.toLowerCase()).join("-") },
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  function apply(fn: (s: string) => string) {
    setText(fn(text));
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="field">
        <label>Your text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" />
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        {transforms.map((t) => (
          <button key={t.label} type="button" className="btn secondary" onClick={() => apply(t.fn)}>
            {t.label}
          </button>
        ))}
      </div>

      <button className="btn" onClick={copy} disabled={!text}>
        {copied ? "✓ Copied" : "Copy result"}
      </button>

      <p className="privacy-note">🔒 Conversion happens in your browser — text is never uploaded.</p>
    </div>
  );
}
