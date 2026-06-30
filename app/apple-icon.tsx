import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same anchor mark as the SVG favicon, rasterised to PNG for iOS home screens.
// Rendered as an <img> data-URI so Satori needs no glyph fonts.
const ANCHOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6dff"/><stop offset="1" stop-color="#b59bff"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="16" r="5"/><path d="M32 21v28"/><path d="M21 28h22"/><path d="M15 36a17 17 0 0 0 34 0"/></g></svg>`;

export default function AppleIcon() {
  const uri = "data:image/svg+xml;utf8," + encodeURIComponent(ANCHOR_SVG);
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={180} height={180} src={uri} alt="" />
      </div>
    ),
    size
  );
}
