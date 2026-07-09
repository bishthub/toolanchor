"use client";

import { useState, useMemo } from "react";

const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "letmein",
  "dragon", "111111", "baseball", "iloveyou", "trustno1", "sunshine",
  "master", "welcome", "shadow", "ashley", "football", "jesus", "michael",
  "ninja", "mustang", "password1", "admin", "administrator", "qwerty123",
]);

function scorePassword(pw: string) {
  let score = 0;
  const feedback: string[] = [];

  if (pw.length < 1) return { score: 0, entropy: 0, crackTime: "", feedback: ["Enter a password to check."] };

  // Length scoring
  if (pw.length >= 8) score += 15;
  if (pw.length >= 12) score += 10;
  if (pw.length >= 16) score += 10;
  if (pw.length < 8) feedback.push("Use at least 8 characters (aim for 12+).");

  // Character variety
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  const types = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (hasLower) score += 5;
  if (hasUpper) score += 10;
  if (hasDigit) score += 10;
  if (hasSymbol) score += 15;

  if (types < 3) feedback.push("Mix uppercase, lowercase, digits and symbols.");

  // Common patterns penalty
  const lower = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) { score = Math.max(0, score - 30); feedback.push("This is a very common password — easily guessed."); }
  if (/(.)\1{2,}/.test(pw)) { score -= 10; feedback.push("Avoid repeated characters (e.g. 'aaa')."); }
  if (/qwerty|asdf|zxcv|1234|abcd/i.test(pw)) { score -= 10; feedback.push("Avoid keyboard patterns (e.g. 'qwerty', '1234')."); }
  if (/^(19|20)\d{2}$/.test(pw)) { score -= 15; feedback.push("Avoid years — they're easily guessed."); }

  // Entropy estimation (simplified)
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 33;
  const entropy = pw.length > 0 && poolSize > 0 ? Math.round(pw.length * Math.log2(poolSize)) : 0;

  // Estimate crack time at 1B guesses/sec
  const guesses = Math.pow(2, entropy);
  let crackTime: string;
  if (guesses < 1e6) crackTime = "instantly";
  else if (guesses < 1e9) crackTime = "minutes";
  else if (guesses < 1e12) crackTime = "hours";
  else if (guesses < 1e15) crackTime = "months";
  else if (guesses < 1e18) crackTime = "centuries";
  else crackTime = "many lifetimes";

  score = Math.max(0, Math.min(100, score));

  if (score >= 80 && feedback.length === 0) feedback.push("Excellent — this is a very strong password.");
  else if (score >= 60 && feedback.length === 0) feedback.push("Good — try adding more length or symbols.");
  else if (score >= 40 && feedback.length === 0) feedback.push("Fair — add more characters and variety.");
  else if (score < 40 && feedback.length === 0) feedback.push("Weak — make it longer and more varied.");

  return { score, entropy, crackTime, feedback };
}

function getColor(score: number): string {
  if (score >= 80) return "var(--ok)";
  if (score >= 60) return "#65a30d";
  if (score >= 40) return "#d9944b";
  return "var(--danger)";
}

function getLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Weak";
}

export default function PasswordStrengthChecker() {
  const [pw, setPw] = useState("");

  const result = useMemo(() => scorePassword(pw), [pw]);

  return (
    <div>
      <div className="field">
        <label>Password to check</label>
        <input
          className="input"
          type="text"
          placeholder="Type a password…"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.1rem", letterSpacing: pw.length > 0 ? "0.15em" : undefined }}
        />
      </div>

      {pw.length > 0 && (
        <>
          <div className="field">
            <label>Strength</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, height: 12, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${result.score}%`, height: "100%", background: getColor(result.score), borderRadius: 999, transition: "width .2s, background .2s" }} />
              </div>
              <span style={{ fontWeight: 650, color: getColor(result.score), fontFamily: "var(--font-mono), monospace", minWidth: 50, textAlign: "right" }}>
                {result.score}/100
              </span>
              <span style={{ fontWeight: 550, color: getColor(result.score), minWidth: 60 }}>
                {getLabel(result.score)}
              </span>
            </div>
          </div>

          <div className="stats">
            <div className="stat"><div className="n">{result.entropy}</div><div className="l">Entropy (bits)</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1.1rem" }}>{result.crackTime}</div><div className="l">Est. crack time</div></div>
            <div className="stat"><div className="n">{pw.length}</div><div className="l">Characters</div></div>
          </div>

          {result.feedback.length > 0 && (
            <div className="field">
              <label>Suggestions</label>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {result.feedback.map((tip, i) => (
                  <li key={i} style={{ padding: "6px 0", color: "var(--muted)", fontSize: ".88rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)" }}>•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="privacy-note">🔒 Your password is analysed entirely in your browser — it never leaves your device. No data is stored or transmitted.</p>
    </div>
  );
}
