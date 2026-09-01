"use client";

import { useState, useMemo } from "react";
import { formatCFA } from "@/lib/format";
import { cancelPurchase } from "@/app/actions/purchases";
import {
  ShoppingCart, Search, X, Eye, Ban, CheckCircle2, Clock,
  Package, Calendar, FileText, Printer, Building, CreditCard
} from "lucide-react";

export interface PurchaseDetail {
  id: string;
  purchaseNumber: string;
  vendorName?: string;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    total: number;
  }[];
}

const statusBadge: Record<string, string> = {
  "Draft": "badge-gray",
  "Submitted": "badge-amber",
  "Partially Received": "badge-blue",
  "Fully Received": "badge-green",
  "Cancelled": "badge-red",
};

export function PurchasesTable({ purchases }: { purchases: PurchaseDetail[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPO, setSelectedPO] = useState<PurchaseDetail | null>(null);
  const [printPO, setPrintPO] = useState<PurchaseDetail | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.purchaseNumber.toLowerCase().includes(q) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(q)) ||
        p.items.some((i) => i.productName.toLowerCase().includes(q) || i.productSku.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [purchases, searchQuery, statusFilter]);

  async function handleCancel(purchaseId: string) {
    if (!confirm("Are you sure you want to cancel this purchase order?")) return;
    setError(null);
    setCancellingId(purchaseId);
    try {
      await cancelPurchase(purchaseId);
      if (selectedPO?.id === purchaseId) {
        setSelectedPO({ ...selectedPO, status: "Cancelled" });
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel purchase order");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div className="form-error" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      <div className="data-table-container">
        <div className="data-table-header" style={{ flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="data-table-title">Supplier Purchase Orders ({filteredPurchases.length} of {purchases.length})</div>
            <span className="badge badge-gray">{purchases.length} total orders</span>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
              <input
                type="text"
                placeholder="Search by PO Number, vendor, or product..."
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

            <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", padding: 3, borderRadius: 8, overflowX: "auto" }}>
              {["ALL", "Submitted", "Partially Received", "Fully Received", "Cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    whiteSpace: "nowrap",
                    background: statusFilter === s ? "#fff" : "transparent",
                    color: statusFilter === s ? "var(--brand-700)" : "var(--gray-600)",
                    boxShadow: statusFilter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s === "ALL" ? "All Statuses" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor / Supplier</th>
              <th>Status</th>
              <th>Line Items</th>
              <th>Total Cost (CFA)</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="mono" style={{ fontWeight: 700, color: "var(--brand-600)" }}>
                    {p.purchaseNumber}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                    {p.vendorName || "General Tech Supplier"}
                  </div>
                  {p.paymentTerms && (
                    <div style={{ fontSize: "0.7rem", color: "var(--gray-500)" }}>
                      {p.paymentTerms}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${statusBadge[p.status] || "badge-gray"}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ color: "var(--gray-700)", fontSize: "0.85rem" }}>
                  {p.items.length} item{p.items.length !== 1 ? "s" : ""} ({p.items.reduce((acc, i) => acc + i.quantityOrdered, 0)} units)
                </td>
                <td style={{ fontWeight: 800, color: "var(--gray-900)" }}>
                  {formatCFA(p.totalAmount)}
                </td>
                <td style={{ color: "var(--gray-500)", fontSize: "0.82rem" }}>
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setSelectedPO(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Eye size={13} /> View Items
                    </button>

                    <button
                      onClick={() => setPrintPO(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
                      title="Print Official PO Voucher"
                    >
                      <Printer size={13} /> Print PO
                    </button>

                    {p.status === "Submitted" && (
                      <button
                        onClick={() => handleCancel(p.id)}
                        disabled={cancellingId === p.id}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
                        title="Cancel Order"
                      >
                        <Ban size={13} /> {cancellingId === p.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPurchases.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">
                    <span className="table-empty-icon">🛒</span>
                    <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Purchase Orders Found</p>
                    <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: 0 }}>
                      No orders match your filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Line Items Modal */}
      {selectedPO && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Purchase Order Details</h2>
                <div style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: 2 }}>
                  <span className="mono" style={{ fontWeight: 700, color: "var(--brand-700)" }}>{selectedPO.purchaseNumber}</span>
                  {" • "}Vendor: <strong>{selectedPO.vendorName || "General Supplier"}</strong>
                  {" • "}Status: <span className={`badge ${statusBadge[selectedPO.status]}`}>{selectedPO.status}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPO(null)} className="modal-close"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: 0 }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "center" }}>Ordered</th>
                    <th style={{ textAlign: "center" }}>Received</th>
                    <th style={{ textAlign: "right" }}>Unit Cost</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{i.productName}</div>
                        <div className="mono" style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>{i.productSku}</div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{i.quantityOrdered}</td>
                      <td style={{ textAlign: "center", color: i.quantityReceived === i.quantityOrdered ? "var(--success)" : "var(--gray-600)" }}>
                        {i.quantityReceived}
                      </td>
                      <td style={{ textAlign: "right" }}>{formatCFA(i.unitPrice)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCFA(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "var(--gray-50)", borderTop: "1px solid var(--gray-200)" }}>
                <span style={{ fontWeight: 700, color: "var(--gray-700)" }}>Total Order Value:</span>
                <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--brand-700)" }}>
                  {formatCFA(selectedPO.totalAmount)}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              {selectedPO.status === "Submitted" ? (
                <button
                  type="button"
                  onClick={() => handleCancel(selectedPO.id)}
                  disabled={cancellingId === selectedPO.id}
                  className="btn btn-danger btn-sm"
                >
                  <Ban size={14} /> Cancel This Purchase Order
                </button>
              ) : <div />}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const poToPrint = selectedPO;
                    setSelectedPO(null);
                    setPrintPO(poToPrint);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Printer size={14} /> Print Voucher
                </button>
                <button type="button" onClick={() => setSelectedPO(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable PO Voucher */}
      {printPO && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 660, padding: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)" }} className="no-print">
              <div>
                <span style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.95rem" }}>Purchase Order Voucher</span>
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginLeft: 8 }}>{printPO.purchaseNumber}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.print()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Printer size={14} /> Print Voucher
                </button>
                <button onClick={() => setPrintPO(null)} className="modal-close"><X size={18} /></button>
              </div>
            </div>

            <div
              id="printable-po"
              style={{
                padding: "28px 32px",
                background: "#ffffff",
                color: "#111827",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              {/* Document Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111827", paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#111827" }}>INVENSMART AI / MAC COMPUTERS</div>
                  <div style={{ fontSize: "0.76rem", color: "#4b5563" }}>Akwa Central, Douala — Cameroun</div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>Tel: (+237) 651 704 545 • NIU: M01241678902A</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--brand-700)" }}>BON DE COMMANDE</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: "0.9rem" }}>{printPO.purchaseNumber}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                    Date: {new Date(printPO.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Supplier & Order Terms Box */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "var(--gray-50)", padding: 14, borderRadius: 8, marginBottom: 18, border: "1px solid var(--gray-200)" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--gray-500)" }}>Fournisseur / Supplier:</div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827", marginTop: 2 }}>{printPO.vendorName || "General Tech Supplier"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#4b5563" }}>Conditions: {printPO.paymentTerms || "Cash On Delivery"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--gray-500)" }}>Statut &amp; Livraison:</div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: 2 }}>Statut: {printPO.status}</div>
                  {printPO.expectedDeliveryDate && (
                    <div style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                      Livraison Prévue: {new Date(printPO.expectedDeliveryDate).toLocaleDateString("en-GB")}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: "#111827", color: "#fff", textAlign: "left", fontSize: "0.76rem" }}>
                    <th style={{ padding: "8px 10px" }}>Désignation / Article</th>
                    <th style={{ padding: "8px 10px" }}>SKU</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Qté Commandée</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Prix Unitaire (CFA)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Total (CFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {printPO.items.map((i, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb", fontSize: "0.82rem" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{i.productName}</td>
                      <td className="mono" style={{ padding: "8px 10px", color: "#6b7280" }}>{i.productSku}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>{i.quantityOrdered}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>{formatCFA(i.unitPrice)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{formatCFA(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Box */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
                <div style={{ minWidth: 260, border: "2px solid #111827", borderRadius: 6, padding: 12, background: "var(--gray-50)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 900 }}>
                    <span>TOTAL ESTIMÉ (CFA):</span>
                    <span style={{ color: "var(--brand-700)" }}>{formatCFA(printPO.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 40, borderTop: "1px dashed #9ca3af", paddingTop: 16 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151" }}>Responsable Achats / Inventory Manager:</div>
                  <div style={{ height: 40 }} />
                  <div style={{ borderTop: "1px solid #d1d5db", width: "80%", fontSize: "0.7rem", color: "#6b7280", paddingTop: 4 }}>
                    Signature &amp; Cachet
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151" }}>Accusé de Réception Fournisseur:</div>
                  <div style={{ height: 40 }} />
                  <div style={{ borderTop: "1px solid #d1d5db", width: "80%", fontSize: "0.7rem", color: "#6b7280", paddingTop: 4 }}>
                    Date &amp; Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
