"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, Home, Package, ShoppingCart, Users, ClipboardList,
  Activity, Box, BarChart3, BrainCircuit, CreditCard, Layers, ArrowRightLeft,
  PackageCheck, RotateCcw, Receipt as ReceiptIcon, Sparkles
} from "lucide-react";

type NavItem = { name: string; href: string; icon: any };

const navConfig: Record<string, NavItem[]> = {
  Administrator: [
    { name: "Dashboard",           href: "/admin",        icon: Home },
    { name: "Users",               href: "/admin/users",  icon: Users },
    { name: "Roles & Permissions", href: "/admin/roles",  icon: ClipboardList },
    { name: "System Activity",     href: "/admin/audit",  icon: Activity },
    { name: "AI Assistant",        href: "/admin/ai",     icon: BrainCircuit },
  ],
  "Inventory Manager": [
    { name: "Dashboard",             href: "/inventory-manager",            icon: Home },
    { name: "Products",              href: "/inventory-manager/products",   icon: Package },
    { name: "Inventory",             href: "/inventory-manager/inventory",  icon: Layers },
    { name: "Receive Stock",         href: "/inventory-manager/reception",  icon: PackageCheck },
    { name: "Issue Stock",           href: "/inventory-manager/issuance",   icon: Box },
    { name: "Stock Movements",       href: "/inventory-manager/movements",  icon: ArrowRightLeft },
    { name: "Purchases",             href: "/inventory-manager/purchases",  icon: ShoppingCart },
    { name: "Reports",               href: "/inventory-manager/reports",    icon: BarChart3 },
    { name: "AI Inventory Analysis", href: "/inventory-manager/ai",         icon: BrainCircuit },
  ],
  Cashier: [
    { name: "Dashboard",    href: "/cashier",          icon: Home },
    { name: "Till Session", href: "/cashier/till",     icon: CreditCard },
    { name: "Sales",        href: "/cashier/sales",    icon: ShoppingCart },
    { name: "Refunds",      href: "/cashier/refunds",  icon: RotateCcw },
    { name: "Receipts",     href: "/cashier/receipts", icon: ReceiptIcon },
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
  const items = navConfig[role] || [];
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
          <div className="sidebar-brand-icon">I</div>
          <div className="sidebar-brand-text">
            <span className="brand-name">INVENSMART AI</span>
            <span className="brand-sub">Smart Inventory System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {items.map((item) => {
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
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(username)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{username}</span>
              <span className="sidebar-role" style={{ color: roleColor }}>{role}</span>
            </div>
            <button onClick={handleSignOut} className="sidebar-logout" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
