"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import SendToTool from "@/components/SendToTool";

interface Item { id: string; name: string; file: File; url: string; }

/** Re-encode any image to a PNG data the browser produced, for non-JPG/PNG inputs. */
async function toPngBytes(file: File): Promise<Uint8Array> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function JpgToPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed from files handed off by another tool or the universal drop zone.
  useEffect(() => {
    const imgs = (initialFiles ?? []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setItems(
      imgs.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, file: f, url: URL.createObjectURL(f) }))
    );
  }, [initialFiles]);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, file: f, url: URL.createObjectURL(f) })),
    ]);
    e.target.value = "";
  }
  function remove(id: string) { setItems((p) => p.filter((i) => i.id !== id)); }
  function move(i: number, d: -1 | 1) {
    setItems((prev) => {
      const next = [...prev]; const t = i + d;
      if (t < 0 || t >= next.length) return prev;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  }

  async function buildPdfBlob(): Promise<Blob> {
    const pdf = await PDFDocument.create();
    for (const item of items) {
      const buf = new Uint8Array(await item.file.arrayBuffer());
      const isJpg = /\.jpe?g$/i.test(item.name) || item.file.type === "image/jpeg";
      const isPng = /\.png$/i.test(item.name) || item.file.type === "image/png";
      const embedded = isJpg
        ? await pdf.embedJpg(buf)
        : isPng
        ? await pdf.embedPng(buf)
        : await pdf.embedPng(await toPngBytes(item.file));
      const page = pdf.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }
    const bytes = await pdf.save();
    return new Blob([bytes.slice().buffer], { type: "application/pdf" });
  }

  async function create() {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await buildPdfBlob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not build the PDF from these images.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Add image files (JPG, PNG, WebP…)</label>
        <input type="file" accept="image/*" multiple onChange={addFiles} className="input" />
      </div>

      {items.length > 0 && (
        <ul className="file-list">
          {items.map((item, i) => (
            <li key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" width={32} height={32} style={{ objectFit: "cover", borderRadius: 4 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
              <button className="x" onClick={() => move(i, -1)} disabled={i === 0} title="Up">↑</button>
              <button className="x" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Down">↓</button>
              <span className="x" onClick={() => remove(item.id)} title="Remove">✕</span>
            </li>
          ))}
        </ul>
      )}

      <button className="btn" onClick={create} disabled={!items.length || busy}>
        {busy ? "Creating…" : "⬇ Create PDF"}
      </button>

      {items.length > 0 && (
        <SendToTool
          kind="pdf"
          exclude="jpg-to-pdf"
          getFile={async () => {
            try { return new File([await buildPdfBlob()], "images.pdf", { type: "application/pdf" }); }
            catch { return null; }
          }}
        />
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Images are converted in your browser — never uploaded.</p>
    </div>
  );
}
