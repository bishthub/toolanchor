import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Generated favicon. ASCII only (Satori can't fetch glyph fonts offline).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#5b6dff,#b59bff)", color: "#fff",
          fontSize: 40, fontWeight: 700, borderRadius: 14,
        }}
      >
        T
      </div>
    ),
    size
  );
}
