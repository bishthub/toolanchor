"use client";

import { useMemo, useState } from "react";
import { analyzeStylometry, verdictFor, VERDICT_LABEL, flaggedSentences } from "@/lib/stylometry";

interface DeepResult {
  ai_score: number | null;
  verdict: string;
  providers: Record<string, boolean>;
  weights_used: Record<string, number>;
  breakdown: {
    stylometry: { score: number; features: Record<string, number> };
    gemini: { score: number; signals: string[] } | null;
    groq: { score: number; signals: string[] } | null;
    huggingface: { score: number } | null;
  };
  flagged_sentences: { index: number; text: string; signals: string[] }[];
  quota: { used: number; daily_free: number; remaining: number } | null;
  error?: string;
}

function scoreColor(s: number | null) {
  if (s == null) return "var(--muted)";
  return s >= 55 ? "#ff6b6b" : s >= 40 ? "#ffce5c" : "var(--ok, #4fe0a6)";
}

export default function AiContentDetector() {
  const [text, setText] = useState("");
  const [deep, setDeep] = useState<DeepResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const wc = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const local = useMemo(() => (wc >= 40 ? analyzeStylometry(text) : null), [text, wc]);
  const localFlags = useMemo(() => (wc >= 40 ? flaggedSentences(text) : []), [text, wc]);
  const localVerdict = local ? verdictFor(local.score) : null;

  async function runDeep() {
    setBusy(true); setErr(null); setDeep(null);
    try {
      const r = await fetch("/api/ai-detect", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) { setErr(data.error || "Something went wrong."); return; }
      setDeep(data);
    } catch {
      setErr("Could not reach the analysis service.");
    } finally { setBusy(false); }
  }

  const shown = deep?.ai_score ?? local?.score ?? null;
  const verdict = deep?.verdict ?? localVerdict ?? "unknown";
  const features = deep?.breakdown.stylometry.features ?? local?.features;
  const flags = deep?.flagged_sentences ?? localFlags;

  return (
    <div>
      <div className="field">
        <label>Paste text to analyse (40+ words for the quick check, 200+ chars for deep AI analysis)</label>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setDeep(null); }} placeholder="Paste an essay, article or paragraph…" style={{ minHeight: 200 }} />
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 6 }}>{wc} words</p>
      </div>

      {shown != null && (
        <>
          <div className="stat" style={{ borderTop: `3px solid ${scoreColor(shown)}` }}>
            <div className="n" style={{ color: scoreColor(shown) }}>{shown}%</div>
            <div className="l">AI-likelihood · {VERDICT_LABEL[verdict] ?? verdict}{deep ? " · deep analysis" : " · quick check"}</div>
          </div>

          {features && (
            <div className="stats">
              <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{features.burstiness}</div><div className="l">Burstiness</div></div>
              <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{features.contractions}</div><div className="l">Contraction signal</div></div>
              <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{features.ai_phrases}</div><div className="l">AI phrases</div></div>
              <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{features.power_words}</div><div className="l">Power words</div></div>
            </div>
          )}

          {/* Deep analysis per-signal breakdown */}
          {deep && (
            <div className="stats" style={{ marginTop: 12 }}>
              {deep.breakdown.huggingface && <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{deep.breakdown.huggingface.score}%</div><div className="l">HuggingFace</div></div>}
              {deep.breakdown.gemini && <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{deep.breakdown.gemini.score}%</div><div className="l">Gemini judge</div></div>}
              {deep.breakdown.groq && <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{deep.breakdown.groq.score}%</div><div className="l">Groq judge</div></div>}
              <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{deep.breakdown.stylometry.score}%</div><div className="l">Stylometry</div></div>
            </div>
          )}

          {flags.length > 0 && (
            <div className="field" style={{ marginTop: 14 }}>
              <label>Most AI-like sentences</label>
              <ul className="file-list">
                {flags.map((f) => (
                  <li key={f.index} style={{ display: "block" }}>
                    <span style={{ fontSize: ".9rem" }}>{f.text}</span>
                    <span style={{ display: "block", color: "var(--muted)", fontSize: ".75rem", marginTop: 4 }}>{f.signals.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Deep analysis trigger */}
      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={runDeep} disabled={busy || wc < 30}>
          {busy ? "Analysing with AI…" : "🤖 Run deep AI analysis"}
        </button>
        {deep?.providers && (
          <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
            Signals used: {Object.entries(deep.providers).filter(([, on]) => on).map(([k]) => k).join(", ")}
            {deep.quota && ` · ${deep.quota.remaining}/${deep.quota.daily_free} free checks left today`}
          </p>
        )}
        {err && <p style={{ color: "#ff6b6b", marginTop: 8 }}>{err}</p>}
      </div>

      <div style={{ background: "var(--accent-soft, rgba(124,140,255,.14))", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginTop: 16, fontSize: ".85rem", color: "var(--muted)" }}>
        ⚠️ <strong style={{ color: "var(--text)" }}>A guide, not proof.</strong> No detector is fully reliable; all produce false positives. The <strong style={{ color: "var(--text)" }}>quick check</strong> runs privately in your browser. <strong style={{ color: "var(--text)" }}>Deep AI analysis</strong> sends your text to our AI models (Gemini/Groq) for a more accurate, blended score. Never use any result alone to accuse someone.
      </div>
      <p className="privacy-note">🔒 Quick check is 100% in-browser. Deep analysis is opt-in and clearly labelled.</p>
    </div>
  );
}
