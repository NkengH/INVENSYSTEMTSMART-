import { connectToDatabase } from "@/db";
import { Sale, SaleItem, Product, Refund, TillSession } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatCFA } from "@/lib/format";
import { RefundForm } from "./RefundForm";
import { RotateCcw, DollarSign, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CashierRefundsPage() {
  await connectToDatabase();
  const session = await getSession();

  const openTill = session
    ? await TillSession.findOne({ cashierId: session.userId, status: "OPEN" }).lean()
    : null;

  // Retrieve sales with items and product info
  const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(30).lean();
  const saleIds = recentSales.map((s) => s._id);
  const allSaleItems = saleIds.length ? await SaleItem.find({ saleId: { $in: saleIds as any } }).lean() : [];
  const prodIds = allSaleItems.map((si) => si.productId);
  const prods = prodIds.length ? await Product.find({ _id: { $in: prodIds as any } }).lean() : [];

  const formattedSales = recentSales.map((s) => {
    const items = allSaleItems
      .filter((si) => si.saleId.toString() === s._id.toString())
      .map((si) => {
        const prod = prods.find((p) => p._id.toString() === si.productId.toString());
        const returned = si.returnedQuantity || 0;
        return {
          id: si._id.toString(),
          _id: si._id.toString(),
          productId: si.productId.toString(),
          productName: prod?.name || "Unknown Product",
          productSku: prod?.sku || "—",
          quantity: si.quantity,
          unitPrice: si.unitPrice,
          returnedQuantity: returned,
          returnableQuantity: Math.max(0, si.quantity - returned),
        };
      });

    return {
      id: s._id.toString(),
      _id: s._id.toString(),
      saleNumber: s.saleNumber,
      totalAmount: s.totalAmount,
      status: s.status,
      paymentMethod: s.paymentMethod,
      createdAt: s.createdAt ? s.createdAt.toISOString() : "",
      items,
    };
  });

  const totalRefunds = await Refund.countDocuments();
  const refundAgg = await Refund.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
  const totalRefundedAmount = refundAgg[0]?.total || 0;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Manage Customer Refunds</h1>
          <p className="page-subtitle">Search original sales, verify transaction items, process refunds, and restore resalable inventory</p>
        </div>
      </div>

      {!openTill && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>You must have an open till session to process refunds. <a href="/cashier/till" style={{ fontWeight: 700, textDecoration: "underline" }}>Open Till Session →</a></span>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon red"><RotateCcw size={18} /></div>
          <div className="stat-card-label">Total Refund Transactions</div>
          <div className="stat-card-value">{totalRefunds}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><DollarSign size={18} /></div>
          <div className="stat-card-label">Total Value Refunded</div>
          <div className="stat-card-value" style={{ color: "var(--danger)" }}>
            {formatCFA(totalRefundedAmount)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><CheckCircle2 size={18} /></div>
          <div className="stat-card-label">Original Sale Retention</div>
          <div className="stat-card-value" style={{ fontSize: "1.1rem", color: "var(--success)" }}>Immutable</div>
          <div className="stat-card-sub">Sales are linked, never deleted</div>
        </div>
      </div>

      <RefundForm sales={formattedSales} />
    </>
  );
}
