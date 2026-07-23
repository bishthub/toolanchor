"use client";

// ─────────────────────────────────────────────────────────────────────────
// Google Form Auto-Filler — paste a form link, we read its questions,
// match them against the saved creator profile, and build Google's own
// pre-fill URL (?usp=pp_url&entry.N=…). The user reviews the answers,
// opens the pre-filled form, and submits it themselves.
//
// The saved profile never leaves the browser. Only the form's public URL
// is sent to /api/form-proxy so the questions can be read (Google Forms
// blocks cross-origin reads from the browser).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  CreatorProfile, EMPTY_PROFILE, getProfile, matchLabel, valueFor,
  profileFieldCount,
} from "@/lib/creatorProfile";
import CreatorProfileEditor from "./CreatorProfileEditor";

type QType =
  | "short" | "paragraph" | "choice" | "dropdown" | "checkbox"
  | "scale" | "date" | "time" | "grid" | "file" | "other";

interface FormQuestion {
  entryId: number;
  title: string;
  help: string;
  type: QType;
  options: string[];
  required: boolean;
}

interface FormData {
  title: string;
  description: string;
  url: string;
  collectsEmail: boolean;
  questions: FormQuestion[];
}

const MANUAL_TYPES: QType[] = ["time", "grid", "file", "other"];

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name", email: "Email", phone: "Phone", dob: "Date of birth",
  gender: "Gender", address: "Address", city: "City", state: "State",
  country: "Country", pincode: "PIN code", instagram: "Instagram",
  youtube: "YouTube", followers: "Followers", subscribers: "Subscribers",
  portfolio: "Portfolio", upi: "UPI ID", pan: "PAN", gstin: "GSTIN",
  bankName: "Bank name", accountHolder: "Account holder",
  accountNumber: "Account number", ifsc: "IFSC", rate: "Rate",
  bio: "Bio", age: "Age",
};

/** Pick the option that best matches a profile value (for choice questions). */
function matchOption(options: string[], value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  const exact = options.find((o) => o.trim().toLowerCase() === v);
  if (exact) return exact;
  const partial = options.find((o) => {
    const ol = o.trim().toLowerCase();
    return ol.includes(v) || v.includes(ol);
  });
  return partial ?? "";
}

function autoFill(questions: FormQuestion[], profile: CreatorProfile) {
  const answers: Record<number, string | string[]> = {};
  const matched: Record<number, string> = {};
  for (const q of questions) {
    if (MANUAL_TYPES.includes(q.type)) continue;
    const key = matchLabel(`${q.title} ${q.help}`);
    if (!key) continue;
    const value = valueFor(profile, key);
    if (!value) continue;
    if (q.type === "short" || q.type === "paragraph") {
      answers[q.entryId] = value;
      matched[q.entryId] = FIELD_LABELS[key] ?? key;
    } else if (q.type === "choice" || q.type === "dropdown" || q.type === "scale") {
      const opt = matchOption(q.options, value);
      if (opt) {
        answers[q.entryId] = opt;
        matched[q.entryId] = FIELD_LABELS[key] ?? key;
      }
    } else if (q.type === "checkbox") {
      const opt = matchOption(q.options, value);
      if (opt) {
        answers[q.entryId] = [opt];
        matched[q.entryId] = FIELD_LABELS[key] ?? key;
      }
    } else if (q.type === "date" && key === "dob" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      answers[q.entryId] = value;
      matched[q.entryId] = FIELD_LABELS[key] ?? key;
    }
  }
  return { answers, matched };
}

function buildPrefillUrl(form: FormData, answers: Record<number, string | string[]>): string {
  const params = new URLSearchParams();
  params.set("usp", "pp_url");
  for (const q of form.questions) {
    const a = answers[q.entryId];
    if (a === undefined || a === "" || (Array.isArray(a) && a.length === 0)) continue;
    if (q.type === "date" && typeof a === "string") {
      const m = a.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) continue;
      params.append(`entry.${q.entryId}_year`, m[1]);
      params.append(`entry.${q.entryId}_month`, String(Number(m[2])));
      params.append(`entry.${q.entryId}_day`, String(Number(m[3])));
    } else if (Array.isArray(a)) {
      for (const v of a) params.append(`entry.${q.entryId}`, v);
    } else {
      params.append(`entry.${q.entryId}`, a);
    }
  }
  return `${form.url}?${params.toString()}`;
}

