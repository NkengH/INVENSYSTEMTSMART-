"use client";

import { useState } from "react";
import { createPurchase } from "@/app/actions/purchases";
import { formatCFA } from "@/lib/format";
import { Plus, ShoppingCart, Trash2, X, Building, Calendar, FileText, CreditCard } from "lucide-react";

const VENDOR_PRESETS = [
  "HP Central Africa SARL",
  "Apple CEMAC Distributor",
  "Dell Technologies Partner",
  "Lenovo West Africa",
  "Ingram Micro CEMAC",
  "Logitech Authorized Hub",
  "Samsung Electronics Douala",
];

const PAYMENT_TERMS_OPTIONS = [
  "Cash On Delivery",
  "Net 30 Days",
  "Net 60 Days",
  "Advance Payment (50%)",
  "Immediate Wire Transfer",
];

export function PurchaseForm({ products }: { products: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [vendorName, setVendorName] = useState(VENDOR_PRESETS[0]);
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS_OPTIONS[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function addItem() {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1, unitPrice: products[0].purchasePrice || 0 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Please add at least one line item to the purchase order.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createPurchase({
        vendorName,
        paymentTerms,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        items,
      });
      setIsOpen(false);
      setItems([]);
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          if (items.length === 0) addItem();
        }}
        className="btn btn-primary btn-sm"
      >
        <Plus size={15} /> Create Purchase Order
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create Supplier Purchase Order</h2>
                <p style={{ fontSize: "0.76rem", color: "var(--gray-500)", margin: "2px 0 0" }}>
                  Generate an official purchase order for stock replenishment
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
            </div>

            {error && (
              <div className="form-error" style={{ margin: "16px 24px 0" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Vendor & Terms Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, padding: 12, background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-200)" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Building size={13} /> Supplier / Vendor Name
                    </label>
                    <input
                      type="text"
                      list="vendor-presets"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="form-input"
                      placeholder="Enter or select vendor..."
                      required
                      style={{ margin: 0, fontSize: "0.82rem", padding: "8px 10px" }}
                    />
                    <datalist id="vendor-presets">
                      {VENDOR_PRESETS.map((v) => (
                        <option key={v} value={v} />
                      ))}
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
                      style={{ margin: 0, fontSize: "0.82rem", padding: "8px 10px" }}
                    >
                      {PAYMENT_TERMS_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={13} /> Expected Delivery (Optional)
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="form-input"
                      style={{ margin: 0, fontSize: "0.82rem", padding: "8px 10px" }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <FileText size={13} /> Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priority shipment via Douala Port"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="form-input"
                      style={{ margin: 0, fontSize: "0.82rem", padding: "8px 10px" }}
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gray-800)", textTransform: "uppercase" }}>
                      Order Line Items ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                    >
                      <Plus size={12} /> Add Item Row
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 2 }}>
                    {items.map((item, index) => {
                      return (
                        <div
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2.5fr 1fr 1.2fr auto",
                            gap: 8,
                            alignItems: "center",
                            padding: 8,
                            background: "var(--gray-50)",
                            borderRadius: 6,
                            border: "1px solid var(--gray-200)",
                          }}
                        >
                          <div>
                            <select
                              className="form-select"
                              value={item.productId}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].productId = e.target.value;
                                const p = products.find((x) => x.id === e.target.value);
                                if (p) newItems[index].unitPrice = p.purchasePrice || 0;
                                setItems(newItems);
                              }}
                              style={{ margin: 0, padding: "6px 8px", fontSize: "0.78rem" }}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].quantity = parseInt(e.target.value) || 1;
                                setItems(newItems);
                              }}
                              className="form-input"
                              placeholder="Qty"
                              style={{ margin: 0, padding: "6px 8px", fontSize: "0.78rem" }}
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                setItems(newItems);
                              }}
                              className="form-input"
                              placeholder="Unit Cost (CFA)"
                              style={{ margin: 0, padding: "6px 8px", fontSize: "0.78rem" }}
                            />
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => setItems(items.filter((_, i) => i !== index))}
                              style={{ border: "none", background: "none", color: "var(--gray-400)", cursor: "pointer", padding: 4 }}
                              title="Delete row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total PO Summary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--brand-50)", borderRadius: 8, border: "1px solid var(--brand-200)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-900)" }}>
                    Estimated Total Order Cost (CFA):
                  </span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--brand-700)" }}>
                    {formatCFA(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "16px 24px" }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading || items.length === 0} className="btn btn-primary btn-sm">
                  {loading ? "Submitting Order..." : "Confirm & Submit PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
