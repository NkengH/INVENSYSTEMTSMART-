"use client";

import { useState } from "react";
import { issueStock } from "@/app/actions/issuance";
import { Box, CheckCircle } from "lucide-react";

export function IssuanceForm({ products }: { products: any[] }) {
  const [productId, setProductId] = useState(products.length > 0 ? products[0].id : "");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await issueStock(productId, parseInt(quantity), reason);
      setSuccess(`Successfully issued ${quantity} units of ${selectedProduct?.name}.`);
      setQuantity("1");
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to issue stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="form-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="product-select">Select Product to Issue</label>
        <select
          id="product-select"
          className="form-select"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setSuccess("");
            setError("");
          }}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — Available: {p.stock} units
            </option>
          ))}
        </select>
        {selectedProduct && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 4 }}>
            Current stock: <strong style={{ color: selectedProduct.stock > 0 ? "var(--success)" : "var(--danger)" }}>{selectedProduct.stock} units</strong>
          </div>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="qty-input">Quantity to Issue</label>
        <input
          id="qty-input"
          type="number"
          min="1"
          max={selectedProduct?.stock || 1}
          className="form-input"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          placeholder="e.g. 5"
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="reason-input">Reason / Destination Department</label>
        <input
          id="reason-input"
          type="text"
          className="form-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Internal department requisition #104"
          required
        />
      </div>

      <button
        disabled={loading || !selectedProduct || selectedProduct.stock < parseInt(quantity) || selectedProduct.stock === 0}
        type="submit"
        className="btn btn-primary"
        style={{ marginTop: 8 }}
      >
        {loading ? (
          <>
            <span className="loading-spinner" /> Processing Issuance...
          </>
        ) : (
          <>
            <Box size={16} /> Confirm Stock Issuance
          </>
        )}
      </button>
    </form>
  );
}
