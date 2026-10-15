"use client";

import { useState, useMemo, useCallback } from "react";
import {
  createPurchase,
  getAIPurchaseAdvice,
  type LowStockProduct,
  type PurchaseHistoryItem,
  type AIPurchaseAdvice,
} from "@/app/actions/purchases";
import { formatCFA } from "@/lib/format";
import { PurchasesTable, PurchaseDetail } from "./PurchasesTable";
import {
  AlertTriangle, ShoppingCart, Printer, CheckSquare, Square,
  Package, FileText, X, Save, Eye, RotateCcw, ClipboardList,
  Building, CreditCard, Calendar, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectionRow extends LowStockProduct {
  selected: boolean;
  purchaseQty: number;
}

const VENDOR_PRESETS = [
  "HP Central Africa SARL",
  "Apple CEMAC Distributor",
  "Dell Technologies Partner",
  "Lenovo West Africa",
  "Ingram Micro CEMAC",
  "Samsung Electronics Douala",
  "General Tech Supplier",
];

const PAYMENT_TERMS = [
  "Cash On Delivery",
  "Net 30 Days",
  "Net 60 Days",
  "Advance Payment (50%)",
  "Immediate Wire Transfer",
];

// ── Main Component ────────────────────────────────────────────────────────────

export function PurchaseManagement({
  lowStockProducts,
  purchaseHistory,
  username,
}: {
  lowStockProducts: LowStockProduct[];
  purchaseHistory: PurchaseHistoryItem[];
  username: string;
}) {
  const [activeTab, setActiveTab] = useState<"planner" | "history">("planner");

  // Selection state
  const [rows, setRows] = useState<SelectionRow[]>(() =>
    lowStockProducts.map((p) => ({
      ...p,
      selected: true,
      purchaseQty: Math.max(p.deficit, 1),
    }))
  );

  // Report / Save state
  const [showReport, setShowReport] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [vendorName, setVendorName] = useState(VENDOR_PRESETS[0]);
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedPO, setSavedPO] = useState<string | null>(null);

  // AI Advice state
  const [aiAdvice, setAiAdvice] = useState<Record<string, AIPurchaseAdvice>>({});
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiBanner, setShowAiBanner] = useState(false);

  async function handleLoadAiAdvice() {
    setLoadingAi(true);
    try {
      const advice = await getAIPurchaseAdvice(lowStockProducts);
      const map: Record<string, AIPurchaseAdvice> = {};
      for (const a of advice) map[a.productId] = a;
      setAiAdvice(map);
      setShowAiBanner(true);
    } catch (e) {
      console.error("AI Advice error:", e);
    } finally {
      setLoadingAi(false);
    }
  }

  function applyAllAiQtys() {
    setRows((prev) =>
      prev.map((r) => {
        const adv = aiAdvice[r.id];
        return adv ? { ...r, purchaseQty: adv.suggestedQty } : r;
      })
    );
  }

  // Derived
  const selectedRows = useMemo(() => rows.filter((r) => r.selected && r.purchaseQty > 0), [rows]);
  const totalQty = useMemo(() => selectedRows.reduce((s, r) => s + r.purchaseQty, 0), [selectedRows]);
  const totalCost = useMemo(
    () => selectedRows.reduce((s, r) => s + r.purchaseQty * r.purchasePrice, 0),
    [selectedRows]
  );

  // Row helpers
  const toggleAll = useCallback(() => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  }, [rows]);

  const toggleRow = useCallback((id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, purchaseQty: Math.max(1, qty || 1) } : r))
    );
  }, []);

  const resetQty = useCallback((id: string, deficit: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, purchaseQty: Math.max(deficit, 1) } : r))
    );
  }, []);

  // Save PO
  async function handleSavePO() {
    if (selectedRows.length === 0) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await createPurchase({
        vendorName,
        paymentTerms,
        expectedDeliveryDate: deliveryDate || undefined,
        notes: notes || undefined,
        items: selectedRows.map((r) => ({
          productId: r.id,
          quantity: r.purchaseQty,
          unitPrice: r.purchasePrice,
        })),
      });
      setSavedPO(result.purchaseNumber);
      setShowSaveModal(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save purchase order");
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const reportRef = `RPT-${Date.now().toString().slice(-8)}`;

  // Build history data for PurchasesTable with full line item details
  const poTableData: PurchaseDetail[] = purchaseHistory.map((h) => ({
    id: h.id,
    purchaseNumber: h.purchaseNumber,
    vendorName: h.vendorName,
    paymentTerms: h.paymentTerms,
    expectedDeliveryDate: h.expectedDeliveryDate,
    status: h.status,
    totalAmount: h.totalAmount,
    createdAt: h.createdAt,
    items: h.items || [],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Purchase Management</h1>
          <p className="page-subtitle">
            Automatically identifies low-stock products and helps you prepare purchase orders
          </p>
        </div>
      </div>

      {/* Success banner after saving */}
      {savedPO && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "#d1fae5",
            border: "1px solid #10b981",
            borderRadius: 8,
            color: "#065f46",
            fontWeight: 600,
            fontSize: "0.88rem",
          }}
        >
          <span>
            ✅ Purchase Order <strong>{savedPO}</strong> saved! Switch to History tab to view it.
          </span>
          <button
            onClick={() => setSavedPO(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card-label">Low-Stock Products</div>
          <div className="stat-card-value" style={{ color: "#d97706" }}>{rows.length}</div>
          <div className="stat-card-sub">Require replenishment</div>
          <div className="stat-card-accent" style={{ background: "#d97706" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <CheckSquare size={20} />
          </div>
          <div className="stat-card-label">Selected for Purchase</div>
          <div className="stat-card-value" style={{ color: "#7c3aed" }}>{selectedRows.length}</div>
          <div className="stat-card-sub">of {rows.length} low-stock items</div>
          <div className="stat-card-accent" style={{ background: "#7c3aed" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <Package size={20} />
          </div>
          <div className="stat-card-label">Total Units to Order</div>
          <div className="stat-card-value" style={{ color: "#2563eb" }}>{totalQty}</div>
          <div className="stat-card-sub">Across selected products</div>
          <div className="stat-card-accent" style={{ background: "#2563eb" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#d1fae5", color: "#059669" }}>
            <ShoppingCart size={20} />
          </div>
          <div className="stat-card-label">Estimated Cost</div>
          <div className="stat-card-value" style={{ color: "#059669", fontSize: "1rem" }}>
            {totalCost > 0 ? formatCFA(totalCost) : "0 CFA"}
          </div>
          <div className="stat-card-sub">Based on purchase prices</div>
          <div className="stat-card-accent" style={{ background: "#059669" }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", padding: 3, borderRadius: 8, alignSelf: "flex-start" }}>
        {(["planner", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "var(--brand-700)" : "var(--gray-600)",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tab === "planner" ? (
              <><AlertTriangle size={14} /> Purchase Planner</>
            ) : (
              <><ClipboardList size={14} /> Purchase History ({purchaseHistory.length})</>
            )}
          </button>
        ))}
      </div>

      {/* ═══ PLANNER TAB ═════════════════════════════════════════════════════ */}
      {activeTab === "planner" && (
        <div className="data-table-container">
          <div className="data-table-header">
            <div className="data-table-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
              Low-Stock Products Requiring Purchase ({rows.length})
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={handleLoadAiAdvice}
                disabled={loadingAi || rows.length === 0}
                className="btn btn-secondary btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: showAiBanner ? "#f5f3ff" : undefined,
                  borderColor: showAiBanner ? "#8b5cf6" : undefined,
                  color: showAiBanner ? "#6d28d9" : undefined,
                }}
                title="Get AI-powered purchasing recommendations based on sales velocity and deficits"
              >
                <Sparkles size={14} style={{ color: "#7c3aed" }} />
                {loadingAi ? "Analyzing..." : "AI Purchasing Advice"}
              </button>
              {selectedRows.length > 0 && (
                <>
                  <button
                    onClick={() => setShowReport(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Eye size={14} /> Preview Report
                  </button>
                  <button
                    onClick={() => { setSaveError(""); setShowSaveModal(true); }}
                    className="btn btn-primary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Save size={14} /> Save Purchase Order
                  </button>
                </>
              )}
            </div>
          </div>

          {showAiBanner && Object.keys(aiAdvice).length > 0 && (
            <div
              style={{
                margin: "12px 16px",
                padding: "10px 14px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)",
                border: "1px solid #c4b5fd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} style={{ color: "#7c3aed", flexShrink: 0 }} />
                <span style={{ fontSize: "0.82rem", color: "#4c1d95" }}>
                  <strong>AI Insights Active:</strong> Smart purchasing quantities recommended based on sales velocity and stock deficits.
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={applyAllAiQtys}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#7c3aed", borderColor: "#6d28d9", fontSize: "0.75rem", padding: "4px 10px" }}
                >
                  Apply All AI Suggestions
                </button>
                <button
                  onClick={() => setShowAiBanner(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed" }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="table-empty">
              <span className="table-empty-icon">✅</span>
              <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>
                All Products Are Well-Stocked
              </p>
              <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: 0 }}>
                No products are currently at or below their minimum stock threshold.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <button
                      onClick={toggleAll}
                      title={rows.every((r) => r.selected) ? "Deselect all" : "Select all"}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {rows.every((r) => r.selected)
                        ? <CheckSquare size={16} style={{ color: "var(--brand-600)" }} />
                        : <Square size={16} style={{ color: "var(--gray-400)" }} />}
                    </button>
                  </th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th style={{ textAlign: "center" }}>Current Stock</th>
                  <th style={{ textAlign: "center" }}>Min Stock</th>
                  <th style={{ textAlign: "center" }}>Deficit</th>
                  <th style={{ textAlign: "center", width: 140 }}>Purchase Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Cost</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ opacity: row.selected ? 1 : 0.45, transition: "opacity 0.15s" }}>
                    <td>
                      <button
                        onClick={() => toggleRow(row.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        {row.selected
                          ? <CheckSquare size={16} style={{ color: "var(--brand-600)" }} />
                          : <Square size={16} style={{ color: "var(--gray-400)" }} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{row.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{row.unit}</div>
                      {aiAdvice[row.id] && (
                        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: aiAdvice[row.id].urgency === "HIGH" ? "#fee2e2" : "#ede9fe",
                              color: aiAdvice[row.id].urgency === "HIGH" ? "#b91c1c" : "#6d28d9",
                              fontWeight: 600,
                            }}
                          >
                            AI: {aiAdvice[row.id].recommendation}
                          </span>
                          {row.purchaseQty !== aiAdvice[row.id].suggestedQty && (
                            <button
                              onClick={() => setQty(row.id, aiAdvice[row.id].suggestedQty)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "1px 6px", fontSize: "0.68rem", height: "auto" }}
                              title="Set purchase quantity to AI suggestion"
                            >
                              Set {aiAdvice[row.id].suggestedQty}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--gray-500)" }}>{row.sku}</span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--gray-600)" }}>{row.categoryName}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontWeight: 700,
                        color: row.currentStock === 0 ? "var(--danger)" : "var(--warning)",
                        fontSize: "0.9rem",
                      }}>
                        {row.currentStock}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "var(--gray-700)" }}>{row.minimumStock}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                      }}>
                        -{row.deficit}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <input
                          type="number"
                          min={1}
                          value={row.purchaseQty}
                          onChange={(e) => setQty(row.id, parseInt(e.target.value) || 1)}
                          disabled={!row.selected}
                          className="form-input"
                          style={{ width: 72, margin: 0, padding: "4px 6px", fontSize: "0.82rem", textAlign: "center" }}
                        />
                        <button
                          onClick={() => resetQty(row.id, row.deficit)}
                          title="Reset to deficit"
                          disabled={!row.selected}
                          style={{ background: "none", border: "none", cursor: row.selected ? "pointer" : "default", color: "var(--gray-400)", padding: 2 }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontSize: "0.82rem", color: "var(--gray-600)" }}>
                      {formatCFA(row.purchasePrice)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--gray-900)" }}>
                      {row.selected ? formatCFA(row.purchaseQty * row.purchasePrice) : "—"}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 12,
                        background: row.currentStock === 0 ? "#fef2f2" : "#fef3c7",
                        color: row.currentStock === 0 ? "#dc2626" : "#92400e",
                        border: `1px solid ${row.currentStock === 0 ? "#fecaca" : "#fde68a"}`,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                      }}>
                        {row.currentStock === 0 ? "⚠ Out of Stock" : "🔶 Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {selectedRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--brand-50)", fontWeight: 700 }}>
                    <td colSpan={9} style={{ textAlign: "right", padding: "10px 12px", color: "var(--brand-900)", fontSize: "0.85rem" }}>
                      {selectedRows.length} product(s) selected — {totalQty} total units — Estimated Total:
                    </td>
                    <td style={{ textAlign: "right", fontSize: "1rem", color: "var(--brand-700)", padding: "10px 12px", fontWeight: 900 }}>
                      {formatCFA(totalCost)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        purchaseHistory.length === 0 ? (
          <div className="data-table-container">
            <div className="table-empty">
              <span className="table-empty-icon">📋</span>
              <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Purchase Orders Yet</p>
              <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: 0 }}>
                Use the Purchase Planner tab to generate and save your first purchase order.
              </p>
            </div>
          </div>
        ) : (
          <PurchasesTable purchases={poTableData} />
        )
      )}

      {/* ═══ REPORT PREVIEW MODAL ════════════════════════════════════════════ */}
      {showReport && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 740, padding: 0 }}>
            <div
              className="no-print"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid var(--gray-200)",
                background: "var(--gray-50)",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.95rem" }}>
                  Purchase Report Preview
                </span>
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginLeft: 8 }}>
                  {reportRef}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Printer size={14} /> Print Report
                </button>
                <button onClick={() => setShowReport(false)} className="modal-close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              id="purchase-report-print"
              style={{
                padding: "28px 32px",
                background: "#ffffff",
                color: "#111827",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                maxHeight: "68vh",
                overflowY: "auto",
              }}
            >
              {/* Report header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #111827",
                paddingBottom: 16,
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>INVENSMART AI / MAC COMPUTERS</div>
                  <div style={{ fontSize: "0.76rem", color: "#4b5563" }}>Akwa Central, Douala — Cameroun</div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>Tel: (+237) 651 704 545 • NIU: M01241678902A</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2563eb" }}>PURCHASE REPORT</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: "0.85rem" }}>{reportRef}</div>
                  <div style={{ fontSize: "0.74rem", color: "#6b7280", marginTop: 2 }}>Date: {today}</div>
                </div>
              </div>

              {/* Meta */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                background: "#f9fafb",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                marginBottom: 16,
                fontSize: "0.78rem",
              }}>
                <div>
                  <div style={{ fontWeight: 700, textTransform: "uppercase", color: "#6b7280", fontSize: "0.68rem" }}>Prepared by</div>
                  <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{username} — Inventory Manager</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, textTransform: "uppercase", color: "#6b7280", fontSize: "0.68rem" }}>Summary</div>
                  <div style={{ color: "#111827", marginTop: 2 }}>
                    {selectedRows.length} product(s) · {totalQty} total units · {formatCFA(totalCost)} estimated
                  </div>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: "#111827", color: "#fff", textAlign: "left", fontSize: "0.74rem" }}>
                    <th style={{ padding: "8px 10px" }}>No.</th>
                    <th style={{ padding: "8px 10px" }}>Product</th>
                    <th style={{ padding: "8px 10px" }}>SKU</th>
                    <th style={{ padding: "8px 10px" }}>Category</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Current Stock</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Min Stock</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Qty to Purchase</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Unit Cost (CFA)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Subtotal (CFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRows.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #e5e7eb", fontSize: "0.8rem", background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding: "7px 10px", color: "#6b7280" }}>{idx + 1}</td>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>{row.name}</td>
                      <td className="mono" style={{ padding: "7px 10px", fontSize: "0.72rem", color: "#6b7280" }}>{row.sku}</td>
                      <td style={{ padding: "7px 10px" }}>{row.categoryName}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: row.currentStock === 0 ? "#dc2626" : "#d97706", fontWeight: 700 }}>{row.currentStock}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{row.minimumStock}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 800, color: "#2563eb" }}>{row.purchaseQty}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right" }}>{formatCFA(row.purchasePrice)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700 }}>{formatCFA(row.purchaseQty * row.purchasePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total box */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
                <div style={{ minWidth: 280, border: "2px solid #111827", borderRadius: 6, padding: "10px 14px", background: "#f9fafb", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#4b5563" }}>Total Products:</span>
                    <span style={{ fontWeight: 700 }}>{selectedRows.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#4b5563" }}>Total Units:</span>
                    <span style={{ fontWeight: 700 }}>{totalQty}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db", fontSize: "1rem", fontWeight: 900 }}>
                    <span>TOTAL ESTIMÉ (CFA):</span>
                    <span style={{ color: "#2563eb" }}>{formatCFA(totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, borderTop: "1px dashed #9ca3af", paddingTop: 16 }}>
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#374151" }}>Responsable Achats / Inventory Manager:</div>
                  <div style={{ height: 40 }} />
                  <div style={{ borderTop: "1px solid #d1d5db", width: "80%", fontSize: "0.68rem", color: "#6b7280", paddingTop: 4 }}>Signature &amp; Cachet</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#374151" }}>Validé par / Approved by:</div>
                  <div style={{ height: 40 }} />
                  <div style={{ borderTop: "1px solid #d1d5db", width: "80%", fontSize: "0.68rem", color: "#6b7280", paddingTop: 4 }}>Date &amp; Signature</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--gray-500)" }}>
                ⚠️ Generating this report does NOT change stock levels.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setShowReport(false); setSaveError(""); setShowSaveModal(true); }}
                  className="btn btn-primary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Save size={14} /> Save as Purchase Order
                </button>
                <button onClick={() => setShowReport(false)} className="btn btn-secondary btn-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SAVE PO MODAL ═══════════════════════════════════════════════════ */}
      {showSaveModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Save Purchase Order</h2>
                <p style={{ fontSize: "0.76rem", color: "var(--gray-500)", margin: "2px 0 0" }}>
                  {selectedRows.length} product(s) · {totalQty} units · {formatCFA(totalCost)}
                </p>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="modal-close"><X size={18} /></button>
            </div>

            {saveError && <div className="form-error" style={{ margin: "16px 24px 0" }}>{saveError}</div>}

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <Building size={13} /> Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    list="pm-vendor-list"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="form-input"
                    style={{ margin: 0, fontSize: "0.82rem" }}
                    required
                  />
                  <datalist id="pm-vendor-list">
                    {VENDOR_PRESETS.map((v) => <option key={v} value={v} />)}
                  </datalist>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <CreditCard size={13} /> Payment Terms
                  </label>
                  <select
                    className="form-select"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    style={{ margin: 0, fontSize: "0.82rem" }}
                  >
                    {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={13} /> Expected Delivery (optional)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="form-input"
                    style={{ margin: 0, fontSize: "0.82rem" }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={13} /> Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Urgent — priority delivery"
                    className="form-input"
                    style={{ margin: 0, fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              {/* Line items preview */}
              <div style={{ border: "1px solid var(--gray-200)", borderRadius: 6, overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                <table className="data-table" style={{ margin: 0, fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Unit Cost</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div className="mono" style={{ fontSize: "0.68rem", color: "var(--gray-400)" }}>{r.sku}</div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{r.purchaseQty}</td>
                        <td style={{ textAlign: "right" }}>{formatCFA(r.purchasePrice)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCFA(r.purchaseQty * r.purchasePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--brand-50)",
                borderRadius: 8,
                border: "1px solid var(--brand-200)",
              }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-900)" }}>Estimated Total:</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--brand-700)" }}>{formatCFA(totalCost)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowSaveModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleSavePO}
                disabled={saving || selectedRows.length === 0}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Confirm & Save Purchase Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
