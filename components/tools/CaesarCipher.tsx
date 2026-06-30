"use client";

import { useState } from "react";

function shift(text: string, by: number): string {
  const s = ((by % 26) + 26) % 26;
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
  });
}

export default function CaesarCipher() {
  const [text, setText] = useState("");
  const [amount, setAmount] = useState(3);
  const [decode, setDecode] = useState(false);
  const [copied, setCopied] = useState(false);

  const out = shift(text, decode ? -amount : amount);

  async function copy() { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Shift: {amount}{amount === 13 ? " (ROT13)" : ""}</label>
          <input type="range" min={1} max={25} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div className="field">
          <div className="row">
            <button type="button" className={`btn ${!decode ? "" : "secondary"}`} onClick={() => setDecode(false)}>Encode</button>
            <button type="button" className={`btn ${decode ? "" : "secondary"}`} onClick={() => setDecode(true)}>Decode</button>
            <button type="button" className="btn secondary" onClick={() => setAmount(13)}>ROT13</button>
          </div>
        </div>
      </div>
      <div className="field">
        <label>Output</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy output"}</button>
      <p className="privacy-note">🔒 Runs locally. Note: the Caesar cipher is for fun/puzzles, not real security.</p>
    </div>
  );
}
