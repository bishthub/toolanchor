// ─────────────────────────────────────────────────────────────────────────
// Stylometry + scoring — TypeScript port of the ai-detector-agent's local
// signal (detector/stylometry.js + detector/score.js). Zero dependencies,
// runs in the browser AND on the server, so it's the always-on baseline
// signal that never needs an API key.
// ─────────────────────────────────────────────────────────────────────────

const AI_PHRASES = [
  "in conclusion", "in summary", "to summarize", "to conclude", "in closing",
  "in brief", "in a nutshell", "to sum up", "all in all", "all things considered",
  "first and foremost", "last but not least", "needless to say", "it goes without saying",
  "it is important to note", "it's important to note", "it is worth noting", "it's worth noting",
  "it is worth mentioning", "it is essential to", "it's essential to", "it is crucial to",
  "it's crucial to", "it is clear that", "it is evident", "as mentioned", "as discussed",
  "as previously mentioned", "as we can see", "to put it simply", "simply put",
  "furthermore", "moreover", "additionally", "consequently", "nevertheless", "nonetheless",
  "on the other hand", "in contrast", "in this context", "in this regard",
  "delve into", "delving into", "let's dive", "dive deeper", "navigate the", "navigating the",
  "harness the power", "leverage the", "unlock the", "foster a", "cultivate a",
  "in today's", "in the realm of", "in the world of", "ever-evolving", "ever-changing",
  "landscape of", "tapestry of", "a testament to", "at its core", "in the context of",
  "one of the key", "one of the most important", "when it comes to", "in order to",
  "a wide range of", "a variety of", "in many cases", "in recent years",
  "the ability to", "the importance of", "the role of", "the need for", "the need to",
  "plays a crucial role", "plays a pivotal role", "plays a vital role", "plays a key role",
  "plays an important role", "this allows", "this ensures", "this enables", "this provides",
  "this helps", "this means", "this results in", "key takeaways", "cutting-edge",
  "state-of-the-art", "in essence", "ultimately,", "robust", "seamless",
];

const POWER_WORDS = new Set([
  "crucial", "pivotal", "vital", "essential", "significant", "fundamental", "comprehensive",
  "holistic", "robust", "seamless", "innovative", "transformative", "revolutionary",
  "foundational", "paradigm", "ecosystem", "synergy", "streamline", "empower", "impactful",
  "actionable", "scalable", "sustainable", "leverage", "optimize", "enhance", "facilitate",
  "implement", "integrate", "utilize", "maximize", "prioritize", "underscore", "highlight",
  "demonstrate", "illustrate", "emphasize", "ensure", "foster", "cultivate",
]);

const CONTRACTION_RE = /\b(i'm|i've|i'll|i'd|you're|you've|you'll|you'd|he's|he'll|he'd|she's|she'll|she'd|it's|it'll|we're|we've|we'll|we'd|they're|they've|they'll|they'd|that's|who's|what's|where's|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|won't|wouldn't|can't|couldn't|shouldn't|don't|doesn't|didn't|let's|here's|there's|could've|would've|should've|might've|must've)\b/gi;

