"use client";

// ─────────────────────────────────────────────────────────────────────────
// Invoice Auto-Filler — upload a Word (.docx) or PDF invoice/contract and
// auto-fill the saved creator profile (bank details, UPI, PAN, address…)
// plus per-document values (amount, invoice number, date, client).
//
// .docx: unzip (fflate) → rewrite word/document.xml text in the DOM —
//   {{placeholders}}, "Label: ____" blanks, empty table cells next to a
//   label — then re-zip. Preview via mammoth.
// PDF: fill AcroForm fields with pdf-lib (matched by field name), with an
//   optional flatten. PDFs without form fields are detected and explained.
//
// Everything runs in the browser; nothing is uploaded.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { getProfile, profileFieldCount } from "@/lib/creatorProfile";
import { BLANK_DOC, transformXml, resolveLabel, collectManualFields, type DocFields, type FillCtx, type ManualField } from "@/lib/docFill";
import CreatorProfileEditor from "./CreatorProfileEditor";
import SendToTool from "@/components/SendToTool";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_KEY = "ta:invoice-filler-doc";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function filledName(orig: string, ext: string): string {
  const base = orig.replace(/\.(docx|pdf)$/i, "");
  return `${base}-filled.${ext}`;
}

// ── PDF field UI model ────────────────────────────────────────────────────

interface PdfFieldUI {
  name: string;
  kind: "text" | "options" | "checkbox";
  options: string[];
  value: string;
  matched: boolean;
}

