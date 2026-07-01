"use client";

import { useState } from "react";
import { usePreset } from "@/lib/preset";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

const transforms: { label: string; mode: string; fn: (s: string) => string }[] = [
  { label: "UPPERCASE", mode: "upper", fn: (s) => s.toUpperCase() },
  { label: "lowercase", mode: "lower", fn: (s) => s.toLowerCase() },
  { label: "Title Case", mode: "title", fn: (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) },
  { label: "Sentence case", mode: "sentence", fn: (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()) },
  { label: "camelCase", mode: "camel", fn: (s) => words(s).map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join("") },
  { label: "snake_case", mode: "snake", fn: (s) => words(s).map((w) => w.toLowerCase()).join("_") },
  { label: "kebab-case", mode: "kebab", fn: (s) => words(s).map((w) => w.toLowerCase()).join("-") },
];

export default function CaseConverter({
  preset,
}: {
  initialFiles?: File[];
  preset?: Record<string, string>;
}) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  // Preset / deep-link mode (e.g. ?mode=upper) — converts live as you type.
  const presetValues = usePreset(preset, ["mode"]);
  const presetTransform = transforms.find((t) => t.mode === presetValues?.mode) ?? null;
  const output = presetTransform ? presetTransform.fn(text) : null;

  function apply(fn: (s: string) => string) {
    setText(fn(text));
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(output ?? text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {presetTransform && (
        <p className="preset-note">
          Preset active: text converts to <strong>{presetTransform.label}</strong> as you type.
        </p>
      )}

      <div className="field">
        <label>Your text</label>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setCopied(false); }} placeholder="Type or paste text…" />
      </div>

      {presetTransform ? (
        <div className="field">
          <label>{presetTransform.label} result</label>
          <textarea value={output ?? ""} readOnly placeholder="Result appears here…" />
        </div>
      ) : (
        <div className="row" style={{ marginBottom: 14 }}>
          {transforms.map((t) => (
            <button key={t.label} type="button" className="btn secondary" onClick={() => apply(t.fn)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <button className="btn" onClick={copy} disabled={!(output ?? text)}>
        {copied ? "✓ Copied" : "Copy result"}
      </button>

      <p className="privacy-note">🔒 Conversion happens in your browser — text is never uploaded.</p>
    </div>
  );
}
