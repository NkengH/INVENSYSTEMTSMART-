import { connectToDatabase } from "@/db";
import { Purchase, PurchaseItem, Product } from "@/db/schema";
import { formatCFA } from "@/lib/format";
import { ReceptionForm } from "./ReceptionForm";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReceptionPage() {
  await connectToDatabase();
  const pendingPurchases = await Purchase.find({
    status: { $in: ["Submitted", "Partially Received"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const pIds = pendingPurchases.map((p) => p._id);
  const items = pIds.length ? await PurchaseItem.find({ purchaseId: { $in: pIds as any } }).lean() : [];

  const prodIds = items.map((i) => i.productId);
  const prods = prodIds.length ? await Product.find({ _id: { $in: prodIds as any } }).lean() : [];

  const purchasesWithItems = pendingPurchases.map((p) => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    purchaseNumber: p.purchaseNumber,
    status: p.status,
    totalAmount: p.totalAmount,
    createdAt: p.createdAt,
    items: items
      .filter((i) => i.purchaseId.toString() === p._id.toString())
      .map((i) => {
        const prod = prods.find((prod) => prod._id.toString() === i.productId.toString());
        return {
          id: i._id.toString(),
          _id: i._id.toString(),
          purchaseId: i.purchaseId.toString(),
          productId: i.productId.toString(),
          quantityOrdered: i.quantityOrdered,
          quantityReceived: i.quantityReceived || 0,
          unitPrice: i.unitPrice,
          product: prod
            ? {
                id: prod._id.toString(),
                name: prod.name,
                sku: prod.sku,
              }
            : undefined,
        };
      }),
  }));

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Stock Reception</h1>
          <p className="page-subtitle">Receive incoming goods from supplier purchase orders into warehouse inventory</p>
        </div>
        <span className="badge badge-amber">{purchasesWithItems.length} orders awaiting receipt</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {purchasesWithItems.map((p) => {
          const totalOrdered = p.items.reduce((acc, i) => acc + i.quantityOrdered, 0);
          const totalReceived = p.items.reduce((acc, i) => acc + (i.quantityReceived || 0), 0);
          const pendingCount = totalOrdered - totalReceived;

          return (
            <div key={p.id} className="card">
              <div className="card-header" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Package size={18} style={{ color: "var(--brand-600)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "1rem" }}>{p.purchaseNumber}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                      Ordered on {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} &bull; Total Value: <strong>{formatCFA(p.totalAmount)}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`badge ${p.status === "Partially Received" ? "badge-blue" : "badge-amber"}`}>
                    {p.status}
                  </span>
                  <ReceptionForm purchaseId={p.id} purchaseNumber={p.purchaseNumber} items={p.items} />
                </div>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Remaining Pending</th>
                      <th>Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((i) => {
                      const pending = i.quantityOrdered - i.quantityReceived;
                      return (
                        <tr key={i.id}>
                          <td>
                            <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{i.product?.name || "Unknown Product"}</span>
                            <span className="mono" style={{ display: "block", fontSize: "0.75rem", color: "var(--gray-400)" }}>
                              {i.product?.sku}
                            </span>
                          </td>
                          <td style={{ color: "var(--gray-700)" }}>{i.quantityOrdered}</td>
                          <td style={{ color: "var(--success)", fontWeight: 600 }}>{i.quantityReceived}</td>
                          <td>
                            {pending > 0 ? (
                              <span className="badge badge-amber">{pending} pending</span>
                            ) : (
                              <span className="badge badge-green">✓ Complete</span>
                            )}
                          </td>
                          <td style={{ color: "var(--gray-600)" }}>{formatCFA(i.unitPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {purchasesWithItems.length === 0 && (
          <div className="card">
            <div className="card-body">
              <div className="table-empty">
                <span className="table-empty-icon">📦</span>
                <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Pending Receptions</p>
                <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", margin: 0 }}>
                  All purchase orders have been fully received or none are currently submitted.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
