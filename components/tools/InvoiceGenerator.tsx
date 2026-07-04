"use client";

import { useEffect, useState } from "react";

interface Item { desc: string; qty: number; rate: number }
interface Invoice {
  seller: string; sellerDetails: string;
  buyer: string; buyerDetails: string;
  number: string; date: string; currency: string;
  items: Item[]; taxLabel: string; taxRate: number; notes: string;
}

// ₹ (U+20B9) isn't in pdf-lib's standard Helvetica encoding, so the PDF uses an
// ASCII fallback while the on-screen preview shows the real symbol.
const CURRENCIES: Record<string, { sym: string; pdf: string }> = {
  USD: { sym: "$", pdf: "$" },
  EUR: { sym: "€", pdf: "€" },
  GBP: { sym: "£", pdf: "£" },
  INR: { sym: "₹", pdf: "Rs " },
};

const STORAGE_KEY = "ta:invoice-draft";

const BLANK: Invoice = {
  seller: "Your Company", sellerDetails: "123 Main Street\nCity, 00000\nyou@company.com",
  buyer: "Client Name", buyerDetails: "Client Address\nCity, 00000",
  number: "INV-001", date: new Date().toISOString().slice(0, 10), currency: "USD",
  items: [{ desc: "Design services", qty: 10, rate: 50 }],
  taxLabel: "Tax", taxRate: 0, notes: "Thank you for your business!",
};

