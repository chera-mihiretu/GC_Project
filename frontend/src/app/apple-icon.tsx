import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fb7185, #e11d48)",
          borderRadius: 38,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <svg
            width="28"
            height="26"
            viewBox="0 0 60 56"
            fill="none"
            style={{ position: "absolute", top: -38, right: -50 }}
          >
            <path
              d="M30 52C30 52 2 34 2 16C2 4 14-4 24 4C28 7 30 12 30 12C30 12 32 7 36 4C46-4 58 4 58 16C58 34 30 52 30 52Z"
              fill="rgba(255,255,255,0.85)"
            />
          </svg>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, serif",
              fontSize: 100,
              fontWeight: 700,
              color: "white",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            T
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
