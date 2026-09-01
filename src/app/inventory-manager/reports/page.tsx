import { connectToDatabase } from "@/db";
import { Product, Inventory, Purchase, Sale, StockMovement, User } from "@/db/schema";
import { formatCFA } from "@/lib/format";
import { ReportsViewer } from "./ReportsViewer";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await connectToDatabase();

  const [products, inventoryList, purchases, sales, movements, users] = await Promise.all([
    Product.find().lean(),
    Inventory.find().lean(),
    Purchase.find().sort({ createdAt: -1 }).lean(),
    Sale.find().sort({ createdAt: -1 }).lean(),
    StockMovement.find().sort({ createdAt: -1 }).limit(100).lean(),
    User.find().lean(),
  ]);

  // Aggregate metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const grossProfit = totalSalesRevenue - totalPurchaseCost;

  // Format inventory report
  const inventoryReport = products.map((p) => {
    const inv = inventoryList.find((i) => i.productId.toString() === p._id.toString());
    const qty = inv?.quantity || 0;
    const isOut = qty === 0;
    const isLow = qty > 0 && qty <= p.minimumStock;
    return {
      productName: p.name,
      sku: p.sku,
      stock: qty,
      minStock: p.minimumStock,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      inventoryValuation: qty * p.purchasePrice,
      status: isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock",
    };
  });

  // Format purchases report
  const purchasesReport = purchases.map((p) => ({
    purchaseNumber: p.purchaseNumber,
    status: p.status,
    totalAmount: p.totalAmount,
    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "—",
  }));

  // Format sales report
  const salesReport = sales.map((s) => {
    const cashier = users.find((u) => u._id.toString() === s.cashierId?.toString());
    return {
      saleNumber: s.saleNumber,
      cashierName: cashier?.username || "Cashier",
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      status: s.status,
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "—",
    };
  });

  // Format stock movements report
  const movementsReport = movements.map((m) => {
    const prod = products.find((p) => p._id.toString() === m.productId.toString());
    return {
      productName: prod?.name || "Product",
      movementType: m.movementType,
      quantity: m.quantity,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      reason: m.reason || "—",
      date: m.createdAt ? new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
    };
  });

  const reportsData = {
    inventory: inventoryReport,
    purchases: purchasesReport,
    sales: salesReport,
    movements: movementsReport,
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Executive Reports &amp; Analytics</h1>
          <p className="page-subtitle">Generate, filter, and export comprehensive enterprise inventory and financial reports in CFA</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><TrendingUp size={20} /></div>
          <div className="stat-card-label">Total Sales Revenue</div>
          <div className="stat-card-value" style={{ color: "var(--success)", fontSize: "1.5rem" }}>
            {formatCFA(totalSalesRevenue)}
          </div>
          <div className="stat-card-sub">{sales.length} customer sales</div>
          <div className="stat-card-accent" style={{ background: "#059669" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon red"><TrendingDown size={20} /></div>
          <div className="stat-card-label">Total Purchasing Cost</div>
          <div className="stat-card-value" style={{ color: "var(--danger)", fontSize: "1.5rem" }}>
            {formatCFA(totalPurchaseCost)}
          </div>
          <div className="stat-card-sub">{purchases.length} purchase orders</div>
          <div className="stat-card-accent" style={{ background: "#dc2626" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: grossProfit >= 0 ? "#d1fae5" : "#fee2e2", color: grossProfit >= 0 ? "#059669" : "#dc2626" }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-card-label">Gross Margin</div>
          <div className="stat-card-value" style={{ color: grossProfit >= 0 ? "var(--success)" : "var(--danger)", fontSize: "1.5rem" }}>
            {formatCFA(grossProfit)}
          </div>
          <div className="stat-card-sub">{grossProfit >= 0 ? "Profitable Margin" : "Negative Margin"}</div>
          <div className="stat-card-accent" style={{ background: grossProfit >= 0 ? "#059669" : "#dc2626" }} />
        </div>
      </div>

      <ReportsViewer data={reportsData} />
    </>
  );
}
