"use client";

import { useState } from "react";
import { processRefund } from "@/app/actions/refunds";
import { formatCFA } from "@/lib/format";
import { RotateCcw, Search, CheckCircle, AlertTriangle } from "lucide-react";

interface SaleItemData {
  id: string;
  _id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  returnedQuantity: number;
  returnableQuantity: number;
}

interface SaleData {
  id: string;
  _id: string;
  saleNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: SaleItemData[];
}

export function RefundForm({ sales }: { sales: SaleData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleData | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [restoreStock, setRestoreStock] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSelectSale(sale: SaleData) {
    setSelectedSale(sale);
    setError(null);
    setSuccess(null);

    const initialQtys: Record<string, number> = {};
    const initialRestore: Record<string, boolean> = {};
    sale.items.forEach((item) => {
      initialQtys[item.id] = 0;
      initialRestore[item.id] = true;
    });
    setRefundQuantities(initialQtys);
    setRestoreStock(initialRestore);
  }

  const filteredSales = sales.filter((s) =>
    s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRefund = selectedSale
    ? selectedSale.items.reduce((sum, item) => {
        const qty = refundQuantities[item.id] || 0;
        return sum + qty * item.unitPrice;
      }, 0)
    : 0;

  async function handleConfirmRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSale) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const itemsToRefund = selectedSale.items
        .filter((item) => (refundQuantities[item.id] || 0) > 0)
        .map((item) => ({
          saleItemId: item.id,
          productId: item.productId,
          quantity: refundQuantities[item.id],
          unitPrice: item.unitPrice,
          restoreToInventory: restoreStock[item.id] ?? true,
        }));

      if (itemsToRefund.length === 0) {
        throw new Error("Please specify a refund quantity greater than 0 for at least one item.");
      }

      const res = await processRefund(selectedSale.id, itemsToRefund);
      setSuccess(`Refund ${res.refundNumber} processed successfully (${formatCFA(totalRefund)}). Stock restored where marked.`);
      setSelectedSale(null);
    } catch (err: any) {
      setError(err.message || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="form-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
        {/* Left column: Sale Search & Selection */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">1. Find Original Sale</div>
          </div>
          <div className="card-body">
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by sale number (e.g. SALE-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredSales.map((s) => {
                const isSelected = selectedSale?.id === s.id;
                const isFullyRefunded = s.status === "REFUNDED";

                return (
                  <div
                    key={s.id}
                    onClick={() => !isFullyRefunded && handleSelectSale(s)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? "var(--brand-600)" : "var(--gray-200)"}`,
                      background: isSelected ? "var(--brand-50)" : isFullyRefunded ? "var(--gray-50)" : "white",
                      cursor: isFullyRefunded ? "not-allowed" : "pointer",
                      opacity: isFullyRefunded ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-700)" }}>
                        {s.saleNumber}
                      </span>
                      <span className={`badge ${s.status === "REFUNDED" ? "badge-red" : s.status === "PARTIALLY_REFUNDED" ? "badge-amber" : "badge-green"}`}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--gray-500)" }}>
                      <span>{formatCFA(s.totalAmount)} ({s.paymentMethod})</span>
                      <span>{new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}

              {filteredSales.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: "var(--gray-400)", fontSize: "0.875rem" }}>
                  No matching sales found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Refund Item Selection & Confirmation */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              2. Select Items to Refund
              {selectedSale && (
                <span className="badge badge-indigo" style={{ marginLeft: 8 }}>
                  {selectedSale.saleNumber}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            {!selectedSale ? (
              <div className="table-empty">
                <span className="table-empty-icon">🔍</span>
                <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Sale Selected</p>
                <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", margin: 0 }}>
                  Select a sale transaction from the left panel to inspect items and initiate a refund.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmRefund}>
                <table className="data-table" style={{ marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Sold / Ret.</th>
                      <th>Refund Qty</th>
                      <th>Return to Stock?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{item.productName}</div>
                          <div className="mono" style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{item.productSku}</div>
                        </td>
                        <td style={{ color: "var(--gray-700)", fontWeight: 600 }}>{formatCFA(item.unitPrice)}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
                          {item.quantity} sold <br />
                          <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>({item.returnedQuantity || 0} returned)</span>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.returnableQuantity}
                            disabled={item.returnableQuantity === 0}
                            className="form-input"
                            style={{ width: 70, padding: "4px 8px" }}
                            value={refundQuantities[item.id] ?? 0}
                            onChange={(e) =>
                              setRefundQuantities({
                                ...refundQuantities,
                                [item.id]: Math.min(item.returnableQuantity, Math.max(0, parseInt(e.target.value) || 0)),
                              })
                            }
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={restoreStock[item.id] ?? true}
                            disabled={(refundQuantities[item.id] || 0) === 0}
                            onChange={(e) =>
                              setRestoreStock({
                                ...restoreStock,
                                [item.id]: e.target.checked,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--gray-200)", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>Total Refund Amount</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>
                      {formatCFA(totalRefund)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => setSelectedSale(null)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || totalRefund <= 0}
                      className="btn btn-danger"
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner" /> Processing...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} /> Confirm Refund ({formatCFA(totalRefund)})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
