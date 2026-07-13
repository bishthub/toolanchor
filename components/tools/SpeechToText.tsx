"use client";

import { useEffect, useRef, useState } from "react";

const LOCALES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "es-ES", label: "Español (España)" },
  { code: "es-MX", label: "Español (México)" },
  { code: "es-AR", label: "Español (Argentina)" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "fr-CA", label: "Français (Canada)" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "pl-PL", label: "Polski" },
  { code: "ru-RU", label: "Русский (Russian)" },
  { code: "uk-UA", label: "Українська (Ukrainian)" },
  { code: "tr-TR", label: "Türkçe" },
  { code: "ar-SA", label: "العربية (السعودية)" },
  { code: "ar-EG", label: "العربية (مصر)" },
  { code: "he-IL", label: "עברית (Hebrew)" },
  { code: "fa-IR", label: "فارسی (Persian)" },
  { code: "ur-PK", label: "اردو (Urdu)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "zh-CN", label: "中文（简体）Mandarin" },
  { code: "zh-TW", label: "中文（繁體）Taiwan" },
  { code: "zh-HK", label: "中文（香港）" },
  { code: "yue-Hant-HK", label: "粵語 Cantonese (HK)" },
  { code: "ja-JP", label: "日本語 (Japanese)" },
  { code: "ko-KR", label: "한국어 (Korean)" },
  { code: "th-TH", label: "ไทย (Thai)" },
  { code: "vi-VN", label: "Tiếng Việt (Vietnamese)" },
  { code: "id-ID", label: "Bahasa Indonesia" },
  { code: "ms-MY", label: "Bahasa Melayu" },
  { code: "fil-PH", label: "Filipino" },
  { code: "sv-SE", label: "Svenska (Swedish)" },
  { code: "no-NO", label: "Norsk (Norwegian)" },
  { code: "da-DK", label: "Dansk (Danish)" },
  { code: "fi-FI", label: "Suomi (Finnish)" },
  { code: "cs-CZ", label: "Čeština (Czech)" },
  { code: "sk-SK", label: "Slovenčina (Slovak)" },
  { code: "hu-HU", label: "Magyar (Hungarian)" },
  { code: "ro-RO", label: "Română (Romanian)" },
  { code: "bg-BG", label: "Български (Bulgarian)" },
  { code: "hr-HR", label: "Hrvatski (Croatian)" },
  { code: "sr-RS", label: "Српски (Serbian)" },
  { code: "el-GR", label: "Ελληνικά (Greek)" },
  { code: "lt-LT", label: "Lietuvių (Lithuanian)" },
  { code: "lv-LV", label: "Latviešu (Latvian)" },
  { code: "et-EE", label: "Eesti (Estonian)" },
  { code: "sl-SI", label: "Slovenščina (Slovenian)" },
  { code: "ca-ES", label: "Català (Catalan)" },
  { code: "af-ZA", label: "Afrikaans" },
  { code: "sw-KE", label: "Kiswahili (Swahili)" },
];

export default function SpeechToText() {
  // null = not checked yet (SSR-safe) — the check happens in useEffect only.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState("en-US");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const stopRequested = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
    return () => {
      stopRequested.current = true;
      recRef.current?.abort?.();
    };
  }, []);

  function startRecognition(langCode: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langCode;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interimStr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const t = r[0].transcript.trim();
          if (t) setFinalText((prev) => prev + t + " ");
        } else {
          interimStr += r[0].transcript;
        }
      }
      setInterim(interimStr);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // ignorable
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone permission denied — allow microphone access in your browser and try again.");
        stopRequested.current = true;
        setListening(false);
      } else if (e.error === "audio-capture") {
        setError("No microphone was found — check that one is connected and enabled.");
        stopRequested.current = true;
        setListening(false);
      } else if (e.error === "network") {
        setError("The speech service hit a network error — check your connection and try again.");
      } else {
        setError(`Speech recognition error: ${e.error}`);
      }
    };

    rec.onend = () => {
      if (recRef.current !== rec) return; // a newer session replaced this one
      setInterim("");
      if (!stopRequested.current) {
        // Chrome stops after a few seconds of silence — restart automatically.
        try { rec.start(); } catch { /* already restarting */ }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    stopRequested.current = false;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start speech recognition — please try again.");
      setListening(false);
    }
  }

  function toggle() {
    if (listening) {
      stopRequested.current = true;
      recRef.current?.stop();
      setListening(false);
    } else {
      startRecognition(lang);
    }
  }

  function onLangChange(code: string) {
    setLang(code);
    if (listening) {
      // Restart with the new language.
      stopRequested.current = true;
      recRef.current?.abort();
      startRecognition(code);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(finalText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function downloadTxt() {
    const blob = new Blob([finalText.trim()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearAll() {
    setFinalText("");
    setInterim("");
    setCopied(false);
  }

  const trimmed = finalText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  return (
    <div>
      {supported === false && (
        <p style={{ color: "#ff6b6b" }}>
          Your browser doesn&apos;t support speech recognition — try Chrome, Edge or Safari.
        </p>
      )}

      <div className="field">
        <label>Language</label>
        <select className="input" value={lang} onChange={(e) => onLangChange(e.target.value)}>
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button
          className="btn"
          onClick={toggle}
          disabled={supported === false}
          style={{ fontSize: "1rem", padding: "10px 22px" }}
        >
          {listening ? "● Listening… (click to stop)" : "🎤 Start dictation"}
        </button>
      </div>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      <div className="field" style={{ marginTop: 14 }}>
        <label>Transcript</label>
        <textarea readOnly value={finalText} rows={10} className="input" placeholder="Your words will appear here…" />
        {interim && (
          <p style={{ color: "var(--muted)", fontStyle: "italic", marginTop: 6 }}>{interim}</p>
        )}
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 6 }}>
          {wordCount} word{wordCount === 1 ? "" : "s"} · {finalText.length} characters
        </p>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={copy} disabled={!trimmed}>{copied ? "Copied ✓" : "Copy"}</button>
          <button className="btn secondary" onClick={downloadTxt} disabled={!trimmed}>Download .txt</button>
          <button className="btn secondary" onClick={clearAll} disabled={!finalText && !interim}>Clear</button>
        </div>
      </div>

      <p className="privacy-note">🔒 We never receive your audio or transcript. Recognition uses your browser&apos;s built-in speech engine — some browsers (e.g. Chrome) process audio on the browser vendor&apos;s servers.</p>
    </div>
  );
}
