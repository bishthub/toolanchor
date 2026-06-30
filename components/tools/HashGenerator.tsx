"use client";

import { useEffect, useState } from "react";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

async function hash(text: string, algo: Algo): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [algo, setAlgo] = useState<Algo>("SHA-256");
  const [digest, setDigest] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!text) { setDigest(""); return; }
    hash(text, algo).then((h) => { if (!cancelled) setDigest(h); });
    return () => { cancelled = true; };
  }, [text, algo]);

  async function copy() {
    if (!digest) return;
    await navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Text to hash</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" />
      </div>
      <div className="field">
        <label>Algorithm</label>
        <div className="row">
          {ALGOS.map((a) => (
            <button key={a} type="button" className={`btn ${algo === a ? "" : "secondary"}`} onClick={() => setAlgo(a)}>{a}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>{algo} digest (hex)</label>
        <textarea readOnly value={digest} className="mono" style={{ minHeight: 90 }} />
      </div>
      <button className="btn" onClick={copy} disabled={!digest}>{copied ? "✓ Copied" : "Copy hash"}</button>
      <p className="privacy-note">🔒 Hashed locally with the Web Crypto API — nothing is uploaded.</p>
    </div>
  );
}
