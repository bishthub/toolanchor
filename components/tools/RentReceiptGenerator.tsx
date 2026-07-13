"use client";

import { useMemo, useState } from "react";

// Indian-system number to words (integers): thousand, lakh, crore.
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function twoDigits(n: number): string {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}
function threeDigits(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  return `${h ? ONES[h] + " hundred" + (r ? " " : "") : ""}${r ? twoDigits(r) : ""}`;
}
function amountInWords(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "zero";
  n = Math.floor(n);
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5),
    thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (rest) parts.push(threeDigits(rest));
  const s = parts.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const fmtINR = (n: number) => n.toLocaleString("en-IN");

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

interface Receipt { n: number; monthLabel: string; issueDate: string }

function monthRange(from: string, to: string): { y: number; m: number }[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  if (!fy || !ty) return [];
  const out: { y: number; m: number }[] = [];
  for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? (y++, m = 1) : m++) {
    out.push({ y, m });
    if (out.length > 24) break;
  }
  return out;
}

export default function RentReceiptGenerator() {
  const now = new Date();
  const defTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const back = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const defFrom = `${back.getFullYear()}-${String(back.getMonth() + 1).padStart(2, "0")}`;

  const [tenant, setTenant] = useState("");
  const [landlord, setLandlord] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState(15000);
  const [mode, setMode] = useState("Bank transfer");
  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);
  const [busy, setBusy] = useState(false);

  const months = useMemo(() => monthRange(from, to), [from, to]);
  const rangeError = from && to && months.length === 0 ? "The “to” month must not be before the “from” month." : null;
  const tooMany = months.length > 24;

  const receipts: Receipt[] = useMemo(() =>
    months.slice(0, 24).map(({ y, m }, i) => {
      const issue = new Date(y, m, 1); // 1st of the following month
      return {
        n: i + 1,
        monthLabel: `${MONTHS[m - 1]} ${y}`,
        issueDate: issue.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      };
    }), [months]);

  const words = useMemo(() => amountInWords(rent), [rent]);
  const needsStamp = mode === "Cash" && rent > 5000;
  const needsPan = rent * 12 > 100000 && !pan.trim();
  const ready = tenant.trim() && landlord.trim() && address.trim() && rent > 0 && receipts.length > 0;

  async function exportPdf() {
    if (!ready) return;
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const dark = rgb(0.1, 0.1, 0.12);
      const grey = rgb(0.4, 0.4, 0.45);
      const M = 50, W = 595, H = 842, boxH = 240, gap = 14;

      // pdf-lib's WinAnsi encoding can't draw "₹" — use "Rs." in the PDF.
      const money = `Rs. ${fmtINR(rent)}`;
      const perPage = 3;
      for (let i = 0; i < receipts.length; i += perPage) {
        const page = doc.addPage([W, H]);
        receipts.slice(i, i + perPage).forEach((r, j) => {
          const top = H - 40 - j * (boxH + gap);
          page.drawRectangle({ x: M - 12, y: top - boxH, width: W - 2 * (M - 12), height: boxH, borderColor: grey, borderWidth: 0.75 });
          let y = top - 26;
          page.drawText("RENT RECEIPT", { x: M, y, size: 14, font: bold, color: dark });
          const right = (s: string, yy: number, size = 9, f = font) =>
            page.drawText(s, { x: W - M - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color: grey });
          right(`Receipt #${r.n}`, y + 3, 10, bold);
          right(`Date: ${r.issueDate}`, y - 10);
          y -= 34;
          const body = [
            `Received with thanks from ${tenant} a sum of ${money}`,
            `(${words} rupees only) towards rent for the month of ${r.monthLabel}`,
            `for the property at ${address.replace(/\n+/g, ", ")}.`,
            `Payment mode: ${mode}.`,
          ];
          for (const line of body) {
            // naive wrap at ~92 chars
            for (let s = line; s.length; s = s.slice(92)) {
              page.drawText(s.slice(0, 92), { x: M, y, size: 10, font, color: dark });
              y -= 14;
            }
          }
          const footY = top - boxH + 30;
          page.drawText(landlord, { x: M, y: footY + 12, size: 10, font: bold, color: dark });
          if (pan.trim()) page.drawText(`PAN: ${pan.trim().toUpperCase()}`, { x: M, y: footY, size: 9, font, color: grey });
          if (needsStamp) {
            page.drawRectangle({ x: W - M - 180, y: footY - 6, width: 60, height: 40, borderColor: grey, borderWidth: 0.5, borderDashArray: [3, 3] });
            page.drawText("Revenue", { x: W - M - 172, y: footY + 16, size: 6, font, color: grey });
            page.drawText("stamp", { x: W - M - 169, y: footY + 8, size: 6, font, color: grey });
          }
          page.drawLine({ start: { x: W - M - 110, y: footY + 6 }, end: { x: W - M, y: footY + 6 }, thickness: 0.5, color: grey });
          page.drawText("Signature", { x: W - M - 80, y: footY - 6, size: 8, font, color: grey });
        });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "rent-receipts.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Tenant name</label>
          <input className="input" value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="Who pays the rent" />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Landlord name</label>
          <input className="input" value={landlord} onChange={(e) => setLandlord(e.target.value)} placeholder="Who receives the rent" />
        </div>
      </div>
      <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Landlord PAN (optional)</label>
          <input className="input" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Monthly rent (₹)</label>
          <input type="number" min={0} className="input" value={rent} onChange={(e) => setRent(Math.max(0, Number(e.target.value)))} />
        </div>
      </div>
      <div className="field">
        <label>Property address</label>
        <textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat / house, street, city, PIN" />
      </div>
      <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
        <div className="field" style={{ minWidth: 160 }}>
          <label>Payment mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Bank transfer</option>
            <option>UPI</option>
            <option>Cash</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: 150 }}>
          <label>From month</label>
          <input type="month" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ minWidth: 150 }}>
          <label>To month</label>
          <input type="month" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {rangeError && <p style={{ color: "#ff6b6b" }}>{rangeError}</p>}
      {tooMany && <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Capped at 24 receipts per run.</p>}
      {needsPan && (
        <p style={{ color: "#e8a13c", fontSize: ".88rem" }}>
          Annual rent exceeds ₹1,00,000 — your employer will require the landlord&apos;s PAN for HRA claims.
        </p>
      )}

      <button className="btn" onClick={exportPdf} disabled={!ready || busy}>
        {busy ? "Building PDF…" : `⬇ Download ${receipts.length || ""} receipt${receipts.length === 1 ? "" : "s"} as PDF`}
      </button>

      {ready && (
        <div style={{ marginTop: 18 }}>
          {receipts.map((r) => (
            <div key={r.n} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <strong>RENT RECEIPT</strong>
                <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>Receipt #{r.n} · Date: {r.issueDate}</span>
              </div>
              <p style={{ margin: "10px 0", lineHeight: 1.55 }}>
                Received with thanks from <b>{tenant}</b> a sum of <b>₹{fmtINR(rent)}</b> ({words} rupees only)
                towards rent for the month of <b>{r.monthLabel}</b> for the property at {address.replace(/\n+/g, ", ")}.
                <br />
                <span style={{ color: "var(--muted)", fontSize: ".88rem" }}>Payment mode: {mode}</span>
              </p>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginTop: 18, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{landlord}</div>
                  {pan.trim() && <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>PAN: {pan.trim()}</div>}
                </div>
                <div className="row" style={{ gap: 14, alignItems: "flex-end" }}>
                  {needsStamp && (
                    <div style={{ width: 70, height: 44, border: "1px dashed var(--border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: ".65rem", textAlign: "center" }}>
                      Revenue stamp
                    </div>
                  )}
                  <div style={{ width: 160, borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--muted)", fontSize: ".75rem", paddingTop: 4 }}>
                    Signature
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="privacy-note">🔒 Receipts are generated entirely in your browser — names, addresses and amounts never leave your device.</p>
    </div>
  );
}
