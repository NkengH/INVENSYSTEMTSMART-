import { Fragment } from "react";
import { getAllRoles, getPermissionsForRole, Role } from "@/lib/rbac";
import { ShieldCheck, Lock, CheckCircle2, Minus } from "lucide-react";

export const dynamic = "force-dynamic";

interface FunctionGroup {
  category: string;
  functions: {
    name: string;
    permissionKey: string;
    description: string;
  }[];
}

const functionGroups: FunctionGroup[] = [
  {
    category: "System & User Administration",
    functions: [
      { name: "Manage Users", permissionKey: "users.create", description: "Create, view, update, activate/deactivate accounts" },
      { name: "Manage Roles & Permissions", permissionKey: "roles.view", description: "View role structures and access controls" },
      { name: "View System Activity / Audit", permissionKey: "audit.view", description: "Audit trail, security logs, and transaction monitoring" },
    ],
  },
  {
    category: "Inventory & Purchasing Management",
    functions: [
      { name: "Manage Products", permissionKey: "products.create", description: "Add/update products, categories, pricing, minimum stock" },
      { name: "Manage Inventory", permissionKey: "inventory.monitor", description: "Monitor digital stock levels and thresholds" },
      { name: "Manage Purchases", permissionKey: "purchases.create", description: "Create and track supplier purchase orders" },
      { name: "Generate Reports", permissionKey: "reports.view", description: "Financial, inventory, sales, and movement reports" },
      { name: "AI Inventory Analysis", permissionKey: "ai.inventory_analysis", description: "Demand forecast, reorder recommendations, anomaly detection" },
    ],
  },
  {
    category: "Stock Operations",
    functions: [
      { name: "Issue Stock", permissionKey: "inventory.issue", description: "Authorize and issue stock from warehouse" },
      { name: "Manage Stock Movements", permissionKey: "inventory.movement.view", description: "Traceable digital stock ledger of all events" },
      { name: "View Inventory", permissionKey: "inventory.view", description: "Search products and view available stock" },
    ],
  },
  {
    category: "Cashier & Sales Point",
    functions: [
      { name: "Manage Till Session", permissionKey: "till.open", description: "Open/close till drawer and reconcile cash" },
      { name: "Manage Sales", permissionKey: "sales.create", description: "Process sales, calculate totals, reduce inventory on confirm" },
      { name: "Manage Refunds", permissionKey: "refunds.process", description: "Look up original sale, refund items, restore stock" },
      { name: "Issue Receipts", permissionKey: "receipts.view", description: "Generate, view, and print sales/refund receipts" },
    ],
  },
];

export default function AdminRolesPage() {
  const roles: Role[] = ["Administrator", "Inventory Manager", "Cashier"];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Roles &amp; Permissions Matrix</h1>
          <p className="page-subtitle">
            Hierarchical permission model with cashier activity inheritance for Inventory Managers and Administrators
          </p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><ShieldCheck size={18} /></div>
          <div className="stat-card-label">Active Roles</div>
          <div className="stat-card-value">3</div>
          <div className="stat-card-sub">Strictly isolated</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><Lock size={18} /></div>
          <div className="stat-card-label">Enforcement</div>
          <div className="stat-card-value" style={{ fontSize: "1.1rem", color: "var(--success)" }}>Dual-Layer</div>
          <div className="stat-card-sub">Frontend + Server Actions</div>
        </div>
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-title">System Role &amp; Permission Matrix</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Function / Feature</th>
              <th style={{ textAlign: "center" }}>Administrator</th>
              <th style={{ textAlign: "center" }}>Inventory Manager</th>
              <th style={{ textAlign: "center" }}>Cashier</th>
            </tr>
          </thead>
          <tbody>
            {functionGroups.map((group) => (
              <Fragment key={group.category}>
                <tr key={group.category} style={{ background: "var(--gray-50)" }}>
                  <td colSpan={4} style={{ fontWeight: 700, color: "var(--gray-700)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 16px" }}>
                    {group.category}
                  </td>
                </tr>
                {group.functions.map((fn) => (
                  <tr key={fn.permissionKey}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{fn.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{fn.description}</div>
                    </td>
                    {roles.map((r) => {
                      const rolePerms = getPermissionsForRole(r);
                      const hasPerm = rolePerms.includes(fn.permissionKey);
                      return (
                        <td key={r} style={{ textAlign: "center" }}>
                          {hasPerm ? (
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#d1fae5", color: "#059669" }}>
                              <CheckCircle2 size={16} />
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, color: "var(--gray-300)" }}>
                              <Minus size={16} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
