// ─────────────────────────────────────────────────────────────────────────
// The document fill engine behind Invoice Auto-Filler. Pure text logic
// (placeholders, "Label: ____" blanks) lives here so it's testable and
// reusable; the DOCX DOM transform is here too but only runs in the
// browser (it needs DOMParser).
// ─────────────────────────────────────────────────────────────────────────

import {
  CreatorProfile, matchLabel, valueFor, PLACEHOLDER_ALIASES, normalizeKey,
} from "./creatorProfile";

export const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export interface DocFields {
  clientName: string; invoiceNo: string; invoiceDate: string;
  amount: string; description: string;
}

export const BLANK_DOC: DocFields = {
  clientName: "", invoiceNo: "", invoiceDate: "", amount: "", description: "",
};

const DOC_ALIASES: Record<string, keyof DocFields> = {
  amount: "amount", amt: "amount", total: "amount", totalamount: "amount",
  grandtotal: "amount", amountpayable: "amount", totaldue: "amount", price: "amount",
  invoiceno: "invoiceNo", invoicenumber: "invoiceNo", invoicenum: "invoiceNo",
  invno: "invoiceNo", billno: "invoiceNo", billnumber: "invoiceNo", invoice: "invoiceNo",
  date: "invoiceDate", invoicedate: "invoiceDate", billdate: "invoiceDate",
  issuedate: "invoiceDate", dateofissue: "invoiceDate",
  client: "clientName", clientname: "clientName", brand: "clientName",
  brandname: "clientName", company: "clientName", companyname: "clientName",
  billto: "clientName", buyer: "clientName", buyername: "clientName",
  description: "description", particulars: "description", service: "description",
  servicedescription: "description", workdescription: "description",
};

