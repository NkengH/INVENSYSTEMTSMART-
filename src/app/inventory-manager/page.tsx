import { connectToDatabase } from "@/db";
import { Product, Inventory, Purchase } from "@/db/schema";
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvManagerDashboard() {
  await connectToDatabase();
  const totalProducts   = await Product.countDocuments();
  const totalPurchases  = await Purchase.countDocuments();
  const activePurchases = await Purchase.countDocuments({ status: { $in: ["Submitted", "Partially Received"] } });

  const lowStockCount = await Inventory.aggregate([
    { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $match: { $expr: { $lte: ["$quantity", "$product.minimumStock"] } } },
    { $count: "count" },
  ]);
  const lowStock = lowStockCount[0]?.count || 0;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Inventory Manager Dashboard</h1>
          <p className="page-subtitle">Monitor stock levels, products, and purchase orders</p>
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
          <div className="stat-card-icon" style={{ background: lowStock > 0 ? "#fef3c7" : "#d1fae5", color: lowStock > 0 ? "#d97706" : "#059669" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card-label">Low Stock Alerts</div>
          <div className="stat-card-value" style={{ color: lowStock > 0 ? "var(--warning)" : "var(--success)" }}>{lowStock}</div>
          <div className="stat-card-sub">{lowStock > 0 ? "Items need restocking" : "All items well stocked"}</div>
          <div className="stat-card-accent" style={{ background: lowStock > 0 ? "#d97706" : "#059669" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple"><ShoppingCart size={20} /></div>
          <div className="stat-card-label">Purchase Orders</div>
          <div className="stat-card-value">{totalPurchases}</div>
          <div className="stat-card-sub">All time orders</div>
          <div className="stat-card-accent" style={{ background: "#7c3aed" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon amber"><TrendingUp size={20} /></div>
          <div className="stat-card-label">Pending Reception</div>
          <div className="stat-card-value">{activePurchases}</div>
          <div className="stat-card-sub">Awaiting delivery</div>
          <div className="stat-card-accent" style={{ background: "#d97706" }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Quick Actions</div>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/inventory-manager/products"  className="btn btn-primary"><Package size={15} /> Add Product</a>
          <a href="/inventory-manager/reception" className="btn btn-success">Receive Stock</a>
          <a href="/inventory-manager/issuance"  className="btn btn-secondary">Issue Stock</a>
          <a href="/inventory-manager/movements" className="btn btn-secondary">Stock Movements</a>
          <a href="/inventory-manager/purchases" className="btn btn-secondary"><ShoppingCart size={15} /> Purchase Orders</a>
          <a href="/inventory-manager/inventory" className="btn btn-secondary">View Inventory</a>
          <a href="/inventory-manager/reports"   className="btn btn-secondary">Reports</a>
        </div>
      </div>
    </>
  );
}
