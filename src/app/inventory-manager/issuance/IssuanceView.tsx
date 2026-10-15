"use client";

import { useState } from "react";
import { issueStock } from "@/app/actions/issuance";
import { StockAdjustmentModal, StockAdjustmentProduct } from "@/components/StockAdjustmentModal";
import { Box, Layers, CheckCircle, Search, SlidersHorizontal, AlertTriangle } from "lucide-react";

export interface IssuanceProduct {
  id: string;
  _id: string;
  name: string;
  sku: string;
  stock: number;
}

export function IssuanceView({ initialProducts }: { initialProducts: IssuanceProduct[] }) {
  const [products, setProducts] = useState<IssuanceProduct[]>(initialProducts);
  const [productId, setProductId] = useState<string>(initialProducts.length > 0 ? initialProducts[0].id : "");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Stock adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<StockAdjustmentProduct | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleIssueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const qtyNumber = parseInt(quantity, 10);
    try {
      await issueStock(productId, qtyNumber, reason);
      // Immediately update local product stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: Math.max(0, p.stock - qtyNumber) } : p
        )
      );
      setSuccess(`Successfully issued ${qtyNumber} units of ${selectedProduct?.name}.`);
      setQuantity("1");
      setReason("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
    } catch (err: any) {
      setError(err.message || "Failed to issue stock");
    } finally {
      setLoading(false);
    }
  }

  function handleStockAdjustSuccess(newQuantity: number) {
    if (!adjustingProduct) return;
    const adjustedId = adjustingProduct.id;
    setProducts((prev) =>
      prev.map((p) => (p.id === adjustedId ? { ...p, stock: newQuantity } : p))
    );
    setSuccess(`Stock for "${adjustingProduct.name}" successfully updated to ${newQuantity} units.`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inventory:change"));
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Banner Alert Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="form-error" style={{ marginBottom: 20 }}>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Left Card: Issue Stock Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Box size={16} style={{ color: "var(--brand-600)" }} />
              Issue Inventory Items
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleIssueSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="product-select">
                  Select Product to Issue
                </label>
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "var(--gray-50)",
                      borderRadius: 8,
                      border: "1px solid var(--gray-200)",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--gray-600)" }}>Current Stock:</span>
                      <strong
                        style={{
                          color: selectedProduct.stock > 0 ? "var(--success)" : "var(--danger)",
                          fontSize: "0.88rem",
                        }}
                      >
                        {selectedProduct.stock} units
                      </strong>
                    </div>

                    {/* Adjust Stock Button in Form */}
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustingProduct({
                          id: selectedProduct.id,
                          name: selectedProduct.name,
                          sku: selectedProduct.sku,
                          stock: selectedProduct.stock,
                        })
                      }
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      title="Adjust physical stock quantity"
                    >
                      <SlidersHorizontal size={13} style={{ color: "var(--brand-600)" }} />
                      Adjust Stock
                    </button>
                  </div>
                )}

                {selectedProduct && selectedProduct.stock === 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "0.78rem",
                      color: "var(--amber-700, #b45309)",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 6,
                      padding: "6px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>This item is out of stock. Click &quot;Adjust Stock&quot; above to add inventory.</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="qty-input">
                  Quantity to Issue
                </label>
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
                  disabled={!selectedProduct || selectedProduct.stock === 0}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reason-input">
                  Reason / Destination Department
                </label>
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
                disabled={
                  loading ||
                  !selectedProduct ||
                  selectedProduct.stock < parseInt(quantity || "0", 10) ||
                  selectedProduct.stock === 0
                }
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 4 }}
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
          </div>
        </div>

        {/* Right Card: Stock Availability Quick-View & Adjust */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} style={{ color: "var(--gray-500)" }} />
              Stock Availability Quick-View
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
              {products.length} products
            </span>
          </div>

          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gray-200)" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }}
              />
              <input
                type="text"
                placeholder="Filter by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 32, fontSize: "0.8rem", marginBottom: 0 }}
              />
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, maxHeight: 440, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Available</th>
                  <th style={{ textAlign: "right", width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--gray-500)", padding: 20 }}>
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: "var(--gray-800)", fontSize: "0.84rem" }}>
                        {p.name}
                      </td>
                      <td>
                        <span className="mono badge badge-gray" style={{ fontSize: "0.72rem" }}>
                          {p.sku}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.stock > 0 ? "badge-green" : "badge-red"}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustingProduct({
                              id: p.id,
                              name: p.name,
                              sku: p.sku,
                              stock: p.stock,
                            })
                          }
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.72rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          title={`Adjust stock for ${p.name}`}
                        >
                          <SlidersHorizontal size={11} style={{ color: "var(--brand-600)" }} />
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <StockAdjustmentModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={handleStockAdjustSuccess}
        />
      )}
    </>
  );
}
