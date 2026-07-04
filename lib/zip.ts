// ─────────────────────────────────────────────────────────────────────────
// Bundle a set of in-memory files into a .zip and trigger a download.
// Uses fflate (tiny, fast, no deps). Everything happens in the browser — the
// files are never uploaded. Store-only (level 0) since images/PDFs are already
// compressed, so zipping is near-instant and won't waste CPU on big batches.
// ─────────────────────────────────────────────────────────────────────────

export interface ZipEntry {
  name: string;
  data: Blob | Uint8Array;
}

export async function downloadAsZip(entries: ZipEntry[], zipName: string): Promise<void> {
  const { zip } = await import("fflate");

  // De-duplicate names (two "photo.jpg" inputs would otherwise collide).
  const used = new Set<string>();
  const files: Record<string, Uint8Array> = {};
  for (const e of entries) {
    const bytes = e.data instanceof Blob ? new Uint8Array(await e.data.arrayBuffer()) : e.data;
    let name = e.name;
    if (used.has(name)) {
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let i = 2;
      while (used.has(`${base}-${i}${ext}`)) i++;
      name = `${base}-${i}${ext}`;
    }
    used.add(name);
    files[name] = bytes;
  }

  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 0 }, (err, out) => (err ? reject(err) : resolve(out)));
  });

  const blob = new Blob([zipped.slice().buffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName.endsWith(".zip") ? zipName : `${zipName}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
