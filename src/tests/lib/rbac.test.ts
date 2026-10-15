import { describe, it, expect } from "vitest";
import { hasPermission, getPermissionsForRole, getAllRoles } from "@/lib/rbac";

// ─── hasPermission() ──────────────────────────────────────────────────────────
describe("hasPermission()", () => {
  // Administrator
  it("grants Administrator audit.view", () => {
    expect(hasPermission("Administrator", "audit.view")).toBe(true);
  });

  it("grants Administrator users.create", () => {
    expect(hasPermission("Administrator", "users.create")).toBe(true);
  });

  it("grants Administrator sales.create (inherited from Cashier)", () => {
    expect(hasPermission("Administrator", "sales.create")).toBe(true);
  });

  it("grants Administrator till.open (inherited from Cashier)", () => {
    expect(hasPermission("Administrator", "till.open")).toBe(true);
  });

  it("denies Administrator products.create (inventory-only permission)", () => {
    expect(hasPermission("Administrator", "products.create")).toBe(false);
  });

  // Inventory Manager
  it("grants Inventory Manager products.create", () => {
    expect(hasPermission("Inventory Manager", "products.create")).toBe(true);
  });

  it("grants Inventory Manager ai.demand_forecast", () => {
    expect(hasPermission("Inventory Manager", "ai.demand_forecast")).toBe(true);
  });

  it("denies Inventory Manager users.create (admin-only)", () => {
    expect(hasPermission("Inventory Manager", "users.create")).toBe(false);
  });

  it("grants Inventory Manager till.open (inherited from Cashier)", () => {
    expect(hasPermission("Inventory Manager", "till.open")).toBe(true);
  });

  it("grants Inventory Manager sales.create (inherited from Cashier)", () => {
    expect(hasPermission("Inventory Manager", "sales.create")).toBe(true);
  });

  it("grants Inventory Manager refunds.process (inherited from Cashier)", () => {
    expect(hasPermission("Inventory Manager", "refunds.process")).toBe(true);
  });

  it("grants Inventory Manager inventory.manage and inventory.issue", () => {
    expect(hasPermission("Inventory Manager", "inventory.manage")).toBe(true);
    expect(hasPermission("Inventory Manager", "inventory.issue")).toBe(true);
    expect(hasPermission("Inventory Manager", "inventory.receive")).toBe(true);
  });

  it("grants Administrator inventory.manage and inventory.issue", () => {
    expect(hasPermission("Administrator", "inventory.manage")).toBe(true);
    expect(hasPermission("Administrator", "inventory.issue")).toBe(true);
  });

  // Cashier
  it("grants Cashier sales.create", () => {
    expect(hasPermission("Cashier", "sales.create")).toBe(true);
  });

  it("grants Cashier till.open", () => {
    expect(hasPermission("Cashier", "till.open")).toBe(true);
  });

  it("grants Cashier refunds.process", () => {
    expect(hasPermission("Cashier", "refunds.process")).toBe(true);
  });

  it("denies Cashier products.create (inventory-only)", () => {
    expect(hasPermission("Cashier", "products.create")).toBe(false);
  });

  it("denies Cashier audit.view (admin-only)", () => {
    expect(hasPermission("Cashier", "audit.view")).toBe(false);
  });

  // Edge cases
  it("returns false for an empty role string", () => {
    expect(hasPermission("", "sales.create")).toBe(false);
  });

  it("returns false for an unknown role", () => {
    expect(hasPermission("SuperUser", "sales.create")).toBe(false);
  });

  it("returns false for an unknown permission on a valid role", () => {
    expect(hasPermission("Cashier", "nonexistent.permission")).toBe(false);
  });
});

// ─── getPermissionsForRole() ──────────────────────────────────────────────────
describe("getPermissionsForRole()", () => {
  it("returns a non-empty array for Administrator", () => {
    const perms = getPermissionsForRole("Administrator");
    expect(perms.length).toBeGreaterThan(0);
  });

  it("returns a non-empty array for Inventory Manager", () => {
    const perms = getPermissionsForRole("Inventory Manager");
    expect(perms.length).toBeGreaterThan(0);
  });

  it("returns a non-empty array for Cashier", () => {
    const perms = getPermissionsForRole("Cashier");
    expect(perms.length).toBeGreaterThan(0);
  });

  it("returns an empty array for an unknown role", () => {
    expect(getPermissionsForRole("Ghost")).toEqual([]);
  });

  it("Administrator permissions include all AI permissions", () => {
    const perms = getPermissionsForRole("Administrator");
    expect(perms).toContain("ai.inventory_analysis");
    expect(perms).toContain("ai.demand_forecast");
    expect(perms).toContain("ai.anomaly_detection");
  });

  it("Inventory Manager permissions include all AI permissions", () => {
    const perms = getPermissionsForRole("Inventory Manager");
    expect(perms).toContain("ai.inventory_analysis");
    expect(perms).toContain("ai.low_stock_prediction");
  });

  it("Cashier permissions include receipt actions", () => {
    const perms = getPermissionsForRole("Cashier");
    expect(perms).toContain("receipts.print");
    expect(perms).toContain("receipts.reprint");
  });
});

// ─── getAllRoles() ────────────────────────────────────────────────────────────
describe("getAllRoles()", () => {
  it("returns exactly 3 roles", () => {
    expect(getAllRoles()).toHaveLength(3);
  });

  it("includes Administrator", () => {
    expect(getAllRoles()).toContain("Administrator");
  });

  it("includes Inventory Manager", () => {
    expect(getAllRoles()).toContain("Inventory Manager");
  });

  it("includes Cashier", () => {
    expect(getAllRoles()).toContain("Cashier");
  });
});
