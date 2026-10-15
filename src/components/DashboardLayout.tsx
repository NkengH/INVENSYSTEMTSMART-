"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, Home, Package, ShoppingCart, Users, ClipboardList,
  Activity, Box, BarChart3, BrainCircuit, CreditCard, Layers, ArrowRightLeft,
  RotateCcw, Receipt as ReceiptIcon, Sparkles, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

type NavItem = { name: string; href: string; icon: any };

type NavSection = {
  label: string;
  items: NavItem[];
};

const cashierNavSection: NavSection = {
  label: "Cashier & POS",
  items: [
    { name: "Till Session", href: "/cashier/till",     icon: CreditCard },
    { name: "POS Sales",    href: "/cashier/sales",    icon: ShoppingCart },
    { name: "Refunds",      href: "/cashier/refunds",  icon: RotateCcw },
    { name: "Receipts",     href: "/cashier/receipts", icon: ReceiptIcon },
  ],
};

const navSections: Record<string, NavSection[]> = {
  Administrator: [
    {
      label: "Administration",
      items: [
        { name: "Dashboard",           href: "/admin",        icon: Home },
        { name: "Users",               href: "/admin/users",  icon: Users },
        { name: "Roles & Permissions", href: "/admin/roles",  icon: ClipboardList },
        { name: "System Activity",     href: "/admin/audit",  icon: Activity },
        { name: "AI Assistant",        href: "/admin/ai",     icon: BrainCircuit },
      ],
    },
    cashierNavSection,
  ],
  "Inventory Manager": [
    {
      label: "Inventory Management",
      items: [
        { name: "Dashboard",             href: "/inventory-manager",            icon: Home },
        { name: "Products",              href: "/inventory-manager/products",   icon: Package },
        { name: "Inventory",             href: "/inventory-manager/inventory",  icon: Layers },
        { name: "Purchase Management",   href: "/inventory-manager/purchases",  icon: ShoppingCart },
        { name: "Issue Stock",           href: "/inventory-manager/issuance",   icon: Box },
        { name: "Stock Movements",       href: "/inventory-manager/movements",  icon: ArrowRightLeft },
        { name: "Reports",               href: "/inventory-manager/reports",    icon: BarChart3 },
        { name: "AI Inventory Analysis", href: "/inventory-manager/ai",         icon: BrainCircuit },
      ],
    },
    cashierNavSection,
  ],
  Cashier: [
    {
      label: "Cashier & POS",
      items: [
        { name: "Dashboard",    href: "/cashier",          icon: Home },
        { name: "Till Session", href: "/cashier/till",     icon: CreditCard },
        { name: "POS Sales",    href: "/cashier/sales",    icon: ShoppingCart },
        { name: "Refunds",      href: "/cashier/refunds",  icon: RotateCcw },
        { name: "Receipts",     href: "/cashier/receipts", icon: ReceiptIcon },
      ],
    },
  ],
};

const roleColorMap: Record<string, string> = {
  "Administrator":     "#818cf8",
  "Inventory Manager": "#34d399",
  "Cashier":           "#60a5fa",
};

function getInitials(name: string) {
  return (name || "US").slice(0, 2).toUpperCase();
}

export function DashboardLayout({
  children,
  role,
  username,
}: {
  children: ReactNode;
  role: string;
  username: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const sections = navSections[role] || [];
  const roleColor = roleColorMap[role] || "#94a3b8";

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              padding: "2px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="INVENSMART"
              style={{
                height: 32,
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-name">INVENSMART</span>
            <span className="brand-sub">Smart Inventory Decisions</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section, secIdx) => (
            <div key={section.label || secIdx} style={{ marginBottom: 14 }}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(username)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{username}</span>
              <span className="sidebar-role" style={{ color: roleColor }}>{role}</span>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: theme === "dark" ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)",
                border: theme === "dark" ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(99,102,241,0.25)",
                color: theme === "dark" ? "#fbbf24" : "#818cf8",
                cursor: "pointer",
                transition: "all 150ms ease",
                flexShrink: 0,
              }}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={handleSignOut} className="sidebar-logout" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <AppHeader username={username} role={role} />
        <div className="content-inner">{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}
