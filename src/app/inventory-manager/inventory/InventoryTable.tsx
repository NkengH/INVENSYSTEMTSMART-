"use client";

import { useState, useMemo } from "react";
import { formatCFA } from "@/lib/format";
import { adjustStock, AdjustStockPayload } from "@/app/actions/adjustments";
import {
  Search, X, Package, Layers, AlertTriangle, CheckCircle, XCircle,
  Sliders, Printer, Download, Tag, Check, RefreshCw
} from "lucide-react";

export interface InventoryRow {
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  qty: number;
  minStock: number;
  purchasePrice: number;
  sellingPrice: number;
  valuation: number;
  isOut: boolean;
  isLow: boolean;
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OK" | "LOW" | "OUT">("ALL");

  // Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryRow | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "DEDUCT" | "SET">("ADD");
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<AdjustStockPayload["reason"]>("AUDIT_DISCREPANCY");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Barcode Tag Print State
  const [tagProduct, setTagProduct] = useState<InventoryRow | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesFilter =
        filterStatus === "ALL" ||
        (filterStatus === "OK" && !r.isLow && !r.isOut) ||
        (filterStatus === "LOW" && r.isLow) ||
        (filterStatus === "OUT" && r.isOut);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.barcode && r.barcode.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [rows, searchQuery, filterStatus]);

  const outCount = rows.filter((r) => r.isOut).length;
  const lowCount = rows.filter((r) => r.isLow).length;
  const okCount = rows.length - outCount - lowCount;
  const totalValuation = rows.reduce((acc, r) => acc + r.valuation, 0);

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingProduct) return;
    setAdjustError("");
    setAdjustLoading(true);
    try {
      await adjustStock({
        productId: adjustingProduct.productId,
        adjustmentType,
        quantity: adjustQty,
        reason: adjustReason,
        notes: adjustNotes || undefined,
      });
      setAdjustingProduct(null);
      setAdjustNotes("");
    } catch (err: any) {
      setAdjustError(err.message || "Failed to record adjustment");
    } finally {
      setAdjustLoading(false);
    }
  }

  function exportCSV() {
    const headers = ["Product Name", "SKU", "Available Stock", "Min Stock", "Unit Cost (CFA)", "Selling Price (CFA)", "Total Valuation (CFA)", "Stock Status"];
    const csvRows = filteredRows.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.sku,
      r.qty,
      r.minStock,
      r.purchasePrice,
      r.sellingPrice,
      r.valuation,
      r.isOut ? "OUT_OF_STOCK" : r.isLow ? "LOW_STOCK" : "HEALTHY",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><CheckCircle size={18} /></div>
          <div className="stat-card-label">Healthy Stock</div>
          <div className="stat-card-value" style={{ color: "var(--success)" }}>{okCount}</div>
          <div className="stat-card-sub">Above minimum buffer</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><AlertTriangle size={18} /></div>
          <div className="stat-card-label">Low Stock Warning</div>
          <div className="stat-card-value" style={{ color: "var(--warning)" }}>{lowCount}</div>
          <div className="stat-card-sub">Needs replenishment</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon red"><XCircle size={18} /></div>
          <div className="stat-card-label">Out of Stock</div>
          <div className="stat-card-value" style={{ color: "var(--danger)" }}>{outCount}</div>
          <div className="stat-card-sub">Immediate action</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><Layers size={18} /></div>
          <div className="stat-card-label">Total Warehouse Valuation</div>
          <div className="stat-card-value" style={{ color: "var(--brand-700)", fontSize: "1.25rem" }}>
            {formatCFA(totalValuation)}
          </div>
          <div className="stat-card-sub">{rows.length} product catalog lines</div>
        </div>
      </div>

      {/* Interactive Table Container */}
      <div className="data-table-container">
        <div className="data-table-header" style={{ flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="data-table-title">Warehouse Stock Ledger ({filteredRows.length} of {rows.length})</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={exportCSV} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Download size={13} /> Export CSV
              </button>
              <span className="badge badge-gray">{rows.reduce((acc, r) => acc + r.qty, 0)} total units</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
              <input
                type="text"
                placeholder="Search stock by product name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 34, margin: 0, height: 36, fontSize: "0.85rem" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", padding: 3, borderRadius: 8 }}>
              {[
                { id: "ALL", label: `All (${rows.length})` },
                { id: "OK", label: `In Stock (${okCount})` },
                { id: "LOW", label: `Low (${lowCount})` },
                { id: "OUT", label: `Out (${outCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: filterStatus === tab.id ? "#fff" : "transparent",
                    color: filterStatus === tab.id ? "var(--brand-700)" : "var(--gray-600)",
                    boxShadow: filterStatus === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Available Stock</th>
              <th style={{ width: "20%" }}>Stock Health Progress</th>
              <th>Min Threshold</th>
              <th>Valuation (CFA)</th>
              <th>Status</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => {
              const maxScale = Math.max(r.minStock * 3, r.qty, 10);
              const percent = Math.min(100, Math.round((r.qty / maxScale) * 100));
              const barColor = r.isOut ? "#ef4444" : r.isLow ? "#f59e0b" : "#10b981";

              return (
                <tr key={r.productId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "var(--gray-100)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Package size={14} style={{ color: "var(--gray-600)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{r.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--gray-500)" }}>
                          Selling: {formatCFA(r.sellingPrice)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono badge badge-gray">{r.sku}</span></td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: r.isOut ? "var(--danger)" : r.isLow ? "var(--warning)" : "var(--gray-900)" }}>
                      {r.qty} {r.unit || "pcs"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--gray-500)" }}>
                        <span>{r.qty} available</span>
                        <span>Min: {r.minStock}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background: barColor,
                            borderRadius: 999,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-500)", fontSize: "0.85rem" }}>
                    {r.minStock} {r.unit || "pcs"}
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--gray-800)" }}>
                    {formatCFA(r.valuation)}
                  </td>
                  <td>
                    <span className={`badge ${r.isOut ? "badge-red" : r.isLow ? "badge-amber" : "badge-green"}`}>
                      {r.isOut ? "● Out of Stock" : r.isLow ? "▲ Low Stock" : "✓ In Stock"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => {
                          setAdjustingProduct(r);
                          setAdjustQty(1);
                          setAdjustNotes("");
                          setAdjustError("");
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", fontSize: "0.74rem", display: "flex", alignItems: "center", gap: 4 }}
                        title="Adjust Stock Quantity (Audit / Damage)"
                      >
                        <Sliders size={12} /> Adjust
                      </button>
                      <button
                        onClick={() => setTagProduct(r)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", fontSize: "0.74rem", display: "flex", alignItems: "center", gap: 4 }}
                        title="Print Shelf Price Tag"
                      >
                        <Tag size={12} /> Tag
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="table-empty">
                    <span className="table-empty-icon">🔍</span>
                    <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Stock Records Found</p>
                    <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", margin: "0 0 10px" }}>
                      No inventory matches &ldquo;{searchQuery}&rdquo; in this status tab.
                    </p>
                    <button onClick={() => { setSearchQuery(""); setFilterStatus("ALL"); }} className="btn btn-secondary btn-sm">
                      Reset Filter
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Inventory Stock Adjustment</h2>
                <div style={{ fontSize: "0.76rem", color: "var(--gray-500)", marginTop: 2 }}>
                  {adjustingProduct.name} ({adjustingProduct.sku}) • Current: <strong>{adjustingProduct.qty} units</strong>
                </div>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="modal-close"><X size={18} /></button>
            </div>

            {adjustError && (
              <div className="form-error" style={{ margin: "16px 24px 0" }}>
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="form-label">Adjustment Action</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("ADD")}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: adjustmentType === "ADD" ? "2px solid var(--success)" : "1px solid var(--gray-200)",
                        background: adjustmentType === "ADD" ? "var(--brand-50)" : "#fff",
                        color: adjustmentType === "ADD" ? "var(--success)" : "var(--gray-700)",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("DEDUCT")}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: adjustmentType === "DEDUCT" ? "2px solid var(--danger)" : "1px solid var(--gray-200)",
                        background: adjustmentType === "DEDUCT" ? "var(--brand-50)" : "#fff",
                        color: adjustmentType === "DEDUCT" ? "var(--danger)" : "var(--gray-700)",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      - Deduct Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("SET")}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: adjustmentType === "SET" ? "2px solid var(--brand-600)" : "1px solid var(--gray-200)",
                        background: adjustmentType === "SET" ? "var(--brand-50)" : "#fff",
                        color: adjustmentType === "SET" ? "var(--brand-700)" : "var(--gray-700)",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      Set Exact Qty
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Audit Reason Code</label>
                  <select
                    className="form-select"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as any)}
                  >
                    <option value="AUDIT_DISCREPANCY">Physical Audit Discrepancy Correction</option>
                    <option value="DAMAGED_GOODS">Damaged / Broken in Transit or Shelf</option>
                    <option value="DEFECTIVE_RETURN">Defective / RMA Return</option>
                    <option value="INTERNAL_USE">Internal Company / Office Use</option>
                    <option value="DEMO_UNIT">Showroom Demo / Floor Display Unit</option>
                    <option value="EXPIRATION">Obsolescence / Expiration</option>
                    <option value="OTHER">Other Authorized Correction</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Authorized Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved by Warehouse Manager"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setAdjustingProduct(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={adjustLoading} className="btn btn-primary btn-sm">
                  {adjustLoading ? "Recording Adjustment..." : "Confirm Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelf Price Tag & Barcode Modal */}
      {tagProduct && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 440, padding: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)" }} className="no-print">
              <span style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.95rem" }}>Shelf Price Tag</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                  <Printer size={14} /> Print Tag
                </button>
                <button onClick={() => setTagProduct(null)} className="modal-close"><X size={16} /></button>
              </div>
            </div>

            {/* Printable Shelf Label */}
            <div
              id="printable-tag"
              style={{
                padding: "24px",
                background: "#fff",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 320,
                  border: "2px solid #111",
                  borderRadius: 8,
                  padding: "16px",
                  background: "#fff",
                  color: "#000",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", color: "#6b7280", textTransform: "uppercase" }}>
                  INVENSMART • MAC COMPUTERS
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#111", margin: "8px 0 4px", lineHeight: 1.2 }}>
                  {tagProduct.name}
                </div>
                <div className="mono" style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 700, marginBottom: 12 }}>
                  SKU: {tagProduct.sku}
                </div>

                {/* Simulated Barcode */}
                <div
                  style={{
                    letterSpacing: "5px",
                    fontWeight: 900,
                    fontSize: "1.2rem",
                    border: "1px solid #333",
                    padding: "6px 12px",
                    borderRadius: 4,
                    display: "inline-block",
                    marginBottom: 10,
                  }}
                >
                  *||| | |||| | |||||| || |*
                </div>

                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#000", marginTop: 4 }}>
                  {formatCFA(tagProduct.sellingPrice)}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: 2 }}>
                  Toutes Taxes Comprises (TTC)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
