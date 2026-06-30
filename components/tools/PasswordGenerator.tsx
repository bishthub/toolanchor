"use client";

import { useCallback, useEffect, useState } from "react";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

function secureRandomIndex(max: number): number {
  // Rejection sampling for an unbiased index in [0, max).
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  let v = 0;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % max;
}

function strengthLabel(len: number, pools: number): string {
  const score = len * pools;
  if (score < 40) return "Weak";
  if (score < 80) return "Fair";
  if (score < 140) return "Strong";
  return "Very strong";
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const pool = Object.entries(opts)
      .filter(([, on]) => on)
      .map(([k]) => SETS[k as keyof typeof SETS])
      .join("");
    if (!pool) { setPassword(""); return; }
    let out = "";
    for (let i = 0; i < length; i++) out += pool[secureRandomIndex(pool.length)];
    setPassword(out);
    setCopied(false);
  }, [length, opts]);

  useEffect(() => { generate(); }, [generate]);

  async function copy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const activePools = Object.values(opts).filter(Boolean).length;

  return (
    <div>
      <div className="field">
        <label>Generated password</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="input" readOnly value={password} style={{ fontFamily: "monospace", flex: 1, minWidth: 200 }} />
          <button className="btn" onClick={copy} disabled={!password}>{copied ? "✓ Copied" : "Copy"}</button>
        </div>
        {password && (
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>
            Strength: <strong style={{ color: "var(--text)" }}>{strengthLabel(length, activePools)}</strong>
          </p>
        )}
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label>Length: {length}</label>
        <input type="range" min={6} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div className="field">
        <label>Include</label>
        <div className="row">
          {(["lower", "upper", "digits", "symbols"] as const).map((k) => (
            <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
              <input
                type="checkbox"
                checked={opts[k]}
                onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))}
              />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <button className="btn" onClick={generate}>↻ Generate new</button>
      <p className="privacy-note">🔒 Generated locally with the Web Crypto API — never transmitted or stored.</p>
    </div>
  );
}
