"use client";

import { useState } from "react";
import { receivePurchase } from "@/app/actions/reception";
import { PackageCheck, X } from "lucide-react";

export function ReceptionForm({ purchaseId, purchaseNumber, items }: { purchaseId: string; purchaseNumber: string; items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [received, setReceived] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pendingItems = items.filter((i) => (i.quantityOrdered - (i.quantityReceived || 0)) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = Object.keys(received)
        .filter((itemId) => received[itemId] > 0)
        .map((itemId) => ({ itemId, received: received[itemId] }));

      if (data.length === 0) {
        throw new Error("Please enter at least one received quantity greater than 0");
      }

      await receivePurchase(purchaseId, data);
      setIsOpen(false);
      setReceived({});
    } catch (err: any) {
      setError(err.message || "Failed to confirm stock reception");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-success btn-sm">
        <PackageCheck size={15} /> Receive Items
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Receive Stock — {purchaseNumber}</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", margin: 0 }}>
                  Enter the actual physical quantities received from supplier to increase inventory.
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
              <div className="modal-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Prev Recv</th>
                      <th>Pending</th>
                      <th>Receive Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((i) => {
                      const pending = i.quantityOrdered - (i.quantityReceived || 0);
                      return (
                        <tr key={i.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{i.product?.name}</div>
                            <div className="mono" style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{i.product?.sku}</div>
                          </td>
                          <td style={{ color: "var(--gray-600)" }}>{i.quantityOrdered}</td>
                          <td style={{ color: "var(--gray-600)" }}>{i.quantityReceived || 0}</td>
                          <td><span className="badge badge-amber">{pending}</span></td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={pending}
                              className="form-input"
                              style={{ width: 80, padding: "6px 8px" }}
                              placeholder="0"
                              value={received[i.id] ?? ""}
                              onChange={(e) => setReceived({ ...received, [i.id]: parseInt(e.target.value) || 0 })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner" /> Confirming...
                    </>
                  ) : (
                    <>
                      <PackageCheck size={16} /> Confirm Receipt
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
