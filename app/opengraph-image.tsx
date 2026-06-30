import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { LIVE_TOOLS } from "@/lib/tools";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — free online tools`;

// ASCII only — Satori can't fetch glyph/emoji fonts during an offline build.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: 80, color: "#eef1f8",
          background: "linear-gradient(135deg,#0a0c12 0%,#141a2e 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#7c8cff" }}>{SITE_NAME}</div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.1, marginTop: 24, maxWidth: 1040, letterSpacing: -1 }}>
          {LIVE_TOOLS.length}+ free tools, right in your browser.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#98a2ba", marginTop: 24, maxWidth: 1000 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size
  );
}
