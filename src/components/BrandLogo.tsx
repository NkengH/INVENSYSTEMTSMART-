export function BrandLogo({
  size = "md",
  variant = "light",
  showSubtitle = true,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
}) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 34;
  const titleSize = size === "sm" ? "0.9rem" : size === "lg" ? "1.3rem" : "1.05rem";
  const subSize = size === "sm" ? "0.68rem" : size === "lg" ? "0.78rem" : "0.72rem";

  const textColor = variant === "light" ? "#ffffff" : "var(--gray-900)";
  const subColor = variant === "light" ? "rgba(255,255,255,0.55)" : "var(--gray-500)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "sm" ? 8 : 12 }}>
      {/* Bespoke Geometric Vector Emblem */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: size === "sm" ? 8 : 10,
          background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #06b6d4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
          flexShrink: 0,
        }}
      >
        <svg
          width={iconSize * 0.58}
          height={iconSize * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>

      <div style={{ lineHeight: 1.15 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: titleSize,
            color: textColor,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-sans)",
          }}
        >
          NEXUS<span style={{ color: "#60a5fa", fontWeight: 700 }}>.ERP</span>
        </div>
        {showSubtitle && (
          <div
            style={{
              fontSize: subSize,
              color: subColor,
              fontWeight: 500,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Enterprise Inventory &amp; POS
          </div>
        )}
      </div>
    </div>
  );
}
