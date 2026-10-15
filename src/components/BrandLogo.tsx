import Link from "next/link";

export function BrandLogo({
  size = "md",
  variant = "light",
  showSubtitle = true,
  href,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
  href?: string;
}) {
  const imgHeight = size === "sm" ? 30 : size === "lg" ? 48 : 38;

  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="/logo.png"
        alt="INVENSMART - Smart Inventory, Better Decisions."
        style={{
          height: imgHeight,
          width: "auto",
          objectFit: "contain",
          borderRadius: 6,
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}
