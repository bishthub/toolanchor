"use client";

import { useMemo, useState } from "react";

const MIMES: [string, string][] = [
  [".aac", "audio/aac"], [".avi", "video/x-msvideo"], [".bin", "application/octet-stream"],
  [".bmp", "image/bmp"], [".css", "text/css"], [".csv", "text/csv"], [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".gif", "image/gif"], [".gz", "application/gzip"], [".htm", "text/html"], [".html", "text/html"],
  [".ico", "image/vnd.microsoft.icon"], [".jpeg", "image/jpeg"], [".jpg", "image/jpeg"],
  [".js", "text/javascript"], [".json", "application/json"], [".mjs", "text/javascript"],
  [".mp3", "audio/mpeg"], [".mp4", "video/mp4"], [".mpeg", "video/mpeg"], [".otf", "font/otf"],
  [".png", "image/png"], [".pdf", "application/pdf"], [".php", "application/x-httpd-php"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".rar", "application/vnd.rar"], [".rtf", "application/rtf"], [".svg", "image/svg+xml"],
  [".tar", "application/x-tar"], [".txt", "text/plain"], [".ttf", "font/ttf"], [".wav", "audio/wav"],
  [".weba", "audio/webm"], [".webm", "video/webm"], [".webp", "image/webp"], [".woff", "font/woff"],
  [".woff2", "font/woff2"], [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".xml", "application/xml"], [".zip", "application/zip"], [".7z", "application/x-7z-compressed"],
];

export default function MimeTypeLookup() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^\./, "");
    if (!t) return MIMES;
    return MIMES.filter(([ext, mime]) => ext.includes(t) || mime.toLowerCase().includes(t));
  }, [q]);

  return (
    <div>
      <div className="field">
        <label>Search by extension or MIME type</label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder=".pdf, image, application/json…" />
      </div>
      <ul className="file-list">
        {list.map(([ext, mime]) => (
          <li key={ext}>
            <strong className="mono">{ext}</strong>
            <span className="mono" style={{ marginLeft: "auto", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mime}</span>
          </li>
        ))}
        {!list.length && <li>No match for “{q}”.</li>}
      </ul>
    </div>
  );
}
