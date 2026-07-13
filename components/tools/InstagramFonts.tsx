"use client";

import { useMemo, useState } from "react";

// ── Unicode style mapping ────────────────────────────────────────────────
// Each style maps A-Z / a-z (and digits where the block has them) onto a
// Mathematical Alphanumeric (or other) Unicode block. Some blocks have holes
// filled from the Letterlike Symbols block — handled via exception maps.

type Mapper = (s: string) => string;

function offsets(upper: number, lower: number, digit?: number, except: Record<string, string> = {}): Mapper {
  return (s) =>
    Array.from(s).map((ch) => {
      if (except[ch]) return except[ch];
      const c = ch.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(upper + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(lower + c - 97);
      if (digit !== undefined && c >= 48 && c <= 57) return String.fromCodePoint(digit + c - 48);
      return ch;
    }).join("");
}

function lookup(upper: string, lower: string, digits?: string): Mapper {
  const U = Array.from(upper), L = Array.from(lower), D = digits ? Array.from(digits) : null;
  return (s) =>
    Array.from(s).map((ch) => {
      const c = ch.codePointAt(0)!;
      if (c >= 65 && c <= 90) return U[c - 65] ?? ch;
      if (c >= 97 && c <= 122) return L[c - 97] ?? ch;
      if (D && c >= 48 && c <= 57) return D[c - 48] ?? ch;
      return ch;
    }).join("");
}

function combining(mark: string): Mapper {
  return (s) => Array.from(s).map((ch) => (ch === " " ? ch : ch + mark)).join("");
}

const bold = offsets(0x1d400, 0x1d41a, 0x1d7ce);
const italic = offsets(0x1d434, 0x1d44e, undefined, { h: "ℎ" });
const boldItalic = offsets(0x1d468, 0x1d482);
const script = offsets(0x1d49c, 0x1d4b6, undefined, {
  B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ", e: "ℯ", g: "ℊ", o: "ℴ",
});
const boldScript = offsets(0x1d4d0, 0x1d4ea);
const fraktur = offsets(0x1d504, 0x1d51e, undefined, { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" });
const boldFraktur = offsets(0x1d56c, 0x1d586);
const doubleStruck = offsets(0x1d538, 0x1d552, 0x1d7d8, {
  C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ",
});
const sans = offsets(0x1d5a0, 0x1d5ba, 0x1d7e2);
const sansBold = offsets(0x1d5d4, 0x1d5ee, 0x1d7ec);
const sansItalic = offsets(0x1d608, 0x1d622);
const sansBoldItalic = offsets(0x1d63c, 0x1d656);
const mono = offsets(0x1d670, 0x1d68a, 0x1d7f6);
const fullwidth: Mapper = (s) =>
  Array.from(s).map((ch) => {
    const c = ch.codePointAt(0)!;
    if (c >= 0x21 && c <= 0x7e) return String.fromCodePoint(c + 0xfee0);
    if (ch === " ") return "　";
    return ch;
  }).join("");
const circled = lookup("ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ", "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", "⓪①②③④⑤⑥⑦⑧⑨");
const filledCircled = lookup("🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩", "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩");
const squared = lookup("🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉", "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉");
const filledSquared = lookup("🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉", "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉");
const smallCaps = lookup("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ");
const superscript = lookup("ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂXYZ", "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ", "⁰¹²³⁴⁵⁶⁷⁸⁹");
const upsideDownMap: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l",
  m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
  y: "ʎ", z: "z", A: "∀", B: "𐐒", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ",
  K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ò", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ",
  W: "M", X: "X", Y: "⅄", Z: "Z", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9",
  "7": "ㄥ", "8": "8", "9": "6", "0": "0", ".": "˙", ",": "'", "?": "¿", "!": "¡", "'": ",", "&": "⅋",
};
const upsideDown: Mapper = (s) => Array.from(s).map((ch) => upsideDownMap[ch] ?? ch).reverse().join("");

const STYLES: { name: string; fn: Mapper }[] = [
  { name: "Bold", fn: bold },
  { name: "Italic", fn: italic },
  { name: "Bold italic", fn: boldItalic },
  { name: "Cursive / script", fn: script },
  { name: "Bold cursive", fn: boldScript },
  { name: "Sans bold", fn: sansBold },
  { name: "Sans italic", fn: sansItalic },
  { name: "Sans bold-italic", fn: sansBoldItalic },
  { name: "Sans", fn: sans },
  { name: "Double-struck", fn: doubleStruck },
  { name: "Gothic / fraktur", fn: fraktur },
  { name: "Bold gothic", fn: boldFraktur },
  { name: "Monospace", fn: mono },
  { name: "Small caps", fn: smallCaps },
  { name: "Bubble", fn: circled },
  { name: "Filled bubble", fn: filledCircled },
  { name: "Squared", fn: squared },
  { name: "Filled squared", fn: filledSquared },
  { name: "Fullwidth", fn: fullwidth },
  { name: "Superscript", fn: superscript },
  { name: "Upside down", fn: upsideDown },
  { name: "Strikethrough", fn: combining("̶") },
  { name: "Underline", fn: combining("̲") },
  { name: "Sparkle cursive", fn: (s) => `✧ ${script(s)} ✧` },
  { name: "Starry bold-italic", fn: (s) => `⋆·˚ ${boldItalic(s)} ˚·⋆` },
  { name: "Framed fullwidth", fn: (s) => `【${fullwidth(s.trim())}】` },
  { name: "Ornate bold cursive", fn: (s) => `꧁ ${boldScript(s)} ꧂` },
  { name: "Hearts", fn: (s) => `♡ ${sansBold(s)} ♡` },
];

export default function InstagramFonts() {
  const [text, setText] = useState("Your name");
  const [copied, setCopied] = useState<number | null>(null);

  const rendered = useMemo(() => STYLES.map((s) => s.fn(text || "Your name")), [text]);

  function copy(i: number) {
    navigator.clipboard.writeText(rendered[i]).then(() => {
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    });
  }

  return (
    <div>
      <div className="field">
        <label>Your text</label>
        <input type="text" className="input" value={text} maxLength={150}
          onChange={(e) => setText(e.target.value)} placeholder="Your name" />
      </div>

      {/* Bio preview */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {copied !== null ? rendered[copied] : rendered[3]}
          </div>
          <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>Bio preview — tap a style below to copy</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {STYLES.map((s, i) => (
          <button key={s.name} type="button" onClick={() => copy(i)}
            style={{
              background: "transparent", border: "1px solid var(--border)", borderRadius: 8,
              padding: "10px 12px", cursor: "pointer", textAlign: "left", color: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", color: "var(--muted)", fontSize: ".72rem", marginBottom: 2 }}>{s.name}</span>
              <span style={{ fontSize: "1.05rem", wordBreak: "break-word" }}>{rendered[i]}</span>
            </span>
            <span style={{ color: "var(--accent)", fontSize: ".8rem", flexShrink: 0 }}>
              {copied === i ? "Copied ✓" : "Copy"}
            </span>
          </button>
        ))}
      </div>

      <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 12 }}>
        Tap a style to copy, then paste it into your Instagram bio, caption or story — works on TikTok,
        X, Discord and WhatsApp too. Use styled text as an accent; screen readers struggle with whole
        paragraphs of it.
      </p>

      <p className="privacy-note">🔒 Everything runs in your browser — nothing you type is uploaded.</p>
    </div>
  );
}
