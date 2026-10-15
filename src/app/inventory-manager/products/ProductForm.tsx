"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, toggleProductActive } from "@/app/actions/products";
import { sounds } from "@/lib/sound";
import {
  Plus, Edit2, Power, X, CheckCircle, Package, Tag, DollarSign,
  Layers, AlertTriangle, ArrowRight, RotateCcw
} from "lucide-react";

export function ProductForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedProduct, setSavedProduct] = useState<{ name: string; sku: string; initialStock: number } | null>(null);

  function openFresh() {
    setError("");
    setSavedProduct(null);
    formRef.current?.reset();
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const productName = (formData.get("name") as string)?.trim();
    const productSku = (formData.get("sku") as string)?.trim().toUpperCase();
    const initialStock = parseInt(formData.get("initialStock") as string, 10) || 0;

    try {
      await createProduct({
        name: productName,
        sku: productSku,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        sellingPrice: parseFloat(formData.get("sellingPrice") as string),
        initialStock,
        minimumStock: parseInt(formData.get("minimumStock") as string, 10) || 0,
        unit: formData.get("unit") as string || "pcs",
      });

      try { sounds.playSaleSuccess(); } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
      setSavedProduct({ name: productName, sku: productSku, initialStock });
    } catch (err: any) {
      setError(err.message || "Failed to create product. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAddAnother() {
    setSavedProduct(null);
    setError("");
    setTimeout(() => formRef.current?.reset(), 0);
  }

  function handleViewInventory() {
    setIsOpen(false);
    if (savedProduct) {
      router.push(`/inventory-manager/inventory?highlight=${encodeURIComponent(savedProduct.sku)}`);
    }
  }

  return (
    <>
      <button onClick={openFresh} className="btn btn-primary btn-sm">
        <Plus size={15} /> Add New Product
      </button>

      {isOpen && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>

            {/* ── SUCCESS STATE ── */}
            {savedProduct ? (
              <>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "40px 32px 28px",
                  gap: 16,
                }}>
                  {/* Big green check icon */}
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px -4px rgba(16,185,129,0.35)",
                  }}>
                    <CheckCircle size={38} color="#059669" strokeWidth={2.5} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, fontSize: "1.25rem", color: "var(--gray-900)", marginBottom: 6 }}>
                      Product Added Successfully!
                    </div>
                    <div style={{ color: "var(--gray-500)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--gray-800)" }}>{savedProduct.name}</strong> has been created
                      {savedProduct.initialStock > 0 && (
                        <> with <strong style={{ color: "#059669" }}>{savedProduct.initialStock} units</strong> in stock</>
                      )}.
                    </div>
                  </div>

                  {/* Product summary pill */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--gray-50)",
                    border: "1px solid var(--gray-200)",
                    borderRadius: 10,
                    padding: "10px 18px",
                    width: "100%",
                    justifyContent: "center",
                  }}>
                    <Package size={16} color="var(--brand-600)" />
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--gray-800)" }}>{savedProduct.name}</span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "var(--gray-200)", borderRadius: 4, padding: "2px 8px", color: "var(--gray-600)" }}>{savedProduct.sku}</span>
                    {savedProduct.initialStock > 0 && (
                      <span style={{ fontSize: "0.78rem", background: "#d1fae5", color: "#065f46", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>
                        {savedProduct.initialStock} in stock
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
                    <button
                      onClick={handleAddAnother}
                      className="btn btn-secondary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                    >
                      <RotateCcw size={15} /> Add Another Product
                    </button>
                    <button
                      onClick={handleViewInventory}
                      className="btn btn-primary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                    >
                      View in Inventory <ArrowRight size={15} />
                    </button>
                  </div>

                  <button
                    onClick={() => { setIsOpen(false); setSavedProduct(null); }}
                    style={{ background: "none", border: "none", color: "var(--gray-400)", fontSize: "0.8rem", cursor: "pointer", marginTop: -4 }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              /* ── FORM STATE ── */
              <>
                <div className="modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#ede9fe,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={17} color="var(--brand-600)" />
                    </div>
                    <div>
                      <h2 className="modal-title" style={{ margin: 0 }}>Add New Product</h2>
                      <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--gray-500)" }}>Fill in details below — stock is set here, no extra steps needed</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
                </div>

                {error && (
                  <div
                    style={{
                      margin: "16px 24px 0",
                      padding: "12px 16px",
                      background: "#fef2f2",
                      border: "1px solid #fca5a5",
                      borderRadius: 8,
                      color: "#991b1b",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                    <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", marginLeft: "auto", flexShrink: 0 }}><X size={13} /></button>
                  </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Product Identity */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Package size={13} /> Product Name
                        </label>
                        <input name="name" required className="form-input" placeholder="e.g. HDD Hard Drive 1TB" style={{ margin: 0 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Tag size={13} /> SKU Code
                        </label>
                        <input name="sku" required className="form-input" placeholder="e.g. HDD-1TB-001" style={{ margin: 0 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Layers size={13} /> Unit of Measure
                        </label>
                        <input name="unit" defaultValue="pcs" className="form-input" placeholder="pcs, box, kg..." style={{ margin: 0 }} />
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <DollarSign size={11} /> Pricing
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label className="form-label">Purchase / Cost Price (CFA)</label>
                          <input name="purchasePrice" type="number" step="1" min="0" required className="form-input" placeholder="e.g. 25000" style={{ margin: 0 }} />
                        </div>
                        <div>
                          <label className="form-label">Selling Price (CFA)</label>
                          <input name="sellingPrice" type="number" step="1" min="0" required className="form-input" placeholder="e.g. 45000" style={{ margin: 0 }} />
                        </div>
                      </div>
                    </div>

                    {/* Stock Setup — done right here, no second step */}
                    <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #a7f3d0", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                        <Layers size={11} /> Stock Setup — Set quantity now, no extra steps needed
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ color: "#065f46" }}>Starting Stock Quantity</label>
                          <input
                            name="initialStock"
                            type="number"
                            min="0"
                            defaultValue="0"
                            required
                            className="form-input"
                            style={{ margin: 0, borderColor: "#6ee7b7", fontWeight: 700 }}
                            placeholder="How many units do you have right now?"
                          />
                          <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: 3 }}>Enter 0 if you have none yet</div>
                        </div>
                        <div>
                          <label className="form-label" style={{ color: "#065f46" }}>Low Stock Alert Threshold</label>
                          <input
                            name="minimumStock"
                            type="number"
                            min="0"
                            defaultValue="5"
                            required
                            className="form-input"
                            style={{ margin: 0, borderColor: "#6ee7b7" }}
                            placeholder="e.g. 5"
                          />
                          <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: 3 }}>Alert when stock drops below this</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <><span className="loading-spinner" /> Saving Product...</>
                      ) : (
                        <><CheckCircle size={15} /> Save Product &amp; Set Stock</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function EditProductModal({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const productName = (formData.get("name") as string)?.trim();
    try {
      await updateProduct(product.id, {
        name: productName,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        sellingPrice: parseFloat(formData.get("sellingPrice") as string),
        minimumStock: parseInt(formData.get("minimumStock") as string, 10),
        unit: formData.get("unit") as string,
      });
      if (typeof window !== "undefined") {
        try { sounds.playSaleSuccess(); } catch {}
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
      setSuccess(`Product "${productName}" updated successfully!`);
      setTimeout(() => {
        setSuccess("");
        setIsOpen(false);
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => { setError(""); setSuccess(""); setIsOpen(true); }} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: "0.78rem" }} title="Edit Product">
        <Edit2 size={13} /> Edit
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Product — {product.sku}</h2>
              <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
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
                  padding: "12px 16px",
                  background: "#ecfdf5",
                  border: "1px solid #10b981",
                  borderRadius: 8,
                  color: "#065f46",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle size={18} color="#10b981" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Product Name</label>
                  <input name="name" defaultValue={product.name} required className="form-input" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Purchase Price (CFA)</label>
                    <input name="purchasePrice" type="number" step="1" min="0" defaultValue={product.purchasePrice} required className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (CFA)</label>
                    <input name="sellingPrice" type="number" step="1" min="0" defaultValue={product.sellingPrice} required className="form-input" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Min Stock Threshold</label>
                    <input name="minimumStock" type="number" min="0" defaultValue={product.minimumStock} required className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit of Measure</label>
                    <input name="unit" defaultValue={product.unit || "pcs"} className="form-input" />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !!success}>
                  {loading ? "Updating..." : success ? "Updated!" : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ToggleProductActiveButton({ productId, isActive }: { productId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleProductActive(productId);
    } catch (err: any) {
      alert(err.message || "Failed to update product status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
      title={isActive ? "Deactivate Product" : "Activate Product"}
    >
      <Power size={13} /> {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
