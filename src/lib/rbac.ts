export type Role = "Administrator" | "Inventory Manager" | "Cashier";

// Approved permission matrix — exactly matches specification
const permissionsMatrix: Record<Role, string[]> = {
  Administrator: [
    "users.create",
    "users.view",
    "users.update",
    "users.activate",
    "users.deactivate",
    "users.assign_role",
    "roles.view",
    "roles.create",
    "roles.update",
    "roles.assign_permissions",
    "audit.view",
    "activity.view",
    "ai.inventory_analysis",
    "ai.demand_forecast",
    "ai.reorder_recommendation",
    "ai.low_stock_prediction",
    "ai.slow_moving_analysis",
    "ai.anomaly_detection",
    "ai.sales_analysis",
  ],
  "Inventory Manager": [
    "products.create",
    "products.view",
    "products.update",
    "products.deactivate",
    "inventory.view",
    "inventory.monitor",
    "inventory.receive",
    "inventory.issue",
    "inventory.movement.view",
    "inventory.movement.create",
    "purchases.create",
    "purchases.view",
    "purchases.update",
    "purchases.cancel",
    "reports.view",
    "reports.generate",
    "reports.export",
    "ai.inventory_analysis",
    "ai.demand_forecast",
    "ai.reorder_recommendation",
    "ai.low_stock_prediction",
    "ai.slow_moving_analysis",
    "ai.anomaly_detection",
    "ai.sales_analysis",
  ],
  Cashier: [
    "till.open",
    "till.view",
    "till.reconcile",
    "till.close",
    "sales.create",
    "sales.view",
    "sales.confirm",
    "refunds.create",
    "refunds.view",
    "refunds.process",
    "receipts.create",
    "receipts.view",
    "receipts.print",
    "receipts.reprint",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  if (!role) return false;
  const perms = permissionsMatrix[role as Role] || [];
  return perms.includes(permission);
}

export function getPermissionsForRole(role: string): string[] {
  return permissionsMatrix[role as Role] || [];
}

export function getAllRoles(): Role[] {
  return Object.keys(permissionsMatrix) as Role[];
}