export function splitSentences(text: string): string[] {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
export function tokenize(text: string): string[] {
  return String(text || "").toLowerCase().match(/[a-z0-9']+/g) || [];
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function stddev(a: number[]) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
}

function burstinessScore(sentences: string[]) {
  if (sentences.length < 3) return 50;
  const lens = sentences.map((s) => s.split(/\s+/).length);
  const cv = mean(lens) > 0 ? stddev(lens) / mean(lens) : 0;
  return Math.max(0, Math.min(100, (0.6 - cv) * (100 / 0.35)));
}
function vocabularyScore(tokens: string[]) {
  if (tokens.length < 50) return 50;
  const win = 50, ttrs: number[] = [];
  for (let i = 0; i + win <= tokens.length; i += 10) ttrs.push(new Set(tokens.slice(i, i + win)).size / win);
  const m = mean(ttrs), sd = stddev(ttrs);
  let s = 0;
  if (m >= 0.58 && m <= 0.8) s += 50;
  if (sd < 0.05) s += 50;
  return s;
}
function phraseScore(text: string) {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const p of AI_PHRASES) {
    const m = lower.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
    if (m) hits += m.length;
  }
  const wc = (text.match(/\S+/g) || []).length || 1;
  return Math.max(0, Math.min(100, (hits / wc) * 1000 * 33));
}
function contractionScore(text: string) {
  const wc = (text.match(/\S+/g) || []).length || 1;
  const c = (text.match(CONTRACTION_RE) || []).length;
  return Math.max(0, Math.min(100, 100 - (c / wc) * 1000 * 12.5));
}
function powerWordScore(text: string) {
  const tokens = tokenize(text);
  if (!tokens.length) return 50;
  const hits = tokens.filter((w) => POWER_WORDS.has(w)).length;
  return Math.max(0, Math.min(100, (hits / tokens.length) * 1000 * 20));
}
function starterScore(sentences: string[]) {
  if (sentences.length < 5) return 0;
  const counts: Record<string, number> = {};
  for (const s of sentences) {
    const w = (s.split(/\s+/)[0] || "").toLowerCase();
    counts[w] = (counts[w] || 0) + 1;
  }
  const max = Math.max(...Object.values(counts));
  return Math.max(0, Math.min(100, (max / sentences.length - 0.15) * 400));
}

export interface StylometryResult {
  score: number;
  features: Record<string, number>;
}

export function analyzeStylometry(text: string): StylometryResult {
  const sentences = splitSentences(text);
  const tokens = tokenize(text);
  const burst = burstinessScore(sentences);
  const vocab = vocabularyScore(tokens);
  const phrases = phraseScore(text);
  const contractions = contractionScore(text);
  const power = powerWordScore(text);
  const starter = starterScore(sentences);
  const score = burst * 0.2 + vocab * 0.12 + phrases * 0.18 + contractions * 0.28 + power * 0.14 + starter * 0.08;
  return {
    score: Math.round(score * 10) / 10,
    features: {
      burstiness: Math.round(burst), vocabulary: Math.round(vocab), ai_phrases: Math.round(phrases),
      contractions: Math.round(contractions), power_words: Math.round(power),
      starter_monotony: Math.round(starter), sentence_count: sentences.length, word_count: tokens.length,
    },
  };
}

export function verdictFor(score: number | null): string {
  if (score == null) return "unknown";
  if (score >= 75) return "ai";
  if (score >= 55) return "likely_ai";
  if (score >= 40) return "mixed";
  if (score >= 20) return "likely_human";
  return "human";
}

export const VERDICT_LABEL: Record<string, string> = {
  ai: "AI-generated", likely_ai: "Likely AI", mixed: "Mixed / uncertain",
  likely_human: "Likely human", human: "Human-written", unknown: "Unknown",
};

export interface Signal { name: string; score: number; weight: number; }

/** Blend signals; redistribute weight of any missing signal to the rest. */
export function blendSignals(signals: Signal[]): { score: number | null; weights_used: Record<string, number> } {
  const parts = signals.filter((s) => typeof s.score === "number" && !isNaN(s.score));
  if (!parts.length) return { score: null, weights_used: {} };
  const totalW = parts.reduce((a, b) => a + b.weight, 0);
  const blended = parts.reduce((sum, p) => sum + p.score * (p.weight / totalW), 0);
  const weights_used: Record<string, number> = {};
  for (const p of parts) weights_used[p.name] = Math.round((p.weight / totalW) * 100) / 100;
  return { score: Math.round(blended * 10) / 10, weights_used };
}

const AI_HINTS: { label: string; re: RegExp }[] = [
  { label: "formulaic-transition", re: /\b(in conclusion|in summary|moreover|furthermore|additionally|however,)\b/i },
  { label: "hedge-phrase", re: /\b(it'?s? (important|worth) (to note|noting))\b/i },
  { label: "ai-verb", re: /\b(delve|delving|navigate|navigating)\s+(into|the)\b/i },
  { label: "ai-cliche", re: /\b(ever-?evolving|ever-?changing|landscape of|tapestry of|testament to)\b/i },
  { label: "ai-cliche", re: /\b(plays? a (crucial|pivotal|key) role)\b/i },
  { label: "ai-verb", re: /\b(harness|leverage)\s+the\b/i },
  { label: "em-dash", re: /—/ },
];

export interface Flagged { index: number; text: string; signals: string[]; }

export function flaggedSentences(text: string): Flagged[] {
  const sentences = splitSentences(text);
  if (sentences.length < 3) return [];
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLen = mean(lengths);
  return sentences
    .map((s, idx) => {
      let score = 0;
      const reasons = new Set<string>();
      for (const { label, re } of AI_HINTS) if (re.test(s)) { score += 25; reasons.add(label); }
      const wc = s.split(/\s+/).length;
      if (wc > avgLen * 0.85 && wc < avgLen * 1.15 && Math.abs(wc - avgLen) < 4) { score += 10; reasons.add("uniform-length"); }
      return { index: idx, text: s, score, signals: [...reasons] };
    })
    .filter((x) => x.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ index, text, signals }) => ({ index, text, signals }));
}