export default function InvoiceGenerator() {
  const [inv, setInv] = useState<Invoice>(BLANK);
  const [busy, setBusy] = useState(false);

  // Restore draft.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInv({ ...BLANK, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  // Persist draft.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inv)); } catch { /* ignore */ }
  }, [inv]);

  const cur = CURRENCIES[inv.currency] ?? CURRENCIES.USD;
  const subtotal = inv.items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0);
  const tax = subtotal * (inv.taxRate || 0) / 100;
  const total = subtotal + tax;
  const money = (n: number) => `${cur.sym}${n.toFixed(2)}`;

  function set<K extends keyof Invoice>(k: K, v: Invoice[K]) { setInv((p) => ({ ...p, [k]: v })); }
  function setItem(i: number, k: keyof Item, v: string) {
    setInv((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: k === "desc" ? v : Number(v) } : it) }));
  }
  function addItem() { setInv((p) => ({ ...p, items: [...p.items, { desc: "", qty: 1, rate: 0 }] })); }
  function removeItem(i: number) { setInv((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) })); }

  async function exportPdf() {
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]); // A4 in points
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const dark = rgb(0.1, 0.1, 0.12);
      const grey = rgb(0.4, 0.4, 0.45);
      const M = 50;
      const pmoney = (n: number) => `${cur.pdf}${n.toFixed(2)}`;
      const draw = (s: string, x: number, y: number, size = 10, f = font, color = dark) =>
        page.drawText(s || "", { x, y, size, font: f, color });
      const drawRight = (s: string, xRight: number, y: number, size = 10, f = font, color = dark) =>
        draw(s, xRight - f.widthOfTextAtSize(s || "", size), y, size, f, color);

      let y = 792;
      draw("INVOICE", M, y, 24, bold);
      drawRight(`#${inv.number}`, 545, y + 4, 12, bold, grey);
      drawRight(inv.date, 545, y - 12, 10, font, grey);
      y -= 44;

      draw("From", M, y, 8, bold, grey);
      draw("Bill to", 320, y, 8, bold, grey);
      y -= 14;
      draw(inv.seller, M, y, 12, bold);
      draw(inv.buyer, 320, y, 12, bold);
      y -= 15;
      const fromLines = inv.sellerDetails.split("\n");
      const toLines = inv.buyerDetails.split("\n");
      const rows = Math.max(fromLines.length, toLines.length);
      for (let i = 0; i < rows; i++) {
        if (fromLines[i]) draw(fromLines[i], M, y, 9, font, grey);
        if (toLines[i]) draw(toLines[i], 320, y, 9, font, grey);
        y -= 12;
      }
      y -= 16;

      // Table header.
      draw("Description", M, y, 9, bold, grey);
      drawRight("Qty", 360, y, 9, bold, grey);
      drawRight("Rate", 450, y, 9, bold, grey);
      drawRight("Amount", 545, y, 9, bold, grey);
      y -= 6;
      page.drawLine({ start: { x: M, y }, end: { x: 545, y }, thickness: 0.5, color: grey });
      y -= 16;

      for (const it of inv.items) {
        const amt = (it.qty || 0) * (it.rate || 0);
        draw(it.desc, M, y, 10);
        drawRight(String(it.qty ?? 0), 360, y, 10);
        drawRight(pmoney(it.rate || 0), 450, y, 10);
        drawRight(pmoney(amt), 545, y, 10);
        y -= 18;
        if (y < 120) break; // single-page guard
      }

      y -= 6;
      page.drawLine({ start: { x: 340, y }, end: { x: 545, y }, thickness: 0.5, color: grey });
      y -= 18;
      draw("Subtotal", 360, y, 10, font, grey); drawRight(pmoney(subtotal), 545, y, 10);
      if (inv.taxRate > 0) { y -= 16; draw(`${inv.taxLabel} (${inv.taxRate}%)`, 360, y, 10, font, grey); drawRight(pmoney(tax), 545, y, 10); }
      y -= 20;
      draw("Total", 360, y, 12, bold); drawRight(pmoney(total), 545, y, 12, bold);

      if (inv.notes) {
        y -= 40;
        draw("Notes", M, y, 8, bold, grey); y -= 13;
        for (const line of inv.notes.split("\n")) { draw(line, M, y, 9, font, grey); y -= 12; }
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${inv.number || "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 160px" }}><label>Invoice #</label><input className="input" value={inv.number} onChange={(e) => set("number", e.target.value)} /></div>
        <div className="field" style={{ flex: "1 1 160px" }}><label>Date</label><input type="date" className="input" value={inv.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div className="field" style={{ flex: "0 0 120px" }}>
          <label>Currency</label>
          <select className="input" value={inv.currency} onChange={(e) => set("currency", e.target.value)}>
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} ({CURRENCIES[c].sym})</option>)}
          </select>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 240px" }}>
          <label>From (your business)</label>
          <input className="input" value={inv.seller} onChange={(e) => set("seller", e.target.value)} placeholder="Your company" />
          <textarea value={inv.sellerDetails} onChange={(e) => set("sellerDetails", e.target.value)} style={{ minHeight: 70, marginTop: 6 }} placeholder="Address, email…" />
        </div>
        <div className="field" style={{ flex: "1 1 240px" }}>
          <label>Bill to (client)</label>
          <input className="input" value={inv.buyer} onChange={(e) => set("buyer", e.target.value)} placeholder="Client name" />
          <textarea value={inv.buyerDetails} onChange={(e) => set("buyerDetails", e.target.value)} style={{ minHeight: 70, marginTop: 6 }} placeholder="Client address…" />
        </div>
      </div>

      <div className="field">
        <label>Line items</label>
        {inv.items.map((it, i) => (
          <div className="row" key={i} style={{ marginBottom: 6, alignItems: "center" }}>
            <input className="input" style={{ flex: "1 1 200px" }} value={it.desc} onChange={(e) => setItem(i, "desc", e.target.value)} placeholder="Description" />
            <input className="input" style={{ flex: "0 0 70px" }} type="number" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} placeholder="Qty" />
            <input className="input" style={{ flex: "0 0 90px" }} type="number" value={it.rate} onChange={(e) => setItem(i, "rate", e.target.value)} placeholder="Rate" />
            <span style={{ flex: "0 0 90px", textAlign: "right", color: "var(--muted)", fontSize: ".85rem" }}>{money((it.qty || 0) * (it.rate || 0))}</span>
            <button className="x" onClick={() => removeItem(i)} title="Remove" disabled={inv.items.length <= 1}>✕</button>
          </div>
        ))}
        <button className="btn secondary" onClick={addItem} style={{ marginTop: 4 }}>+ Add item</button>
      </div>

      <div className="row">
        <div className="field" style={{ flex: "1 1 140px" }}><label>Tax label</label><input className="input" value={inv.taxLabel} onChange={(e) => set("taxLabel", e.target.value)} placeholder="GST / VAT / Tax" /></div>
        <div className="field" style={{ flex: "0 0 120px" }}><label>Tax %</label><input type="number" className="input" value={inv.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} /></div>
      </div>

      <div className="field"><label>Notes</label><textarea value={inv.notes} onChange={(e) => set("notes", e.target.value)} style={{ minHeight: 56 }} /></div>

      <div className="stats" style={{ marginTop: 4 }}>
        <div className="stat"><div className="n">{money(subtotal)}</div><div className="l">Subtotal</div></div>
        <div className="stat"><div className="n">{money(tax)}</div><div className="l">{inv.taxLabel} {inv.taxRate}%</div></div>
        <div className="stat"><div className="n">{money(total)}</div><div className="l">Total</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="btn" onClick={exportPdf} disabled={busy}>{busy ? "Building…" : "⬇ Download invoice PDF"}</button>
      </div>

      <p className="privacy-note">🔒 The invoice is generated in your browser with pdf-lib — your details are saved only in this browser (as a draft) and never uploaded.</p>
    </div>
  );
}
