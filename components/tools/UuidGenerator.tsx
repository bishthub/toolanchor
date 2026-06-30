"use client";

import { useState } from "react";

function genUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback for older browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, genUuid));
  const [copied, setCopied] = useState<string | null>(null);

  function generate() {
    setUuids(Array.from({ length: Math.min(Math.max(count, 1), 500) }, genUuid));
  }
  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>How many (1–500)</label>
          <input type="number" className="input" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
        <div className="field" style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={generate}>Generate</button>
          <button className="btn secondary" onClick={() => copy(uuids.join("\n"), "all")}>
            {copied === "all" ? "✓ Copied all" : "Copy all"}
          </button>
        </div>
      </div>

      <ul className="file-list" style={{ marginTop: 8 }}>
        {uuids.map((u, i) => (
          <li key={i}>
            <code style={{ fontFamily: "monospace" }}>{u}</code>
            <span className="x" onClick={() => copy(u, `u${i}`)} title="Copy" style={{ marginLeft: "auto" }}>
              {copied === `u${i}` ? "✓" : "📋"}
            </span>
          </li>
        ))}
      </ul>

      <p className="privacy-note">🔒 Generated locally with the Web Crypto API — nothing leaves your browser.</p>
    </div>
  );
}
