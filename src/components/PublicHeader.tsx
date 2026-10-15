"use client";

import { Sun, Moon, Activity } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 20,
        background: "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo.png"
          alt="INVENSMART - Smart Inventory, Better Decisions."
          style={{
            height: 40,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: 999,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#059669",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px #10b981",
            }}
          />
          <Activity size={12} />
          <span>System Online</span>
        </div>

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-card)",
            border: "1px solid var(--gray-200)",
            color: theme === "dark" ? "#fbbf24" : "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
