"use client";

import { useEffect } from "react";
import { X, Keyboard, Zap, ShoppingCart, Search, Layers } from "lucide-react";

export function ShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
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

  const shortcuts = [
    {
      group: "Global Application Shortcuts",
      icon: Zap,
      items: [
        { keys: ["Ctrl", "K"], desc: "Open Quick Navigation & Command Search" },
        { keys: ["Esc"], desc: "Dismiss open modals or active dropdowns" },
      ],
    },
    {
      group: "Point of Sale (POS) & Checkout",
      icon: ShoppingCart,
      items: [
        { keys: ["Enter"], desc: "Add scanned barcode directly to cart" },
        { keys: ["Ctrl", "H"], desc: "Hold current transaction / pause session" },
        { keys: ["Ctrl", "P"], desc: "Print last completed receipt ticket" },
      ],
    },
    {
      group: "Inventory & Stock Management",
      icon: Layers,
      items: [
        { keys: ["/"], desc: "Focus product search query field" },
        { keys: ["Ctrl", "B"], desc: "Quick barcode shelf tag generator" },
      ],
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 540,
          padding: 0,
          overflow: "hidden",
          border: "1px solid var(--gray-300)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-200)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--gray-900)" }}>
                Keyboard Shortcuts & Hotkeys
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--gray-500)" }}>
                Fast-path keybindings for daily operations
              </div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", maxHeight: 400, overflowY: "auto", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {shortcuts.map((section, idx) => {
              const SectionIcon = section.icon;
              return (
                <div key={idx}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: "var(--brand-600)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    <SectionIcon size={14} />
                    <span>{section.group}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      background: "var(--gray-50)",
                      padding: 10,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--gray-200)",
                    }}
                  >
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "4px 6px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <span style={{ color: "var(--gray-700)", fontWeight: 500 }}>{item.desc}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--gray-300)",
                                borderRadius: 4,
                                padding: "2px 7px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--gray-800)",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                              }}
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--gray-200)",
            background: "var(--gray-50)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
