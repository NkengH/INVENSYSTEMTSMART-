import { connectToDatabase } from "@/db";
import { Receipt, Sale, SaleItem, Refund, RefundItem, Product, User } from "@/db/schema";
import { formatCFA } from "@/lib/format";
import { ReceiptViewer, ReceiptDetail } from "./ReceiptViewer";
import { Receipt as ReceiptIcon, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CashierReceiptsPage() {
  await connectToDatabase();
  const allReceipts = await Receipt.find().sort({ createdAt: -1 }).limit(50).lean();

  const saleIds = allReceipts.filter((r) => r.type === "SALE").map((r) => r.referenceId);
  const refundIds = allReceipts.filter((r) => r.type === "REFUND").map((r) => r.referenceId);

  const [sales, refunds, allUsers, allProducts] = await Promise.all([
    saleIds.length ? Sale.find({ _id: { $in: saleIds as any } }).lean() : [],
    refundIds.length ? Refund.find({ _id: { $in: refundIds as any } }).lean() : [],
    User.find().lean(),
    Product.find().lean(),
  ]);

  const [saleItems, refundItems] = await Promise.all([
    saleIds.length ? SaleItem.find({ saleId: { $in: saleIds as any } }).lean() : [],
    refundIds.length ? RefundItem.find({ refundId: { $in: refundIds as any } }).lean() : [],
  ]);

  const detailedReceipts: ReceiptDetail[] = allReceipts.map((r) => {
    if (r.type === "SALE") {
      const sale = sales.find((s) => s._id.toString() === r.referenceId);
      const cashier = allUsers.find((u) => u._id.toString() === sale?.cashierId?.toString());
      const items = saleItems
        .filter((si) => si.saleId.toString() === r.referenceId)
        .map((si) => {
          const prod = allProducts.find((p) => p._id.toString() === si.productId.toString());
          return {
            productName: prod?.name || "Product",
            productSku: prod?.sku || "—",
            quantity: si.quantity,
            unitPrice: si.unitPrice,
            total: si.quantity * si.unitPrice,
          };
        });

      return {
        id: r._id.toString(),
        receiptNumber: r.receiptNumber,
        type: "SALE",
        referenceId: sale?.saleNumber || r.referenceId,
        createdAt: r.createdAt ? r.createdAt.toISOString() : "",
        cashierName: cashier?.username || "Cashier",
        tillSessionId: sale?.tillSessionId?.toString() || "—",
        paymentMethod: sale?.paymentMethod || "CASH",
        totalAmount: sale?.totalAmount || 0,
        items,
      };
    } else {
      const refund = refunds.find((ref) => ref._id.toString() === r.referenceId);
      const cashier = allUsers.find((u) => u._id.toString() === refund?.cashierId?.toString());
      const items = refundItems
        .filter((ri) => ri.refundId.toString() === r.referenceId)
        .map((ri) => {
          const prod = allProducts.find((p) => p._id.toString() === ri.productId.toString());
          return {
            productName: prod?.name || "Product",
            productSku: prod?.sku || "—",
            quantity: ri.quantity,
            unitPrice: ri.unitPrice,
            total: ri.quantity * ri.unitPrice,
          };
        });

      return {
        id: r._id.toString(),
        receiptNumber: r.receiptNumber,
        type: "REFUND",
        referenceId: refund?.refundNumber || r.referenceId,
        createdAt: r.createdAt ? r.createdAt.toISOString() : "",
        cashierName: cashier?.username || "Cashier",
        tillSessionId: refund?.tillSessionId?.toString() || "—",
        paymentMethod: "REFUND",
        totalAmount: refund?.totalAmount || 0,
        items,
      };
    }
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Receipts Repository</h1>
          <p className="page-subtitle">View, verify, and reprint customer sales and refund receipts</p>
        </div>
        <span className="badge badge-gray">{detailedReceipts.length} receipts</span>
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-title">Transaction Receipts</div>
          <ReceiptIcon size={16} style={{ color: "var(--gray-400)" }} />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Transaction Type</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Cashier</th>
              <th>Date &amp; Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {detailedReceipts.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="mono" style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                    {r.receiptNumber}
                  </span>
                </td>
                <td>
                  <span className={`badge ${r.type === "SALE" ? "badge-green" : "badge-red"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {r.type === "SALE" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    {r.type === "SALE" ? "Customer Sale" : "Customer Refund"}
                  </span>
                </td>
                <td>
                  <span className="mono badge badge-gray">{r.referenceId}</span>
                </td>
                <td style={{ fontWeight: 700, color: r.type === "SALE" ? "var(--success)" : "var(--danger)" }}>
                  {r.type === "REFUND" ? "-" : ""}{formatCFA(r.totalAmount)}
                </td>
                <td style={{ color: "var(--gray-700)" }}>{r.cashierName}</td>
                <td style={{ color: "var(--gray-500)", fontSize: "0.82rem" }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td>
                  <ReceiptViewer receipt={r} />
                </td>
              </tr>
            ))}
            {detailedReceipts.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">
                    <span className="table-empty-icon">🧾</span>
                    <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Receipts Generated Yet</p>
                    <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", margin: 0 }}>
                      Receipts are automatically created whenever a sale or refund transaction is completed.
                    </p>
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
