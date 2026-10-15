"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ArrowRight, Package, ShoppingCart, BarChart3,
  Users, Layers, ArrowRightLeft, Sparkles, BrainCircuit, CreditCard, QrCode
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  category: "Navigation" | "Action" | "Product Quick View";
  href: string;
  icon: any;
  hint?: string;
}

const SEARCH_ITEMS: SearchResult[] = [
  { id: "1", title: "POS Sales Counter", category: "Navigation", href: "/cashier/sales", icon: ShoppingCart, hint: "Open active register" },
  { id: "2", title: "Cashier Till Session", category: "Navigation", href: "/cashier/till", icon: CreditCard, hint: "Open or close till session" },
  { id: "3", title: "Receipts & Tickets", category: "Navigation", href: "/cashier/receipts", icon: Package, hint: "Reprint receipts" },
  { id: "4", title: "Refunds & Returns", category: "Navigation", href: "/cashier/refunds", icon: ArrowRightLeft, hint: "Process refunds" },
  { id: "5", title: "Product Catalog", category: "Navigation", href: "/inventory-manager/products", icon: Package, hint: "Browse all items" },
  { id: "6", title: "Stock Overview", category: "Navigation", href: "/inventory-manager/inventory", icon: Layers, hint: "View current balances" },
  { id: "7", title: "Stock Movements & Transfers", category: "Navigation", href: "/inventory-manager/movements", icon: ArrowRightLeft, hint: "Stock logs" },
  { id: "8", title: "Barcode & Shelf Label Studio", category: "Navigation", href: "/inventory-manager/labels", icon: QrCode, hint: "Generate & print price tags & QR codes" },
  { id: "9", title: "AI Inventory Analyst", category: "Navigation", href: "/inventory-manager/ai", icon: BrainCircuit, hint: "Ask AI predictions" },
  { id: "10", title: "Financial & Stock Reports", category: "Navigation", href: "/inventory-manager/reports", icon: BarChart3, hint: "Analytics" },
  { id: "11", title: "User Management", category: "Navigation", href: "/admin/users", icon: Users, hint: "Manage employee accounts" },
  { id: "12", title: "System Audit Log", category: "Navigation", href: "/admin/audit", icon: Sparkles, hint: "Security activity" },
];

export function QuickSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.hint && item.hint.toLowerCase().includes(query.toLowerCase())) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 580,
          padding: 0,
          overflow: "hidden",
          border: "1px solid var(--gray-300)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: "1px solid var(--gray-200)",
            background: "var(--bg-card)",
            gap: 12,
          }}
        >
          <Search size={18} color="var(--brand-600)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, or action (e.g. 'sales', 'stock', 'ai')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.95rem",
              color: "var(--gray-900)",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--gray-400)",
                padding: 4,
              }}
            >
              <X size={14} />
            </button>
          )}
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--gray-100)",
              color: "var(--gray-500)",
              border: "1px solid var(--gray-200)",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: 340,
            overflowY: "auto",
            padding: "8px",
            background: "var(--bg-card)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--gray-400)" }}>
              <Search size={28} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>No results found for &ldquo;{query}&rdquo;</div>
              <div style={{ fontSize: "0.75rem", marginTop: 4 }}>Try searching for sales, products, or reports</div>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--gray-100)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--brand-50)",
                        color: "var(--brand-600)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-900)" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--gray-500)" }}>
                        {item.hint}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        color: "var(--gray-400)",
                        padding: "2px 6px",
                        background: "var(--gray-100)",
                        borderRadius: 4,
                      }}
                    >
                      {item.category}
                    </span>
                    <ArrowRight size={14} color="var(--gray-400)" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--gray-200)",
            background: "var(--gray-50)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "var(--gray-500)",
          }}
        >
          <span>Navigation Quick Launcher</span>
          <span>Press <kbd style={{ background: "var(--gray-200)", padding: "1px 4px", borderRadius: 3 }}>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
