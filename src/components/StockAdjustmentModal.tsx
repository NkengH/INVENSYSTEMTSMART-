"use client";

import { useState } from "react";
import { adjustStock, AdjustStockPayload } from "@/app/actions/adjustments";
import { X, CheckCircle, SlidersHorizontal, ArrowRight } from "lucide-react";

export interface StockAdjustmentProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockAdjustmentModalProps {
  product: StockAdjustmentProduct;
  onClose: () => void;
  onSuccess?: (newQuantity: number) => void;
}

export function StockAdjustmentModal({ product, onClose, onSuccess }: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "DEDUCT" | "SET">("ADD");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<AdjustStockPayload["reason"]>("AUDIT_DISCREPANCY");
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentStock = product.stock ?? 0;
  const projectedStock =
    adjustmentType === "ADD"
      ? currentStock + (Number(adjustQty) || 0)
      : adjustmentType === "DEDUCT"
      ? Math.max(0, currentStock - (Number(adjustQty) || 0))
      : Number(adjustQty) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await adjustStock({
        productId: product.id,
        adjustmentType,
        quantity: Number(adjustQty),
        reason: adjustReason,
        notes: adjustNotes || undefined,
      });

      const label =
        adjustmentType === "SET"
          ? `set to ${res.newQuantity}`
          : adjustmentType === "ADD"
          ? `increased by +${adjustQty} (now ${res.newQuantity})`
          : `decreased by -${adjustQty} (now ${res.newQuantity})`;

      setSuccess(`Stock for "${product.name}" successfully ${label} units.`);
      if (onSuccess) {
        onSuccess(res.newQuantity);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to record stock adjustment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SlidersHorizontal size={18} style={{ color: "var(--brand-600)" }} />
              Inventory Stock Adjustment
            </h2>
            <div style={{ fontSize: "0.76rem", color: "var(--gray-500)", marginTop: 2 }}>
              {product.name} (<span style={{ fontFamily: "monospace" }}>{product.sku}</span>) • Current: <strong>{currentStock} units</strong>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="form-error" style={{ margin: "16px 24px 0" }}>
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              margin: "16px 24px 0",
              padding: "10px 14px",
              background: "#ecfdf5",
              borderRadius: 8,
              border: "1px solid #6ee7b7",
              color: "#065f46",
              fontWeight: 600,
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} color="#10b981" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                    transition: "all 0.15s ease",
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
                    transition: "all 0.15s ease",
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
                    transition: "all 0.15s ease",
                  }}
                >
                  Set Exact Qty
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label" htmlFor="stock-adj-qty">
                  {adjustmentType === "SET" ? "Target Total Quantity" : "Adjustment Quantity"}
                </label>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{currentStock}</span>
                  <ArrowRight size={12} />
                  <strong style={{ color: projectedStock > 0 ? "var(--success)" : "var(--danger)" }}>
                    {projectedStock} units
                  </strong>
                </span>
              </div>
              <input
                id="stock-adj-qty"
                type="number"
                min={adjustmentType === "SET" ? "0" : "1"}
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="stock-adj-reason">Audit Reason Code</label>
              <select
                id="stock-adj-reason"
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
              <label className="form-label" htmlFor="stock-adj-notes">Authorized Notes (Optional)</label>
              <input
                id="stock-adj-notes"
                type="text"
                placeholder="e.g. Approved by Warehouse Manager"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="btn btn-primary btn-sm"
              style={{ minWidth: 160 }}
            >
              {success ? (
                <>
                  <CheckCircle size={14} /> Saved!
                </>
              ) : loading ? (
                <>
                  <span className="loading-spinner" /> Saving...
                </>
              ) : (
                "Confirm Stock Adjustment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
