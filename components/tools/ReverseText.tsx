"use client";

import { useState } from "react";

type Mode = "chars" | "words" | "lines";

// Unicode-aware character split so emoji/combined glyphs survive reversal.
function splitChars(s: string): string[] {
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
}

export default function ReverseText() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("chars");
  const [copied, setCopied] = useState(false);

  function result(): string {
    if (mode === "chars") return splitChars(text).reverse().join("");
    if (mode === "words") return text.split(/(\s+)/).reverse().join("");
    return text.split(/\r?\n/).reverse().join("\n");
  }
  const out = result();

  async function copy() {
    await navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" />
      </div>
      <div className="field">
        <label>Reverse by</label>
        <div className="row">
          {(["chars", "words", "lines"] as const).map((m) => (
            <button key={m} type="button" className={`btn ${mode === m ? "" : "secondary"}`} onClick={() => setMode(m)}>
              {m === "chars" ? "Characters" : m === "words" ? "Words" : "Lines"}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Result</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy result"}</button>
      <p className="privacy-note">🔒 Runs locally in your browser.</p>
    </div>
  );
}
