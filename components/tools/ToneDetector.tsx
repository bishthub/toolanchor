"use client";

import { useState, useMemo } from "react";

interface ToneScore {
  id: string;
  label: string;
  score: number;
  emoji: string;
  color: string;
}

const FORMAL_WORDS = new Set([
  "therefore", "however", "nevertheless", "furthermore", "consequently",
  "accordingly", "additionally", "moreover", "subsequently", "hence",
  "thus", "regarding", "pursuant", "commence", "terminate", "utilize",
  "endeavor", "ascertain", "facilitate", "expedite", "demonstrate",
  "establish", "determine", "indicate", "proceed", "required", "request",
  "proposal", "implementation", "approximately", "significant",
  "substantial", "sufficient", "notwithstanding", "hereinafter",
  "whereas", "whereby", "therein", "thereto", "henceforth",
]);

const CASUAL_WORDS = new Set([
  "hey", "hi", "hello", "yeah", "nah", "wanna", "gonna", "gotta",
  "awesome", "cool", "sure", "okay", "ok", "thanks", "thx", "btw",
  "lol", "lmao", "omg", "tbh", "imo", "ikr", "afk", "fyi",
  "literally", "basically", "actually", "honestly", "anyway",
  "super", "totally", "absolutely", "definitely", "pretty",
  "kinda", "sorta", "cmon", "dude", "buddy", "folks",
]);

const URGENT_WORDS = new Set([
  "urgent", "asap", "immediately", "now", "today", "deadline",
  "overdue", "critical", "emergency", "important", "priority",
  "hurry", "quick", "fast", "soon", "prompt", "expedite",
  "time-sensitive", "last-minute", "rush", "attention",
]);

const CONFIDENT_WORDS = new Set([
  "certain", "sure", "confident", "absolutely", "definitely",
  "undoubtedly", "clearly", "obviously", "always", "never",
  "must", "will", "guaranteed", "assured", "certainly",
  "without doubt", "of course", "naturally", "surely",
]);

function detectTone(text: string): ToneScore[] {
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  if (words.length === 0) return [];

  const total = words.length;

  const formalCount = words.filter(w => FORMAL_WORDS.has(w)).length;
  const casualCount = words.filter(w => CASUAL_WORDS.has(w)).length;
  const urgentCount = words.filter(w => URGENT_WORDS.has(w)).length;
  const confidentCount = words.filter(w => CONFIDENT_WORDS.has(w)).length;

  // Positive/negative from sentiment-like words
  const POSITIVE_WORDS = new Set(["good", "great", "excellent", "happy", "love", "wonderful", "beautiful", "amazing", "perfect", "best", "better", "thanks", "please", "help", "support", "pleased", "delighted", "grateful", "fantastic", "brilliant", "outstanding", "impressive", "enjoy", "glad", "positive", "optimistic", "hopeful", "success", "win", "benefit"]);
  const NEGATIVE_WORDS = new Set(["bad", "poor", "terrible", "hate", "awful", "wrong", "issue", "problem", "fail", "failed", "failure", "worst", "sad", "angry", "upset", "frustrated", "disappointed", "sorry", "difficult", "broken", "waste", "risk", "dangerous", "ugly", "horrible", "painful"]);

  const posCount = words.filter(w => POSITIVE_WORDS.has(w)).length;
  const negCount = words.filter(w => NEGATIVE_WORDS.has(w)).length;

  // Calculate sentence-level features
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = total / Math.max(1, sentences.length);
  // Formal writing tends to have longer sentences
  const formalSentenceBonus = avgSentenceLength > 20 ? 0.15 : 0;

  const tones: ToneScore[] = [
    {
      id: "formal",
      label: "Formal",
      score: Math.round(Math.min(1, (formalCount / Math.max(1, total * 0.08)) + formalSentenceBonus) * 100),
      emoji: "📋",
      color: "var(--accent)",
    },
    {
      id: "casual",
      label: "Casual",
      score: Math.round(Math.min(1, casualCount / Math.max(1, total * 0.06)) * 100),
      emoji: "💬",
      color: "#65a30d",
    },
    {
      id: "positive",
      label: "Positive",
      score: Math.round(Math.min(1, posCount / Math.max(1, total * 0.05)) * 100),
      emoji: "😊",
      color: "var(--ok)",
    },
    {
      id: "negative",
      label: "Negative",
      score: Math.round(Math.min(1, negCount / Math.max(1, total * 0.05)) * 100),
      emoji: "😟",
      color: "var(--danger)",
    },
    {
      id: "urgent",
      label: "Urgent",
      score: Math.round(Math.min(1, urgentCount / Math.max(1, total * 0.04)) * 100),
      emoji: "⚡",
      color: "#d9944b",
    },
    {
      id: "confident",
      label: "Confident",
      score: Math.round(Math.min(1, confidentCount / Math.max(1, total * 0.04)) * 100),
      emoji: "💪",
      color: "var(--accent)",
    },
    {
      id: "neutral",
      label: "Neutral",
      score: Math.round(Math.max(0, Math.min(100, 50 - (formalCount + casualCount + urgentCount + confidentCount + posCount + negCount) / total * 100))) * 2,
      emoji: "➖",
      color: "var(--muted)",
    },
  ];

  return tones.sort((a, b) => b.score - a.score);
}

export default function ToneDetector() {
  const [text, setText] = useState("");

  const tones = useMemo(() => detectTone(text), [text]);
  const dominant = tones[0];

  return (
    <div>
      <div className="field">
        <label>Text to analyse</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an email, social post or any text to detect its tone…"
          style={{ minHeight: 160 }}
        />
      </div>

      {tones.length > 0 && (
        <>
          {dominant && (
            <div className="stats">
              <div className="stat" style={{ gridColumn: "1 / -1" }}>
                <div className="n" style={{ fontSize: "1.8rem" }}>
                  {dominant.emoji} {dominant.label}
                </div>
                <div className="l">Dominant tone ({dominant.score}%)</div>
              </div>
            </div>
          )}

          <div className="field">
            <label>Tone breakdown</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tones.map((t) => (
                <div key={t.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: 4 }}>
                    <span style={{ fontWeight: 550 }}>{t.emoji} {t.label}</span>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".78rem", color: "var(--muted)" }}>{t.score}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${t.score}%`, height: "100%", background: t.color, borderRadius: 999, transition: "width .25s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 8 }}>
            <label>What this means</label>
            <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.6 }}>
              {dominant?.id === "formal" && "This text reads as formal and professional. Suitable for business communication."}
              {dominant?.id === "casual" && "This text reads as casual and conversational. Great for social media and informal chats."}
              {dominant?.id === "positive" && "This text has a positive, optimistic tone. Readers will feel encouraged."}
              {dominant?.id === "negative" && "This text leans negative. Consider softening language for a more neutral delivery."}
              {dominant?.id === "urgent" && "This text conveys urgency. Readers will feel pressure to act quickly."}
              {dominant?.id === "confident" && "This text comes across as confident and authoritative."}
              {dominant?.id === "neutral" && "This text is neutral and factual — no strong tone detected."}
            </p>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Tone detection runs entirely in your browser using linguistic analysis — no text is uploaded, no AI API is called.</p>
    </div>
  );
}
