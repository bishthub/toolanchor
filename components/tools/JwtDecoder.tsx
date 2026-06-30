"use client";

import { useState } from "react";

function decodeSegment(seg: string): string {
  // base64url → base64, then UTF-8 decode.
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(seg.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.stringify(JSON.parse(json), null, 2);
}

function expiryNote(payload: string): string | null {
  try {
    const obj = JSON.parse(payload);
    if (typeof obj.exp === "number") {
      const d = new Date(obj.exp * 1000);
      const expired = obj.exp * 1000 < new Date("2026-07-01").getTime();
      return `Expires: ${d.toUTCString()}${expired ? " (note: compare against current time)" : ""}`;
    }
  } catch { /* ignore */ }
  return null;
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  let header = "", payload = "", error: string | null = null, note: string | null = null;

  if (token.trim()) {
    const parts = token.trim().split(".");
    if (parts.length < 2) {
      error = "A JWT should have at least two dot-separated parts (header.payload).";
    } else {
      try {
        header = decodeSegment(parts[0]);
        payload = decodeSegment(parts[1]);
        note = expiryNote(payload);
      } catch {
        error = "Could not decode this token — check that it's a valid JWT.";
      }
    }
  }

  return (
    <div>
      <div className="field">
        <label>Paste a JWT</label>
        <textarea value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJhbGciOi…" className="mono" />
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {header && (
        <div className="field">
          <label>Header</label>
          <textarea readOnly value={header} className="mono" style={{ minHeight: 110 }} />
        </div>
      )}
      {payload && (
        <div className="field">
          <label>Payload</label>
          <textarea readOnly value={payload} className="mono" style={{ minHeight: 160 }} />
          {note && <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>{note}</p>}
        </div>
      )}

      <p className="privacy-note">🔒 Decoded locally — your token never leaves your browser. Signature is not verified.</p>
    </div>
  );
}
