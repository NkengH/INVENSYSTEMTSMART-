import { connectToDatabase } from "@/db";
import { Product, Inventory, Sale, StockMovement, User } from "@/db/schema";
import { formatCFA } from "@/lib/format";
import { ReportsViewer } from "./ReportsViewer";
import { TrendingUp, Package, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await connectToDatabase();

  const [products, inventoryList, sales, movements, users] = await Promise.all([
    Product.find().lean(),
    Inventory.find().lean(),
    Sale.find().sort({ createdAt: -1 }).lean(),
    StockMovement.find().sort({ createdAt: -1 }).limit(100).lean(),
    User.find().lean(),
  ]);

  // Aggregate metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

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

  const totalInventoryValuation = inventoryReport.reduce((sum, i) => sum + i.inventoryValuation, 0);

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
          <div className="stat-card-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Package size={20} /></div>
          <div className="stat-card-label">Warehouse Asset Valuation</div>
          <div className="stat-card-value" style={{ color: "var(--brand-600)", fontSize: "1.5rem" }}>
            {formatCFA(totalInventoryValuation)}
          </div>
          <div className="stat-card-sub">{products.length} product lines</div>
          <div className="stat-card-accent" style={{ background: "#7c3aed" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><BarChart3 size={20} /></div>
          <div className="stat-card-label">Stock Movements Logged</div>
          <div className="stat-card-value" style={{ color: "#2563eb", fontSize: "1.5rem" }}>
            {movements.length}
          </div>
          <div className="stat-card-sub">Last 100 movements</div>
          <div className="stat-card-accent" style={{ background: "#2563eb" }} />
        </div>
      </div>

      <ReportsViewer data={reportsData} />
    </>
  );
}
