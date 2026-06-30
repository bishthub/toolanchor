"use client";

import { useEffect, useState } from "react";

interface Row { label: string; value: string; }

export default function ImageMetadataViewer({ initialFiles }: { initialFiles?: File[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) run(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) run(f);
  }

  async function run(file: File) {
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    setRows(null);
    setGps(null);
    setEmpty(false);
    try {
      const exifr = (await import("exifr")).default;
      const data = await exifr.parse(file, true).catch(() => null);
      const out: Row[] = [];
      const push = (label: string, v: unknown) => {
        if (v === undefined || v === null || v === "") return;
        out.push({ label, value: v instanceof Date ? v.toLocaleString() : String(v) });
      };
      if (data) {
        push("Camera make", data.Make);
        push("Camera model", data.Model);
        push("Lens", data.LensModel);
        push("Date taken", data.DateTimeOriginal || data.CreateDate);
        push("Software", data.Software);
        push("Dimensions", data.ExifImageWidth && data.ExifImageHeight ? `${data.ExifImageWidth} × ${data.ExifImageHeight}` : undefined);
        push("Exposure", data.ExposureTime ? `${data.ExposureTime}s` : undefined);
        push("Aperture", data.FNumber ? `f/${data.FNumber}` : undefined);
        push("ISO", data.ISO);
        push("Focal length", data.FocalLength ? `${data.FocalLength}mm` : undefined);
        push("Orientation", data.Orientation);
        push("Artist / author", data.Artist || data.Creator);
        push("Copyright", data.Copyright);
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          setGps({ lat: data.latitude, lon: data.longitude });
          push("GPS latitude", data.latitude.toFixed(6));
          push("GPS longitude", data.longitude.toFixed(6));
        }
      }
      setRows(out);
      setEmpty(out.length === 0);
    } catch {
      setEmpty(true);
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" disabled={busy} />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="preview" className="preview-img" style={{ maxHeight: 220 }} />}
      {busy && <p style={{ color: "var(--muted)", marginTop: 10 }}>Reading metadata…</p>}

      {gps && (
        <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: ".85rem" }}>
          📍 <strong>This photo contains GPS location.</strong>{" "}
          <a href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=15/${gps.lat}/${gps.lon}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>View on map →</a>{" "}
          Consider removing it before sharing.
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="file-list" style={{ marginTop: 14 }}>
          {rows.map((r, i) => (
            <li key={i}><span style={{ color: "var(--muted)" }}>{r.label}</span><span style={{ marginLeft: "auto", textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}>{r.value}</span></li>
          ))}
        </ul>
      )}
      {empty && <p style={{ color: "var(--muted)", marginTop: 12 }}>No metadata found — this image has no EXIF data (it may already be clean, a screenshot, or re-saved).</p>}

      <p className="privacy-note">🔒 Metadata is read in your browser — your image is never uploaded.</p>
    </div>
  );
}
