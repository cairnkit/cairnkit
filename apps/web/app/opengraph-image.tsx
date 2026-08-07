import { ImageResponse } from "next/og";
import { site } from "./site";

export const runtime = "edge";
export const alt = site.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "72px", background: "#08090c", color: "#f2f3f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#818cf8" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
            <ellipse cx="12" cy="18.7" rx="9.2" ry="2.7" />
            <ellipse cx="13" cy="12.2" rx="6.6" ry="2.5" />
            <ellipse cx="10.9" cy="6" rx="4.4" ry="2.25" />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600 }}>Cairn</span>
        </div>
        <div style={{ fontSize: 62, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 30 }}>
          Product tours that fail
          <br />
          your build, not your users.
        </div>
        <div style={{ fontSize: 26, color: "#9aa0ac", marginTop: 26 }}>
          npm i @cairnkit/react
        </div>
      </div>
    ),
    size,
  );
}