export default function GoogleFormFiller() {
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [editorOpen, setEditorOpen] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [matched, setMatched] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);

  // Open the profile editor by default only when nothing is saved yet.
  useEffect(() => {
    setEditorOpen(profileFieldCount(getProfile()) === 0);
  }, []);

  async function loadForm() {
    const link = url.trim();
    if (!link) { setError("Paste a Google Form link first."); return; }
    setBusy(true);
    setError("");
    setForm(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/form-proxy?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't load this form.");
      const f = data as FormData;
      setForm(f);
      const { answers: a, matched: m } = autoFill(f.questions, profile);
      setAnswers(a);
      setMatched(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this form.");
    } finally {
      setBusy(false);
    }
  }

  function refill() {
    if (!form) return;
    const { answers: a, matched: m } = autoFill(form.questions, getProfile());
    setAnswers((prev) => ({ ...prev, ...a }));
    setMatched(m);
  }

  function setAnswer(entryId: number, v: string | string[]) {
    setAnswers((prev) => ({ ...prev, [entryId]: v }));
    setCopied(false);
  }

  function toggleCheckbox(entryId: number, option: string) {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[entryId]) ? (prev[entryId] as string[]) : [];
      const next = cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
      return { ...prev, [entryId]: next };
    });
    setCopied(false);
  }

  const prefillUrl = form ? buildPrefillUrl(form, answers) : "";
  const fillable = form ? form.questions.filter((q) => !MANUAL_TYPES.includes(q.type)) : [];
  const filledCount = fillable.filter((q) => {
    const a = answers[q.entryId];
    return a !== undefined && a !== "" && !(Array.isArray(a) && a.length === 0);
  }).length;
  const manualCount = form ? form.questions.length - fillable.length : 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(prefillUrl);
      setCopied(true);
    } catch { /* ignore */ }
  }

  return (
    <div>
      {editorOpen !== null && (
        <CreatorProfileEditor defaultOpen={editorOpen} onChange={setProfile} />
      )}

      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "1 1 320px" }}>
          <label htmlFor="gff-url">Google Form link</label>
          <input
            id="gff-url"
            className="input"
            type="url"
            placeholder="https://docs.google.com/forms/… or https://forms.gle/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadForm(); }}
          />
        </div>
        <div className="field">
          <button type="button" className="btn" onClick={loadForm} disabled={busy}>
            {busy ? "Reading form…" : "Load form"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", marginTop: 4 }}>{error}</p>}

      {form && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: "8px 0" }}>{form.title}</h3>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              {filledCount} of {fillable.length} answers filled
              {manualCount > 0 ? ` · ${manualCount} to fill on the form` : ""}
            </span>
          </div>
          {form.collectsEmail && (
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "4px 0 12px" }}>
              ℹ️ This form collects your email via Google itself — you may need to confirm it on the form.
            </p>
          )}

          {form.questions.map((q) => {
            const manual = MANUAL_TYPES.includes(q.type);
            const a = answers[q.entryId];
            return (
              <div
                key={q.entryId}
                style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 10 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>
                    {q.title}
                    {q.required && <span style={{ color: "#dc2626" }}> *</span>}
                  </span>
                  {matched[q.entryId] && (
                    <span style={{ fontSize: 12, color: "var(--accent)", whiteSpace: "nowrap" }}>
                      auto-filled · {matched[q.entryId]}
                    </span>
                  )}
                </div>
                {q.help && <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 8px" }}>{q.help}</p>}

                {manual ? (
                  <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
                    {q.type === "file"
                      ? "File upload — attach this on the form itself."
                      : "This question type can't be pre-filled — answer it on the form."}
                  </p>
                ) : q.type === "paragraph" ? (
                  <textarea
                    className="input"
                    rows={3}
                    value={typeof a === "string" ? a : ""}
                    placeholder="Leave blank to skip"
                    onChange={(e) => setAnswer(q.entryId, e.target.value)}
                  />
                ) : q.type === "choice" || q.type === "dropdown" || q.type === "scale" ? (
                  <select
                    className="input"
                    value={typeof a === "string" ? a : ""}
                    onChange={(e) => setAnswer(q.entryId, e.target.value)}
                  >
                    <option value="">— leave blank —</option>
                    {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : q.type === "checkbox" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((o) => (
                      <label key={o} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(a) && a.includes(o)}
                          onChange={() => toggleCheckbox(q.entryId, o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : q.type === "date" ? (
                  <input
                    className="input"
                    type="date"
                    value={typeof a === "string" ? a : ""}
                    onChange={(e) => setAnswer(q.entryId, e.target.value)}
                  />
                ) : (
                  <input
                    className="input"
                    type="text"
                    value={typeof a === "string" ? a : ""}
                    placeholder="Leave blank to skip"
                    onChange={(e) => setAnswer(q.entryId, e.target.value)}
                  />
                )}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <a className="btn" href={prefillUrl} target="_blank" rel="noopener noreferrer">
              Open pre-filled form ↗
            </a>
            <button type="button" className="btn secondary" onClick={copyLink}>
              {copied ? "Copied ✓" : "Copy pre-filled link"}
            </button>
            <button type="button" className="btn secondary" onClick={refill}>
              Re-fill from my details
            </button>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
            The form opens with your answers already typed in. Review everything, answer anything
            we skipped, then hit <strong>Submit</strong> on the form — nothing is submitted for you.
          </p>
        </div>
      )}

      <p className="privacy-note" style={{ marginTop: 16 }}>
        🔒 Your saved details never leave this device. Only the form&apos;s public link is sent to
        our server to read its questions — no answers, no personal data.
      </p>
    </div>
  );
}