export default function InvoiceFiller({ initialFiles }: { initialFiles?: File[] }) {
  const [editorOpen, setEditorOpen] = useState<boolean | null>(null);
  const [doc, setDoc] = useState<DocFields>(BLANK_DOC);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"docx" | "pdf" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Results
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [outName, setOutName] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [docxPreview, setDocxPreview] = useState(""); // mammoth fallback HTML
  const [previewMode, setPreviewMode] = useState<"rich" | "html" | "">("");
  const [manualFields, setManualFields] = useState<ManualField[]>([]);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  // PDF form state
  const [pdfFields, setPdfFields] = useState<PdfFieldUI[] | null>(null);
  const [pdfNoFields, setPdfNoFields] = useState(false);
  const [flatten, setFlatten] = useState(true);
  const fileBuf = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    setEditorOpen(profileFieldCount(getProfile()) === 0);
    try {
      const raw = localStorage.getItem(DOC_KEY);
      if (raw) setDoc({ ...BLANK_DOC, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(DOC_KEY, JSON.stringify(doc)); } catch { /* ignore */ }
  }, [doc]);

  useEffect(() => () => { if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl); }, [pdfPreviewUrl]);

  useEffect(() => {
    const f = initialFiles?.[0];
    if (f) onFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function setD<K extends keyof DocFields>(k: K, v: string) {
    setDoc((p) => ({ ...p, [k]: v }));
  }

  function resetOutput() {
    setOutBlob(null); setOutName(""); setChanges([]); setDocxPreview(""); setPreviewMode("");
    setManualFields([]);
    if (previewRef.current) previewRef.current.innerHTML = "";
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl("");
  }

  // Render the styled preview once the filled .docx exists. docx-preview
  // keeps the document's real colors/fonts/layout; mammoth is the fallback.
  useEffect(() => {
    if (!outBlob || kind !== "docx") return;
    let cancelled = false;
    (async () => {
      try {
        const dp = await import("docx-preview");
        const el = previewRef.current;
        if (!el) throw new Error("no container");
        el.innerHTML = "";
        await dp.renderAsync(await outBlob.arrayBuffer(), el, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
        });
        if (!cancelled) setPreviewMode("rich");
      } catch {
        try {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const mod: any = await import("mammoth");
          const mammoth = mod.default ?? mod;
          const result = await mammoth.convertToHtml({ arrayBuffer: await outBlob.arrayBuffer() });
          if (!cancelled) { setDocxPreview(result.value as string); setPreviewMode("html"); }
        } catch { /* preview is best-effort */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outBlob, kind]);

  async function onFile(f: File) {
    setError("");
    resetOutput();
    setManualValues({});
    setPdfFields(null);
    setPdfNoFields(false);
    const name = f.name.toLowerCase();
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setError("Old .doc files aren't supported — save it as .docx in Word/Google Docs first.");
      setFile(null); setKind(null);
      return;
    }
    if (!name.endsWith(".docx") && !name.endsWith(".pdf")) {
      setError("Please upload a .docx or .pdf file.");
      setFile(null); setKind(null);
      return;
    }
    setFile(f);
    const k = name.endsWith(".pdf") ? "pdf" : "docx";
    setKind(k);
    fileBuf.current = await f.arrayBuffer();
    if (k === "pdf") await inspectPdf(fileBuf.current);
  }

  const ctx = (): FillCtx => ({ profile: getProfile(), doc, overrides: manualValues });

  // ── DOCX ────────────────────────────────────────────────────────────────

  async function fillDocx() {
    if (!file || !fileBuf.current) return;
    setBusy(true);
    setError("");
    resetOutput();
    try {
      const { unzipSync, zipSync } = await import("fflate");
      const files = unzipSync(new Uint8Array(fileBuf.current));
      const log: string[] = [];
      const c = ctx();
      let changedAny = false;
      const manual: ManualField[] = [];
      const seen = new Set<string>();
      for (const name of Object.keys(files)) {
        if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) continue;
        const xml = new TextDecoder().decode(files[name]);
        const dom = new DOMParser().parseFromString(xml, "application/xml");
        if (dom.getElementsByTagName("parsererror").length > 0) continue;
        if (transformXml(dom, c, log)) {
          changedAny = true;
          files[name] = new TextEncoder().encode(new XMLSerializer().serializeToString(dom));
        }
        // Placeholders auto-fill (and any manual values) couldn't resolve — offer them for manual entry.
        for (const mf of collectManualFields(dom)) {
          if (!seen.has(mf.token)) { seen.add(mf.token); manual.push(mf); }
        }
      }
      if (!changedAny && manual.length === 0) {
        setError("Nothing to fill was found. Tip: this works with {{name}}-style placeholders, “Label: ____” blanks, or empty table cells next to labels like “Bank Name”. Make sure the matching details are saved above.");
        return;
      }
      const out = zipSync(files);
      const blob = new Blob([out.slice().buffer], { type: DOCX_MIME });
      setOutBlob(blob);
      setOutName(filledName(file.name, "docx"));
      setChanges(log);
      setManualFields(manual);
    } catch {
      setError("Couldn't process this .docx — is it a valid Word file?");
    } finally {
      setBusy(false);
    }
  }

  // ── PDF ─────────────────────────────────────────────────────────────────

  async function inspectPdf(buf: ArrayBuffer) {
    setBusy(true);
    setError("");
    try {
      const { PDFDocument, PDFTextField, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFCheckBox } = await import("pdf-lib");
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      const fields = pdf.getForm().getFields();
      if (fields.length === 0) {
        setPdfNoFields(true);
        setPdfFields(null);
        return;
      }
      const c = ctx();
      const ui: PdfFieldUI[] = [];
      for (const f of fields) {
        const name = f.getName();
        const label = name.replace(/[_.\-\d]+/g, " ").trim();
        const suggestion = resolveLabel(c, label) ?? "";
        if (f instanceof PDFTextField) {
          let existing = "";
          try { existing = f.getText() ?? ""; } catch { /* ignore */ }
          ui.push({ name, kind: "text", options: [], value: existing || suggestion, matched: !existing && !!suggestion });
        } else if (f instanceof PDFDropdown || f instanceof PDFOptionList || f instanceof PDFRadioGroup) {
          const options = f.getOptions();
          const match = suggestion
            ? options.find((o) => o.toLowerCase() === suggestion.toLowerCase()) ?? ""
            : "";
          ui.push({ name, kind: "options", options, value: match, matched: !!match });
        } else if (f instanceof PDFCheckBox) {
          ui.push({ name, kind: "checkbox", options: [], value: f.isChecked() ? "on" : "", matched: false });
        }
      }
      setPdfFields(ui);
    } catch {
      setError("Couldn't read this PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  async function fillPdf() {
    if (!file || !fileBuf.current || !pdfFields) return;
    setBusy(true);
    setError("");
    resetOutput();
    try {
      const { PDFDocument, PDFTextField, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFCheckBox } = await import("pdf-lib");
      const pdf = await PDFDocument.load(fileBuf.current, { ignoreEncryption: true });
      const form = pdf.getForm();
      const log: string[] = [];
      for (const ui of pdfFields) {
        try {
          const f = form.getField(ui.name);
          if (f instanceof PDFTextField) {
            if (ui.value) { f.setText(ui.value); log.push(`${ui.name} → ${ui.value}`); }
          } else if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
            if (ui.value) { f.select(ui.value); log.push(`${ui.name} → ${ui.value}`); }
          } else if (f instanceof PDFRadioGroup) {
            if (ui.value) { f.select(ui.value); log.push(`${ui.name} → ${ui.value}`); }
          } else if (f instanceof PDFCheckBox) {
            if (ui.value) { f.check(); log.push(`${ui.name} → checked`); }
            else f.uncheck();
          }
        } catch { /* skip fields that reject the value */ }
      }
      if (flatten) {
        try { form.flatten(); } catch { /* some PDFs can't flatten — keep fields editable */ }
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      setOutBlob(blob);
      setOutName(filledName(file.name, "pdf"));
      setChanges(log);
      setPdfPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError("Couldn't fill this PDF.");
    } finally {
      setBusy(false);
    }
  }

  function setPdfField(i: number, value: string) {
    setPdfFields((prev) => prev ? prev.map((f, idx) => idx === i ? { ...f, value, matched: false } : f) : prev);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {editorOpen !== null && <CreatorProfileEditor defaultOpen={editorOpen} />}

      <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", margin: "0 0 8px" }}>
        This document
      </p>
      <div className="row">
        <div className="field" style={{ flex: "1 1 180px" }}>
          <label htmlFor="if-client">Client / brand name</label>
          <input id="if-client" className="input" value={doc.clientName} placeholder="Acme Cosmetics" onChange={(e) => setD("clientName", e.target.value)} />
        </div>
        <div className="field" style={{ flex: "1 1 120px" }}>
          <label htmlFor="if-no">Invoice #</label>
          <input id="if-no" className="input" value={doc.invoiceNo} placeholder="INV-014" onChange={(e) => setD("invoiceNo", e.target.value)} />
        </div>
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label htmlFor="if-date">Date</label>
          <input id="if-date" className="input" type="date" value={doc.invoiceDate} onChange={(e) => setD("invoiceDate", e.target.value)} />
        </div>
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label htmlFor="if-amt">Amount</label>
          <input id="if-amt" className="input" value={doc.amount} placeholder="₹12,000" onChange={(e) => setD("amount", e.target.value)} />
        </div>
        <div className="field" style={{ flex: "1 1 100%" }}>
          <label htmlFor="if-desc">Description of work (optional)</label>
          <input id="if-desc" className="input" value={doc.description} placeholder="2 Instagram reels + 3 stories, June campaign" onChange={(e) => setD("description", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="if-file">Invoice / document (.docx or .pdf)</label>
        <input
          id="if-file"
          type="file"
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {file && kind === "docx" && (
        <button type="button" className="btn" onClick={fillDocx} disabled={busy}>
          {busy ? "Filling…" : "Auto-fill document"}
        </button>
      )}

      {file && kind === "pdf" && pdfNoFields && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px" }}>
          <p style={{ margin: 0 }}>
            This PDF has no fillable form fields, so there&apos;s nothing to auto-fill. Two options:
            ask the brand for the .docx version (works best), or add text manually with our{" "}
            <a href="/tools/pdf-editor">PDF Editor</a> / <a href="/tools/sign-pdf">Fill &amp; Sign PDF</a>.
          </p>
        </div>
      )}

      {file && kind === "pdf" && pdfFields && (
        <div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Found {pdfFields.length} form field{pdfFields.length === 1 ? "" : "s"} — matched ones are pre-filled. Review, then fill.
          </p>
          {pdfFields.map((f, i) => (
            <div key={f.name} className="row" style={{ alignItems: "center", marginBottom: 4 }}>
              <div className="field" style={{ flex: "1 1 100%", marginBottom: 8 }}>
                <label>
                  {f.name}
                  {f.matched && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · auto-matched</span>}
                </label>
                {f.kind === "text" ? (
                  <input className="input" value={f.value} onChange={(e) => setPdfField(i, e.target.value)} />
                ) : f.kind === "options" ? (
                  <select className="input" value={f.value} onChange={(e) => setPdfField(i, e.target.value)}>
                    <option value="">— leave blank —</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
                    <input type="checkbox" checked={!!f.value} onChange={(e) => setPdfField(i, e.target.checked ? "on" : "")} />
                    Checked
                  </label>
                )}
              </div>
            </div>
          ))}
          <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0 12px", fontSize: 14 }}>
            <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
            Flatten (lock the filled values so they can&apos;t be edited)
          </label>
          <button type="button" className="btn" onClick={fillPdf} disabled={busy}>
            {busy ? "Filling…" : "Fill PDF"}
          </button>
        </div>
      )}

      {outBlob && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className="btn" onClick={() => download(outBlob, outName)}>
              Download {outName}
            </button>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              {changes.length} value{changes.length === 1 ? "" : "s"} filled
            </span>
          </div>

          {changes.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: 14 }}>What was filled</summary>
              <ul style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0", paddingLeft: 20 }}>
                {changes.slice(0, 40).map((c, i) => <li key={i}>{c}</li>)}
                {changes.length > 40 && <li>…and {changes.length - 40} more</li>}
              </ul>
            </details>
          )}

          {kind === "docx" && manualFields.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", margin: "0 0 4px" }}>
                Fill in the rest
              </p>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 10px" }}>
                {manualFields.length} placeholder{manualFields.length === 1 ? "" : "s"} auto-fill couldn&apos;t match — usually the client&apos;s details. Type them in, then update the document.
              </p>
              {manualFields.map((mf) => (
                <div className="field" key={mf.token} style={{ marginBottom: 8 }}>
                  <label>{mf.label}</label>
                  <input
                    className="input"
                    value={manualValues[mf.token] ?? ""}
                    placeholder={mf.token}
                    onChange={(e) => setManualValues((p) => ({ ...p, [mf.token]: e.target.value }))}
                  />
                </div>
              ))}
              <button type="button" className="btn" onClick={fillDocx} disabled={busy}>
                {busy ? "Updating…" : "Update document"}
              </button>
            </div>
          )}

          {kind === "docx" && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", margin: "0 0 8px" }}>
                Preview
              </p>
              {/* Styled renderer (real colors/fonts). Hidden if fallback kicked in. */}
              <div
                ref={previewRef}
                style={{
                  display: previewMode === "html" ? "none" : "block",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  maxHeight: 480, overflow: "auto",
                }}
              />
              {previewMode === "html" && (
                <div
                  style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "18px 22px", maxHeight: 480, overflow: "auto", background: "#fff", color: "#111" }}
                  dangerouslySetInnerHTML={{ __html: docxPreview }}
                />
              )}
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
                {previewMode === "html"
                  ? "Simplified preview — the downloaded file keeps the original colors, fonts and layout."
                  : "The downloaded file keeps the document's original formatting."}
              </p>
            </div>
          )}

          {pdfPreviewUrl && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", margin: "0 0 8px" }}>
                Preview
              </p>
              <iframe
                src={pdfPreviewUrl}
                title="Filled PDF preview"
                style={{ width: "100%", height: 480, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
          )}

          {kind === "pdf" && (
            <SendToTool
              kind="pdf"
              exclude="invoice-filler"
              getFile={() => new File([outBlob], outName, { type: "application/pdf" })}
            />
          )}
        </div>
      )}

      <p className="privacy-note" style={{ marginTop: 16 }}>
        🔒 Your document and saved details never leave your device — filling happens entirely in
        your browser.
      </p>
    </div>
  );
}
