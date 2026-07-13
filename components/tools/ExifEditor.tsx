"use client";

import { useEffect, useState } from "react";

// EXIF datetime format: "YYYY:MM:DD HH:MM:SS" ↔ <input type="datetime-local"> "YYYY-MM-DDTHH:MM"
function exifToLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  const m = v.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : "";
}
function localToExif(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6] ?? "00"}` : "";
}

export default function ExifEditor({ initialFiles }: { initialFiles?: File[] }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("photo.jpg");
  const [hadExif, setHadExif] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [dateTaken, setDateTaken] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [artist, setArtist] = useState("");
  const [copyright, setCopyright] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "image/jpeg");
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function load(f: File) {
    setError(null); setSaved(false);
    if (!/jpe?g$/i.test(f.type) && !/\.jpe?g$/i.test(f.name)) {
      setError("EXIF editing works on JPEG photos. PNG and WebP use different metadata schemes.");
      return;
    }
    setFileName(f.name);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("read failed"));
        r.readAsDataURL(f);
      });
      setDataUrl(url);
      const piexif = await import("piexif-ts");
      let exif: import("piexif-ts").IExif = {};
      try { exif = piexif.load(url); } catch { /* no/broken EXIF — start empty */ }
      const zeroth = exif["0th"] ?? {};
      const exifIfd = exif.Exif ?? {};
      const gps = exif.GPS ?? {};
      const T = piexif.TagValues;
      setHadExif(Object.keys(zeroth).length + Object.keys(exifIfd).length + Object.keys(gps).length > 0);
      setDateTaken(exifToLocal(exifIfd[T.ExifIFD.DateTimeOriginal] ?? zeroth[T.ImageIFD.DateTime]));
      setArtist(typeof zeroth[T.ImageIFD.Artist] === "string" ? zeroth[T.ImageIFD.Artist] : "");
      setCopyright(typeof zeroth[T.ImageIFD.Copyright] === "string" ? zeroth[T.ImageIFD.Copyright] : "");
      setDescription(typeof zeroth[T.ImageIFD.ImageDescription] === "string" ? zeroth[T.ImageIFD.ImageDescription] : "");
      const latDms = gps[T.GPSIFD.GPSLatitude], latRef = gps[T.GPSIFD.GPSLatitudeRef];
      const lonDms = gps[T.GPSIFD.GPSLongitude], lonRef = gps[T.GPSIFD.GPSLongitudeRef];
      if (Array.isArray(latDms) && typeof latRef === "string" && Array.isArray(lonDms) && typeof lonRef === "string") {
        setLat(piexif.GPSHelper.dmsRationalToDeg(latDms, latRef).toFixed(6));
        setLon(piexif.GPSHelper.dmsRationalToDeg(lonDms, lonRef).toFixed(6));
      } else {
        setLat(""); setLon("");
      }
    } catch (err) {
      console.error(err);
      setError("Could not read this file. Is it a valid JPEG?");
      setDataUrl(null);
    }
  }

  async function save() {
    if (!dataUrl) return;
    setError(null); setSaved(false);
    try {
      const piexif = await import("piexif-ts");
      const T = piexif.TagValues;
      let exif: import("piexif-ts").IExif = {};
      try { exif = piexif.load(dataUrl); } catch { /* start fresh */ }
      const zeroth = { ...(exif["0th"] ?? {}) };
      const exifIfd = { ...(exif.Exif ?? {}) };

      const exifDate = localToExif(dateTaken);
      if (exifDate) {
        exifIfd[T.ExifIFD.DateTimeOriginal] = exifDate;
        exifIfd[T.ExifIFD.DateTimeDigitized] = exifDate;
        zeroth[T.ImageIFD.DateTime] = exifDate;
      } else {
        delete exifIfd[T.ExifIFD.DateTimeOriginal];
        delete exifIfd[T.ExifIFD.DateTimeDigitized];
        delete zeroth[T.ImageIFD.DateTime];
      }
      for (const [tag, value] of [
        [T.ImageIFD.Artist, artist],
        [T.ImageIFD.Copyright, copyright],
        [T.ImageIFD.ImageDescription, description],
      ] as [number, string][]) {
        if (value.trim()) zeroth[tag] = value.trim();
        else delete zeroth[tag];
      }

      const latN = parseFloat(lat), lonN = parseFloat(lon);
      let gps: import("piexif-ts").IExifElement | undefined;
      if (Number.isFinite(latN) && Number.isFinite(lonN)) {
        if (Math.abs(latN) > 90 || Math.abs(lonN) > 180) {
          setError("Latitude must be between -90 and 90, longitude between -180 and 180.");
          return;
        }
        gps = {
          [T.GPSIFD.GPSVersionID]: [2, 3, 0, 0],
          [T.GPSIFD.GPSLatitudeRef]: latN >= 0 ? "N" : "S",
          [T.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(Math.abs(latN)),
          [T.GPSIFD.GPSLongitudeRef]: lonN >= 0 ? "E" : "W",
          [T.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(Math.abs(lonN)),
        };
      }

      const newExif: import("piexif-ts").IExif = { ...exif, "0th": zeroth, Exif: exifIfd };
      if (gps) newExif.GPS = gps; else delete newExif.GPS;

      // Rewrite only the metadata segment — pixels are copied through untouched.
      const out = piexif.insert(piexif.dump(newExif), piexif.remove(dataUrl));
      const bin = atob(out.split(",")[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
      a.download = fileName.replace(/\.jpe?g$/i, "") + "-edited.jpg";
      a.click();
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Could not write the metadata. Try another JPEG.");
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a JPEG photo</label>
        <input type="file" accept="image/jpeg,.jpg,.jpeg" className="input"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} />
      </div>

      {dataUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="preview" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 6, border: "1px solid var(--border)", display: "block", marginBottom: 12 }} />

          {!hadExif && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              No EXIF found in this photo — fields you fill in will be added.
            </p>
          )}

          <div className="field">
            <label>Date taken</label>
            <input type="datetime-local" className="input" value={dateTaken} onChange={(e) => setDateTaken(e.target.value)} />
          </div>

          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>GPS latitude</label>
              <input type="number" step="any" className="input" placeholder="e.g. 40.712800" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>GPS longitude</label>
              <input type="number" step="any" className="input" placeholder="e.g. -74.006000" value={lon} onChange={(e) => setLon(e.target.value)} />
            </div>
          </div>
          {(lat || lon) && (
            <div className="row" style={{ marginBottom: 8 }}>
              <button type="button" className="btn secondary" onClick={() => { setLat(""); setLon(""); }}>Remove GPS location</button>
            </div>
          )}

          <div className="field">
            <label>Artist / photographer</label>
            <input type="text" className="input" value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>
          <div className="field">
            <label>Copyright</label>
            <input type="text" className="input" value={copyright} onChange={(e) => setCopyright(e.target.value)} />
          </div>
          <div className="field">
            <label>Description</label>
            <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <button className="btn" onClick={save}>⬇ Download updated JPEG</button>
          {saved && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10 }}>
              ✓ Saved. Only the metadata was rewritten — the image pixels are untouched, so there is zero quality loss.
            </p>
          )}
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      <p className="privacy-note">🔒 Reading and writing EXIF happens entirely in your browser — your photo is never uploaded.</p>
    </div>
  );
}