const DOC_LABEL_RULES: { key: keyof DocFields; re: RegExp }[] = [
  { key: "invoiceNo", re: /invoice\s*(no|num|number|#)|bill\s*(no|num|number)/i },
  { key: "amount", re: /\bamount\b|grand\s*total|total\s*(payable|due|amount)|\btotal\b/i },
  { key: "clientName", re: /client|brand|bill\s*to|buyer/i },
  { key: "description", re: /description|particulars|service\s*(details?|provided)/i },
  { key: "invoiceDate", re: /\bdated?\b/i },
];

/** yyyy-mm-dd → dd/mm/yyyy for display inside documents. */
export function docDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export interface FillCtx {
  profile: CreatorProfile;
  doc: DocFields;
  /** Manual values the user typed for placeholders auto-fill couldn't resolve,
   *  keyed by the exact token text (brackets included, e.g. "[Address Line 1]"). */
  overrides?: Record<string, string>;
}

/** A placeholder left unresolved after auto-fill, offered for manual entry. */
export interface ManualField { token: string; label: string }

/** "[DD/MM/YYYY]"-style date-format hints inside placeholders. */
function isDatePattern(s: string): boolean {
  const t = s.trim();
  return /^[dmy\/\-. ]{6,12}$/i.test(t) && /d/i.test(t) && /m/i.test(t) && /y/i.test(t);
}

// Filler words stripped before fuzzy-matching bracket text like
// "[Your Complete Address with Pincode]" or "[Enter Your UPI ID here]".
const STRIP_WORDS_RE = /\b(your|my|enter|please|type|add|insert|here|the|a|an|or|primary|complete|full|valid|registered|available|if)\b/gi;

export function resolvePlaceholder(ctx: FillCtx, rawKey: string): string | null {
  const n = normalizeKey(rawKey);
  if (!n) return null;
  if (n in DOC_ALIASES) {
    const k = DOC_ALIASES[n];
    const v = k === "invoiceDate" ? docDate(ctx.doc.invoiceDate) : ctx.doc[k];
    if (v.trim()) return v.trim();
  }
  if (n in PLACEHOLDER_ALIASES) {
    const k = PLACEHOLDER_ALIASES[n];
    const v = k === "dob" ? docDate(ctx.profile.dob) : valueFor(ctx.profile, k);
    if (v.trim()) return v.trim();
  }
  // "[DD/MM/YYYY]" → the invoice date.
  if (isDatePattern(rawKey)) return ctx.doc.invoiceDate ? docDate(ctx.doc.invoiceDate) : null;
  // Natural-language placeholders — "[Your Full Name]", "[My IFSC]". Only
  // when "your"/"my" marks it as the user's own data: bare labels like
  // "[Address Line 1]" may belong to the OTHER party, so they're left alone.
  if (/\b(your|my)\b/i.test(rawKey)) {
    return resolveLabel(ctx, rawKey.replace(STRIP_WORDS_RE, " ").replace(/\s+/g, " ").trim());
  }
  return null;
}

export function resolveLabel(ctx: FillCtx, label: string): string | null {
  const l = label.trim();
  if (!l || l.length > 60) return null;
  if (/birth|\bdob\b/i.test(l)) return ctx.profile.dob ? docDate(ctx.profile.dob) : null;
  for (const r of DOC_LABEL_RULES) {
    if (r.re.test(l)) {
      const v = r.key === "invoiceDate" ? docDate(ctx.doc.invoiceDate) : ctx.doc[r.key];
      return v.trim() || null;
    }
  }
  const k = matchLabel(l);
  if (!k) return null;
  const v = k === "dob" ? docDate(ctx.profile.dob) : valueFor(ctx.profile, k);
  return v.trim() || null;
}

const BRACKET_RES = [
  /\{\{\s*([^{}]+?)\s*\}\}/g,
  /\{\s*([^{}]+?)\s*\}/g,
  /\[\s*([^[\]]+?)\s*\]/g,
  /<<\s*([^<>]+?)\s*>>/g,
];
const LABEL_CHARS = "[A-Za-z][A-Za-z .\\/&()'’#]{1,50}?";
const LABEL_BLANK_RE = new RegExp(`(${LABEL_CHARS})\\s*([:\\-–—]?)\\s*(_{3,}|\\.{5,})`, "g");
const LABEL_TAIL_RE = new RegExp(`^\\s*(${LABEL_CHARS})\\s*[:\\-–—]\\s*$`);
// "Label: [leftover placeholder]" — a bracket the placeholder pass couldn't
// resolve, but whose preceding label can (e.g. "Account No: [enter digits]").
const LABEL_BRACKET_RE = new RegExp(`(${LABEL_CHARS})\\s*([:\\-–—])\\s*[\\[{<]{1,2}[^\\[\\]{}<>]*[\\]}>]{1,2}`, "g");
/** A paragraph/cell that is nothing but one bracketed placeholder. */
export const LONE_BRACKET_RE = /^\s*[[{<]{1,2}[^[\]{}<>]*[\]}>]{1,2}\s*$/;

export interface FillOpts {
  /** Skip the trailing-"Label:" rule — used inside table cells, where a lone
   *  label's value belongs in the adjacent cell, not appended to the label. */
  noTail?: boolean;
}

/** Fill one run of plain text. `log` collects human-readable changes. */
export function fillText(ctx: FillCtx, text: string, log?: string[], opts?: FillOpts): string {
  let out = text;
  for (const re of BRACKET_RES) {
    out = out.replace(re, (m, key: string) => {
      const v = resolvePlaceholder(ctx, key);
      if (v === null) return m;
      log?.push(`${m.trim()} → ${v}`);
      return v;
    });
  }
  out = out.replace(LABEL_BRACKET_RE, (m, label: string, sep: string) => {
    const v = resolveLabel(ctx, label);
    if (v === null) return m;
    log?.push(`${label.trim()} → ${v}`);
    return `${label.trim()}${sep} ${v}`;
  });
  out = out.replace(LABEL_BLANK_RE, (m, label: string, sep: string) => {
    const v = resolveLabel(ctx, label);
    if (v === null) return m;
    log?.push(`${label.trim()} → ${v}`);
    return `${label.trim()}${sep || ":"} ${v}`;
  });
  if (!opts?.noTail) {
    const tail = out.match(LABEL_TAIL_RE);
    if (tail) {
      const v = resolveLabel(ctx, tail[1]);
      if (v !== null) {
        log?.push(`${tail[1].trim()} → ${v}`);
        out = `${out.replace(/\s+$/, "")} ${v}`;
      }
    }
  }
  // Manual values the user typed for leftover placeholders — a literal
  // replacement of the exact token, applied after every auto-fill rule.
  if (ctx.overrides) {
    for (const token in ctx.overrides) {
      const v = ctx.overrides[token]?.trim();
      if (v && out.includes(token)) {
        out = out.split(token).join(v);
        log?.push(`${token} → ${v}`);
      }
    }
  }
  return out;
}

// ── DOCX DOM transform (browser-only: needs DOMParser/XMLSerializer) ─────

function textOf(nodes: Element[]): string {
  return nodes.map((t) => t.textContent ?? "").join("");
}

// Placeholder shapes offered for manual entry. Single "{…}" is excluded on
// purpose — it double-matches inside "{{…}}" and is rare in real templates.
const MANUAL_BRACKET_RES = [
  /\{\{\s*[^{}]+?\s*\}\}/g,
  /\[\s*[^[\]]+?\s*\]/g,
  /<<\s*[^<>]+?\s*>>/g,
];

/** Scan a (already auto-filled) document for placeholders still left over, so
 *  the UI can offer them as manual inputs. Deduped by token; the label is the
 *  preceding "Word:" if there is one, else the text inside the brackets. */
export function collectManualFields(xmlDoc: Document): ManualField[] {
  const found = new Map<string, string>();
  for (const p of Array.from(xmlDoc.getElementsByTagName("w:p"))) {
    const text = textOf(Array.from(p.getElementsByTagName("w:t")));
    if (!text.trim()) continue;
    for (const re of MANUAL_BRACKET_RES) {
      for (const m of text.matchAll(re)) {
        const token = m[0];
        if (found.has(token)) continue;
        const inner = token.replace(/^[[{<]+\s*/, "").replace(/\s*[\]}>]+$/, "").trim();
        const before = text.slice(0, m.index);
        const lab = before.match(/([A-Za-z][A-Za-z .\/&()'’#-]{1,40}?)\s*[:\-–—]\s*$/);
        found.set(token, (lab ? lab[1] : inner).trim() || token);
      }
    }
  }
  return [...found].map(([token, label]) => ({ token, label }));
}

export function transformXml(xmlDoc: Document, ctx: FillCtx, log: string[]): boolean {
  let changed = false;

  const paras = Array.from(xmlDoc.getElementsByTagName("w:p"));
  // Original text of every paragraph, captured before any edits — used for
  // "label above, placeholder below" layouts.
  const paraTexts = paras.map((p) => textOf(Array.from(p.getElementsByTagName("w:t"))));
  const inCellFlags = paras.map((p) => {
    for (let a: Node | null = p.parentNode; a; a = a.parentNode) {
      if (a.nodeName === "w:tc") return true;
    }
    return false;
  });

  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    const ts = Array.from(p.getElementsByTagName("w:t"));
    if (ts.length === 0) continue;
    const joined = textOf(ts);
    if (!joined.trim()) continue;
    // Skip the trailing-"Label:" append when the value belongs elsewhere:
    // inside a table cell (adjacent cell gets it), when the NEXT paragraph
    // is a placeholder ("Invoice Number:" above "[Enter Unique Number]"),
    // or when this is a heading directly above a table ("Payment Details:").
    const nextIsPlaceholder = i + 1 < paraTexts.length && LONE_BRACKET_RE.test(paraTexts[i + 1]);
    const nextStartsTable = !inCellFlags[i] && i + 1 < paras.length && inCellFlags[i + 1];
    const opts = { noTail: inCellFlags[i] || nextIsPlaceholder || nextStartsTable };
    let filled = fillText(ctx, joined, log, opts);
    // A placeholder-only paragraph that didn't resolve on its own: try the
    // PREVIOUS paragraph as its label ("Invoice Date:" → "[DD/MM/YYYY]") —
    // but never another placeholder ("[Address Line 1]" is not a label).
    if (filled === joined && LONE_BRACKET_RE.test(joined) && i > 0 && !LONE_BRACKET_RE.test(paraTexts[i - 1])) {
      const prevLabel = paraTexts[i - 1].trim().replace(/[:\-–—]\s*$/, "").trim();
      const v = prevLabel ? resolveLabel(ctx, prevLabel) : null;
      if (v !== null) {
        filled = v;
        log.push(`${prevLabel} → ${v}`);
      }
    }
    if (filled === joined) continue;
    changed = true;
    // Try per-run replacement first so formatting survives; if a match
    // spanned multiple runs, collapse the paragraph text into the first run.
    for (const t of ts) {
      const cur = t.textContent ?? "";
      const nf = fillText(ctx, cur, undefined, opts);
      if (nf !== cur) {
        t.textContent = nf;
        t.setAttribute("xml:space", "preserve");
      }
    }
    if (textOf(ts) !== filled) {
      ts[0].textContent = filled;
      ts[0].setAttribute("xml:space", "preserve");
      for (const t of ts.slice(1)) t.textContent = "";
    }
  }

  // Invoice tables: a label cell followed by an empty cell → fill the empty one.
  for (const row of Array.from(xmlDoc.getElementsByTagName("w:tr"))) {
    const cells = Array.from(row.children).filter((c) => c.tagName === "w:tc");
    for (let i = 0; i + 1 < cells.length; i++) {
      const label = textOf(Array.from(cells[i].getElementsByTagName("w:t")))
        .trim().replace(/[:\-–—]\s*$/, "").trim();
      if (!label || label.length > 60) continue;
      const next = cells[i + 1];
      const nextText = textOf(Array.from(next.getElementsByTagName("w:t"))).trim();
      // Fillable: empty, a blank run (___), or a still-unresolved placeholder.
      if (nextText !== "" && !/^[_.\s-]+$/.test(nextText) && !LONE_BRACKET_RE.test(nextText)) continue;
      const v = resolveLabel(ctx, label);
      if (v === null) continue;
      const ts = Array.from(next.getElementsByTagName("w:t"));
      if (ts.length > 0) {
        ts[0].textContent = v;
        ts[0].setAttribute("xml:space", "preserve");
        for (const t of ts.slice(1)) t.textContent = "";
      } else {
        const para = next.getElementsByTagName("w:p")[0];
        if (!para) continue;
        const r = xmlDoc.createElementNS(W_NS, "w:r");
        const t = xmlDoc.createElementNS(W_NS, "w:t");
        t.textContent = v;
        r.appendChild(t);
        para.appendChild(r);
      }
      log.push(`${label} → ${v}`);
      changed = true;
    }
  }

  return changed;
}
