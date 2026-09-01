"use client";

import { useState } from "react";
import { createProduct, updateProduct, toggleProductActive } from "@/app/actions/products";
import { Plus, Edit2, Power, X } from "lucide-react";

export function ProductForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createProduct({
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        sellingPrice: parseFloat(formData.get("sellingPrice") as string),
        minimumStock: parseInt(formData.get("minimumStock") as string, 10),
        unit: formData.get("unit") as string,
      });
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary btn-sm">
        <Plus size={15} /> Add New Product
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Product</h2>
              <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
            </div>

            {error && (
              <div className="form-error" style={{ margin: "16px 24px 0" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Product Name</label>
                  <input name="name" required className="form-input" placeholder="e.g. Wireless Mouse" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SKU (Stock Keeping Unit)</label>
                  <input name="sku" required className="form-input" placeholder="e.g. SKU-WM-001" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Purchase Price (CFA)</label>
                    <input name="purchasePrice" type="number" step="1" min="0" required className="form-input" placeholder="e.g. 7500" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (CFA)</label>
                    <input name="sellingPrice" type="number" step="1" min="0" required className="form-input" placeholder="e.g. 15000" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Min Stock Threshold</label>
                    <input name="minimumStock" type="number" min="0" defaultValue="5" required className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit of Measure</label>
                    <input name="unit" defaultValue="pcs" className="form-input" placeholder="pcs, box, kg..." />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner" /> Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} /> Save Product
                    </>
                  )}
                </button>
              </div>
            </form>
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

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateProduct(product.id, {
        name: formData.get("name") as string,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        sellingPrice: parseFloat(formData.get("sellingPrice") as string),
        minimumStock: parseInt(formData.get("minimumStock") as string, 10),
        unit: formData.get("unit") as string,
      });
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: "0.78rem" }} title="Edit Product">
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
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Updating..." : "Update Product"}
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
