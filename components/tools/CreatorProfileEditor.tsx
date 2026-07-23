"use client";

// ─────────────────────────────────────────────────────────────────────────
// Shared "My details" editor used by Google Form Auto-Filler and Invoice
// Auto-Filler. One saved profile (localStorage, never uploaded) that both
// tools pull from. Auto-saves as you type.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import {
  CreatorProfile, EMPTY_PROFILE, getProfile, saveProfile,
  profileFieldCount, PROFILE_EVENT, type ProfileKey,
} from "@/lib/creatorProfile";

interface FieldDef { key: ProfileKey; label: string; placeholder?: string; type?: string; wide?: boolean }
interface Group { title: string; fields: FieldDef[] }

const GROUPS: Group[] = [
  {
    title: "Basics",
    fields: [
      { key: "fullName", label: "Full name", placeholder: "Priya Sharma" },
      { key: "email", label: "Email", placeholder: "you@example.com", type: "email" },
      { key: "phone", label: "Phone / WhatsApp", placeholder: "+91 98765 43210" },
      { key: "dob", label: "Date of birth", type: "date" },
      { key: "gender", label: "Gender", placeholder: "Female" },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "address", label: "Full address", placeholder: "Flat, street, area", wide: true },
      { key: "city", label: "City", placeholder: "Mumbai" },
      { key: "state", label: "State", placeholder: "Maharashtra" },
      { key: "country", label: "Country", placeholder: "India" },
      { key: "pincode", label: "PIN / ZIP code", placeholder: "400001" },
    ],
  },
  {
    title: "Social & portfolio",
    fields: [
      { key: "instagram", label: "Instagram handle / link", placeholder: "@yourhandle" },
      { key: "followers", label: "Instagram followers", placeholder: "25,000" },
      { key: "youtube", label: "YouTube channel", placeholder: "youtube.com/@you" },
      { key: "subscribers", label: "YouTube subscribers", placeholder: "10,000" },
      { key: "portfolio", label: "Portfolio / website", placeholder: "https://…" },
      { key: "rate", label: "Rate / charges", placeholder: "₹5,000 per reel" },
      { key: "bio", label: "Short bio / about you", placeholder: "Beauty & lifestyle creator…", wide: true },
    ],
  },
  {
    title: "Payment IDs",
    fields: [
      { key: "upi", label: "UPI ID", placeholder: "name@okhdfcbank" },
      { key: "pan", label: "PAN", placeholder: "ABCDE1234F" },
      { key: "gstin", label: "GSTIN (if any)", placeholder: "27ABCDE1234F1Z5" },
    ],
  },
  {
    title: "Bank account",
    fields: [
      { key: "accountHolder", label: "Account holder name", placeholder: "As per bank records" },
      { key: "bankName", label: "Bank name", placeholder: "HDFC Bank" },
      { key: "accountNumber", label: "Account number", placeholder: "1234567890" },
      { key: "ifsc", label: "IFSC code", placeholder: "HDFC0000123" },
    ],
  },
];

export default function CreatorProfileEditor({
  onChange,
  defaultOpen = false,
}: {
  onChange?: (p: CreatorProfile) => void;
  defaultOpen?: boolean;
}) {
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function flashSaved() {
    setSavedFlash(true);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSavedFlash(false), 2000);
  }

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setLoaded(true);
    onChangeRef.current?.(p);
  }, []);

  function set(key: ProfileKey, value: string) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };
      saveProfile(next);
      onChangeRef.current?.(next);
      return next;
    });
    flashSaved();
  }

  function clearAll() {
    if (!confirm("Clear all saved details from this device?")) return;
    saveProfile({ ...EMPTY_PROFILE });
    setProfile({ ...EMPTY_PROFILE });
    onChangeRef.current?.({ ...EMPTY_PROFILE });
  }

  // Stay in sync if another tool tab edits the profile.
  useEffect(() => {
    const read = () => setProfile(getProfile());
    window.addEventListener(PROFILE_EVENT, read);
    return () => window.removeEventListener(PROFILE_EVENT, read);
  }, []);

  const count = profileFieldCount(profile);
  const total = Object.keys(EMPTY_PROFILE).length;

  return (
    <details open={defaultOpen} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 18 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        My details{" "}
        <span style={{ color: "var(--muted)", fontWeight: 400 }}>
          — {loaded ? `${count} of ${total} filled` : "…"} · auto-saves on this device
        </span>
        {savedFlash && (
          <span style={{ color: "var(--ok, #16a34a)", fontWeight: 600, marginLeft: 8, fontSize: 13 }}>
            ✓ Saved
          </span>
        )}
      </summary>
      <div style={{ marginTop: 12 }}>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", margin: "10px 0 8px" }}>
              {g.title}
            </p>
            <div className="row">
              {g.fields.map((f) => (
                <div className="field" key={f.key} style={f.wide ? { flex: "1 1 100%" } : { flex: "1 1 200px" }}>
                  <label htmlFor={`cp-${f.key}`}>{f.label}</label>
                  <input
                    id={`cp-${f.key}`}
                    className="input"
                    type={f.type ?? "text"}
                    value={profile[f.key]}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p className="privacy-note" style={{ margin: 0 }}>
            🔒 Every keystroke is saved instantly in your browser&apos;s local storage — never uploaded, never synced.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn" onClick={() => { saveProfile(profile); flashSaved(); }}>
              {savedFlash ? "Saved ✓" : "Save details"}
            </button>
            <button type="button" className="btn secondary" onClick={clearAll}>Clear</button>
          </div>
        </div>
      </div>
    </details>
  );
}
