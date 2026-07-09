"use client";

import { useState } from "react";

const PRESET_LIMITS = [
  { label: "Twitter/X", value: 280, color: "var(--accent)" },
  { label: "SEO title", value: 60, color: "#d9944b" },
  { label: "SEO desc", value: 160, color: "var(--ok)" },
  { label: "SMS", value: 160, color: "var(--muted)" },
];

export default function CharacterCounter() {
  const [text, setText] = useState("");
  const [activeLimit, setActiveLimit] = useState<number | null>(null);

  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text ? text.split(/[.!?]+\s*/).filter(Boolean).length : 0;
  const paragraphs = text ? text.split(/\n\s*\n/).filter(Boolean).length : 0;

  return (
    <div>
      <div className="field">
        <label>Your text</label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setActiveLimit(null); }}
          placeholder="Type or paste your text here…"
          style={{ minHeight: 200, fontSize: "1rem" }}
        />
      </div>

      <div className="field">
        <label>Preset limits</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRESET_LIMITS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={activeLimit === p.value ? "btn" : "btn secondary"}
              style={{ padding: "6px 12px", fontSize: ".8rem" }}
              onClick={() => setActiveLimit(p.value === activeLimit ? null : p.value)}
            >
              {p.label} ({p.value})
            </button>
          ))}
        </div>
        {activeLimit !== null && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden", maxWidth: 300 }}>
              <div
                style={{
                  width: `${Math.min(100, (charsWithSpaces / activeLimit) * 100)}%`,
                  height: "100%",
                  background: charsWithSpaces > activeLimit ? "var(--danger)" : charsWithSpaces > activeLimit * 0.9 ? "#d9944b" : "var(--accent)",
                  borderRadius: 999,
                  transition: "width .15s",
                }}
              />
            </div>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".82rem", color: charsWithSpaces > activeLimit ? "var(--danger)" : "var(--muted)" }}>
              {charsWithSpaces} / {activeLimit}
            </span>
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <div className="n">{charsWithSpaces}</div>
          <div className="l">Characters (with spaces)</div>
        </div>
        <div className="stat">
          <div className="n">{charsWithoutSpaces}</div>
          <div className="l">Characters (no spaces)</div>
        </div>
        <div className="stat">
          <div className="n">{words}</div>
          <div className="l">Words</div>
        </div>
        <div className="stat">
          <div className="n">{sentences}</div>
          <div className="l">Sentences</div>
        </div>
        <div className="stat">
          <div className="n">{paragraphs}</div>
          <div className="l">Paragraphs</div>
        </div>
      </div>

      <p className="privacy-note">🔒 Everything runs in your browser — nothing is uploaded. Great for checking Twitter/X, SEO and SMS character limits.</p>
    </div>
  );
}
