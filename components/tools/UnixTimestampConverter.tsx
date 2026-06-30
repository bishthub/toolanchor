"use client";

import { useState } from "react";

function fromTimestamp(input: string) {
  const raw = input.trim();
  if (!/^\d+$/.test(raw)) return null;
  // 13+ digits → milliseconds, otherwise seconds.
  const ms = raw.length >= 13 ? Number(raw) : Number(raw) * 1000;
  const d = new Date(ms);
  if (isNaN(+d)) return null;
  return { local: d.toString(), utc: d.toUTCString(), iso: d.toISOString() };
}

export default function UnixTimestampConverter() {
  const [ts, setTs] = useState("");
  const [dt, setDt] = useState(""); // datetime-local value

  const decoded = ts ? fromTimestamp(ts) : null;
  const encoded = dt ? Math.floor(new Date(dt).getTime() / 1000) : null;

  return (
    <div>
      <div className="field">
        <label>Unix timestamp → date</label>
        <input className="input" value={ts} onChange={(e) => setTs(e.target.value)} placeholder="e.g. 1751328000" style={{ fontFamily: "monospace" }} />
      </div>
      {ts && !decoded && <p style={{ color: "#ff6b6b" }}>Enter a numeric timestamp (seconds or milliseconds).</p>}
      {decoded && (
        <div className="stats" style={{ gridTemplateColumns: "1fr" }}>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{decoded.local}</div><div className="l">Local time</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{decoded.utc}</div><div className="l">UTC</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem", fontFamily: "monospace" }}>{decoded.iso}</div><div className="l">ISO 8601</div></div>
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "22px 0" }} />

      <div className="field">
        <label>Date → Unix timestamp</label>
        <input type="datetime-local" className="input" value={dt} onChange={(e) => setDt(e.target.value)} />
      </div>
      {encoded !== null && Number.isFinite(encoded) && (
        <div className="stats">
          <div className="stat"><div className="n" style={{ fontFamily: "monospace" }}>{encoded}</div><div className="l">Seconds</div></div>
          <div className="stat"><div className="n" style={{ fontFamily: "monospace" }}>{encoded * 1000}</div><div className="l">Milliseconds</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
