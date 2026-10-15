import { connectToDatabase } from "@/db";
import { Product, Inventory, StockMovement } from "@/db/schema";
import { Package, AlertTriangle, Layers, ArrowRightLeft, CreditCard, ShoppingCart, Box } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvManagerDashboard() {
  await connectToDatabase();
  const totalProducts = await Product.countDocuments();

  const inventoryStats = await Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalUnits: { $sum: "$quantity" },
        outOfStock: {
          $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] },
        },
      },
    },
  ]);

  const totalStockUnits = inventoryStats[0]?.totalUnits || 0;
  const outOfStockCount = inventoryStats[0]?.outOfStock || 0;

  const lowStockCount = await Inventory.aggregate([
    { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $match: { $expr: { $lte: ["$quantity", "$product.minimumStock"] } } },
    { $count: "count" },
  ]);
  const lowStock = lowStockCount[0]?.count || 0;

  const recentMovementsCount = await StockMovement.countDocuments();

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Inventory Manager Dashboard</h1>
          <p className="page-subtitle">Monitor warehouse stock levels, products, and inventory operations</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><Package size={20} /></div>
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-value">{totalProducts}</div>
          <div className="stat-card-sub">In product catalog</div>
          <div className="stat-card-accent" style={{ background: "#2563eb" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <Layers size={20} />
          </div>
          <div className="stat-card-label">Total Stock Units</div>
          <div className="stat-card-value" style={{ color: "#7c3aed" }}>{totalStockUnits.toLocaleString()}</div>
          <div className="stat-card-sub">Units available in warehouse</div>
          <div className="stat-card-accent" style={{ background: "#7c3aed" }} />
        </div>

        <a
          href="/inventory-manager/purchases"
          className="stat-card"
          style={{ textDecoration: "none", cursor: "pointer", display: "block" }}
          title="Click to open Purchase Management"
        >
          <div className="stat-card-icon" style={{ background: lowStock > 0 ? "#fef3c7" : "#d1fae5", color: lowStock > 0 ? "#d97706" : "#059669" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card-label">Low Stock (Purchases Needed)</div>
          <div className="stat-card-value" style={{ color: lowStock > 0 ? "var(--warning)" : "var(--success)" }}>{lowStock}</div>
          <div className="stat-card-sub">{lowStock > 0 ? `${lowStock} products need purchase →` : "All items well stocked"}</div>
          <div className="stat-card-accent" style={{ background: lowStock > 0 ? "#d97706" : "#059669" }} />
        </a>

        <div className="stat-card">
          <div className="stat-card-icon teal" style={{ background: "#ccfbf1", color: "#0d9488" }}>
            <ArrowRightLeft size={20} />
          </div>
          <div className="stat-card-label">Stock Movements</div>
          <div className="stat-card-value" style={{ color: "#0d9488" }}>{recentMovementsCount}</div>
          <div className="stat-card-sub">All-time audit ledger events</div>
          <div className="stat-card-accent" style={{ background: "#0d9488" }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Quick Actions</div>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/inventory-manager/purchases" className="btn btn-primary" style={{ background: "#d97706", borderColor: "#b45309" }}><ShoppingCart size={15} /> Purchase Management</a>
          <a href="/inventory-manager/products"  className="btn btn-primary"><Package size={15} /> Add Product</a>
          <a href="/inventory-manager/issuance"  className="btn btn-secondary"><Box size={15} /> Issue Stock</a>
          <a href="/inventory-manager/inventory" className="btn btn-secondary"><Layers size={15} /> View Inventory</a>
          <a href="/inventory-manager/movements" className="btn btn-secondary"><ArrowRightLeft size={15} /> Stock Movements</a>
          <a href="/cashier/sales"               className="btn btn-success"><ShoppingCart size={15} /> POS Sales</a>
          <a href="/cashier/till"                className="btn btn-secondary"><CreditCard size={15} /> Till Session</a>
          <a href="/inventory-manager/reports"   className="btn btn-secondary">Reports</a>
        </div>
      </div>
    </>
  );
}
