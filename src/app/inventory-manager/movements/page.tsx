import { connectToDatabase } from "@/db";
import { StockMovement, Product } from "@/db/schema";
import { ArrowRightLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const movementBadge: Record<string, { cls: string; label: string }> = {
  RECEIVE: { cls: "badge-green",  label: "↑ Receive"  },
  RECEIPT: { cls: "badge-green",  label: "↑ Receipt"  },
  ISSUE:   { cls: "badge-amber",  label: "↓ Issue"    },
  SALE:    { cls: "badge-blue",   label: "↓ Sale"     },
  RETURN:  { cls: "badge-purple", label: "↑ Return"   },
  ADJUST:  { cls: "badge-gray",   label: "⟳ Adjust"  },
};

function getMvBadge(type: string) {
  return movementBadge[type] || { cls: "badge-gray", label: type };
}

export default async function MovementsPage() {
  await connectToDatabase();
  const movements = await StockMovement.find().sort({ createdAt: -1 }).limit(100).lean();
  const pIds = movements.map((m) => m.productId);
  const prods = pIds.length ? await Product.find({ _id: { $in: pIds as any } }).lean() : [];

  const receiveCount = movements.filter((m) => m.movementType === "RECEIVE" || m.movementType === "RECEIPT").length;
  const issueCount   = movements.filter((m) => m.movementType === "ISSUE" || m.movementType === "SALE").length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">Inventory transaction history — last 100 movements across all channels</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><ArrowRightLeft size={18} /></div>
          <div className="stat-card-label">Total Movements</div>
          <div className="stat-card-value">{movements.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><ArrowUpCircle size={18} /></div>
          <div className="stat-card-label">Stock In</div>
          <div className="stat-card-value" style={{ color: "var(--success)" }}>{receiveCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><ArrowDownCircle size={18} /></div>
          <div className="stat-card-label">Stock Out</div>
          <div className="stat-card-value" style={{ color: "var(--warning)" }}>{issueCount}</div>
        </div>
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-title">Movement Log</div>
          <span className="badge badge-gray">{movements.length} entries</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Stock Change</th>
              <th>Reason / Details</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const p   = prods.find((prod) => prod._id.toString() === m.productId?.toString());
              const mv  = getMvBadge(m.movementType);
              const isOut = m.movementType === "ISSUE" || m.movementType === "SALE";
              return (
                <tr key={m._id.toString()}>
                  <td>
                    <span className="mono" style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{p?.name || "Unknown"}</td>
                  <td><span className={`badge ${mv.cls}`}>{mv.label}</span></td>
                  <td>
                    <span style={{ fontWeight: 700, color: isOut ? "var(--danger)" : "var(--success)" }}>
                      {isOut ? `−${m.quantity}` : `+${m.quantity}`}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--gray-500)", fontSize: "0.82rem" }}>
                      {m.previousQuantity}
                      <span style={{ margin: "0 6px", color: "var(--gray-300)" }}>→</span>
                      <strong style={{ color: "var(--gray-800)" }}>{m.newQuantity}</strong>
                    </span>
                  </td>
                  <td style={{ color: "var(--gray-600)", fontSize: "0.82rem" }}>
                    {m.reason || "—"}
                  </td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty">
                    <span className="table-empty-icon">📊</span>
                    No stock movements recorded yet. Movements appear when stock is received, issued, or sold.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
