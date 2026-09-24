import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%", height: "100%", display: "flex",
        flexDirection: "column", justifyContent: "space-between",
        background: "#0a0a0a", color: "#ededed", padding: "72px",
        fontFamily: "sans-serif", borderLeft: "16px solid #8b7fd4",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, color: "#b8adef" }}>
        PORTFOLIO · PHILIPPINES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 700 }}>{site.name}</div>
        <div style={{ fontSize: 36 }}>Full-Stack &amp; Mobile Developer</div>
        <div style={{ fontSize: 26, color: "#b8adef" }}>Flutter · Web applications · Backend systems</div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: "#aaaaaa" }}>
        reycezartigley.work
      </div>
    </div>,
    size,
  );
}
