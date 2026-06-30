import { NextRequest, NextResponse } from "next/server";
import {
  analyzeStylometry, blendSignals, verdictFor, flaggedSentences, type Signal,
} from "@/lib/stylometry";

export const runtime = "nodejs";

// ── Generous free quota, per IP, per day ─────────────────────────────────
// In-memory — fine for a single Node instance. For multi-instance/serverless
// production, swap this for Redis/Upstash. Resets on redeploy.
const DAILY_FREE = Number(process.env.AI_DETECT_DAILY_FREE || 50);
const MIN_CHARS = 200;
const MAX_CHARS = 50000;
const hits = new Map<string, { day: string; count: number }>();

function quota(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip);
  if (!rec || rec.day !== day) { hits.set(ip, { day, count: 0 }); return { used: 0, day }; }
  return { used: rec.count, day };
}
function bump(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip) ?? { day, count: 0 };
  rec.count += 1; rec.day = day; hits.set(ip, rec);
}

const JUDGE_SYSTEM = `You are an expert forensic linguist specializing in detecting AI-generated content. Analyze the provided text and return your assessment as JSON.

AI-GENERATED text strongly exhibits: consistent moderate sentence length (low variance); avoids contractions; transition-heavy ("furthermore", "moreover", "in conclusion", "it is worth noting"); structural perfection; power-word overuse ("crucial", "pivotal", "robust", "leverage", "ensure", "utilize"); exhaustive but superficial coverage; neutral non-committal tone; no typos or personality; AI phrase patterns ("plays a crucial role", "a testament to", "ever-evolving landscape", "delve into", "at its core").

HUMAN text strongly exhibits: wild sentence-length variation; natural contractions; personal anecdotes and specific names/dates; digressions and tangents; strong opinions and emotion; imperfect grammar; domain-specific or quirky vocabulary; inconsistent structure.

Return ONLY valid JSON, no prose or code fences:
{"ai_probability": <integer 0-100>, "top_signals": ["signal1","signal2","signal3"]}
0-20=clearly human, 21-40=likely human, 41-60=mixed, 61-80=likely AI, 81-100=clearly AI.`;

function excerptOf(text: string): string {
  if (text.length <= 4000) return text;
  const half = Math.floor(text.length / 2);
  return text.slice(0, 2200) + "\n\n[...]\n\n" + text.slice(half, half + 1800);
}

function parseJudge(raw: string | null): { score: number; signals: string[] } | null {
  if (!raw) return null;
  let parsed: { ai_probability?: number; top_signals?: string[] } | null = null;
  try { parsed = JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
  }
  const prob = Number(parsed?.ai_probability);
  if (isNaN(prob) || prob < 0 || prob > 100) return null;
  return { score: Math.round(prob * 10) / 10, signals: Array.isArray(parsed?.top_signals) ? parsed!.top_signals! : [] };
}

// ── Providers (each returns null if no key / on failure → graceful degrade) ─
async function geminiJudge(text: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: JUDGE_SYSTEM }] },
        contents: [{ parts: [{ text: `Analyze this text and return JSON:\n\n---\n${excerptOf(text)}\n---` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 250 },
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return parseJudge(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null);
  } catch { return null; }
}

async function groqJudge(text: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, temperature: 0.1, max_tokens: 250, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: JUDGE_SYSTEM },
          { role: "user", content: `Analyze this text and return JSON:\n\n---\n${excerptOf(text)}\n---` },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return parseJudge(data?.choices?.[0]?.message?.content ?? null);
  } catch { return null; }
}

// HuggingFace AI-text classifier (free tier). Returns 0-100 "fake/AI" prob.
async function hfClassifier(text: string) {
  const key = process.env.HF_API_KEY;
  if (!key) return null;
  const model = process.env.HF_MODEL || "Hello-SimpleAI/chatgpt-detector-roberta";
  try {
    const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ inputs: text.slice(0, 4000), options: { wait_for_model: true } }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const arr = Array.isArray(data?.[0]) ? data[0] : data;
    if (!Array.isArray(arr)) return null;
    // Find the "AI/fake/chatgpt" label probability.
    const ai = arr.find((x: { label?: string }) => /fake|chatgpt|ai|machine|generated|label_?1/i.test(x.label || ""));
    if (!ai || typeof ai.score !== "number") return null;
    return { score: Math.round(ai.score * 1000) / 10, signals: [] as string[] };
  } catch { return null; }
}

function ipOf(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0].trim()) || req.headers.get("x-real-ip") || "anon";
}

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const text = (body.text || "").trim();
  if (text.length < MIN_CHARS) return NextResponse.json({ error: `Please provide at least ${MIN_CHARS} characters for a reliable result.` }, { status: 400 });
  const truncated = text.length > MAX_CHARS;
  const input = truncated ? text.slice(0, MAX_CHARS) : text;

  const ip = ipOf(req);
  const { used } = quota(ip);
  const usesAI = !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.HF_API_KEY);
  if (usesAI && used >= DAILY_FREE) {
    return NextResponse.json({ error: "Daily free limit reached. Try again tomorrow.", quota: { used, daily_free: DAILY_FREE, remaining: 0 } }, { status: 429 });
  }

  const sty = analyzeStylometry(input);
  const [gemini, groq, hf] = await Promise.all([geminiJudge(input), groqJudge(input), hfClassifier(input)]);

  const signals: Signal[] = [{ name: "stylometry", score: sty.score, weight: 0.15 }];
  if (hf) signals.push({ name: "huggingface", score: hf.score, weight: 0.35 });
  if (gemini) signals.push({ name: "gemini", score: gemini.score, weight: 0.3 });
  if (groq) signals.push({ name: "groq", score: groq.score, weight: 0.2 });

  const { score, weights_used } = blendSignals(signals);
  const usedAnyLLM = !!(gemini || groq || hf);
  if (usedAnyLLM) bump(ip);
  const after = quota(ip);

  return NextResponse.json({
    ai_score: score,
    verdict: verdictFor(score),
    word_count: sty.features.word_count,
    truncated,
    providers: { gemini: !!gemini, groq: !!groq, huggingface: !!hf, stylometry: true },
    weights_used,
    breakdown: {
      stylometry: { score: sty.score, features: sty.features },
      gemini: gemini || null,
      groq: groq || null,
      huggingface: hf || null,
    },
    flagged_sentences: flaggedSentences(input),
    quota: usesAI ? { used: after.used, daily_free: DAILY_FREE, remaining: Math.max(0, DAILY_FREE - after.used) } : null,
  });
}
