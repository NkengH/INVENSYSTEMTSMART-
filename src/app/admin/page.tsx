import { connectToDatabase } from "@/db";
import { User, Product, Sale, AuditLog } from "@/db/schema";
import { Users, Package, ShoppingCart, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectToDatabase();
  const [totalUsers, totalProducts, totalSales, totalAuditLogs] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Sale.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Administrator Dashboard</h1>
          <p className="page-subtitle">System overview and platform health</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><Users size={20} /></div>
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{totalUsers}</div>
          <div className="stat-card-sub">Registered accounts</div>
          <div className="stat-card-accent" style={{ background: "#2563eb" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple"><Package size={20} /></div>
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-value">{totalProducts}</div>
          <div className="stat-card-sub">In product catalog</div>
          <div className="stat-card-accent" style={{ background: "#7c3aed" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green"><ShoppingCart size={20} /></div>
          <div className="stat-card-label">Completed Sales</div>
          <div className="stat-card-value">{totalSales}</div>
          <div className="stat-card-sub">All time transactions</div>
          <div className="stat-card-accent" style={{ background: "#059669" }} />
        </div>

        <div className="stat-card">
          <div className="stat-card-icon amber"><Activity size={20} /></div>
          <div className="stat-card-label">Audit Events</div>
          <div className="stat-card-value">{totalAuditLogs}</div>
          <div className="stat-card-sub">Logged system events</div>
          <div className="stat-card-accent" style={{ background: "#d97706" }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Quick Actions</div>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/admin/users" className="btn btn-primary">
            <Users size={15} /> Manage Users
          </a>
          <a href="/admin/audit" className="btn btn-secondary">
            <Activity size={15} /> View Audit Logs
          </a>
          <a href="/admin/roles" className="btn btn-secondary">
            Roles &amp; Permissions
          </a>
        </div>
      </div>
    </>
  );
}
