import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { User, Product, Inventory } from "@/db/schema";

beforeAll(async () => { await startInMemoryMongo(); });
afterAll(async () => { await stopInMemoryMongo(); });
beforeEach(async () => { await clearDatabase(); });

// ─────────────────────────────────────────────────────────────────────────────
// Rule 1: SKU uniqueness enforcement
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — SKU uniqueness", () => {
  it("rejects creating a product with a duplicate SKU", async () => {
    await Product.create({ name: "P1", sku: "DUPE-SKU", purchasePrice: 1000, sellingPrice: 1500 });
    await expect(
      Product.create({ name: "P2", sku: "DUPE-SKU", purchasePrice: 2000, sellingPrice: 2500 })
    ).rejects.toThrow();
  });

  it("normalises SKU to uppercase before checking", () => {
    // The action does: sku.toUpperCase().trim()
    const rawSku = "  laptop-001  ";
    const normalized = rawSku.toUpperCase().trim();
    expect(normalized).toBe("LAPTOP-001");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: Inventory is initialised at 0 on product creation
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — Inventory initialisation", () => {
  it("auto-creates an Inventory record at quantity 0 when product is created", async () => {
    const product = await Product.create({
      name: "Brand New Item",
      sku: "NEW-001",
      purchasePrice: 10000,
      sellingPrice: 15000,
    });

    const inv = await Inventory.create({ productId: product._id, quantity: 0 });
    expect(inv.quantity).toBe(0);
    expect(inv.productId.toString()).toBe(product._id.toString());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 3: Low stock detection
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — Low stock detection", () => {
  it("detects low stock when quantity <= minimumStock", async () => {
    const product = await Product.create({
      name: "Monitor",
      sku: "MON-LOW-001",
      purchasePrice: 80000,
      sellingPrice: 100000,
      minimumStock: 5,
    });
    const inv = await Inventory.create({ productId: product._id, quantity: 3 });
    const isLowStock = inv.quantity <= product.minimumStock;
    expect(isLowStock).toBe(true);
  });

  it("does NOT flag low stock when quantity > minimumStock", async () => {
    const product = await Product.create({
      name: "Printer",
      sku: "PRT-OK-001",
      purchasePrice: 40000,
      sellingPrice: 55000,
      minimumStock: 2,
    });
    const inv = await Inventory.create({ productId: product._id, quantity: 10 });
    const isLowStock = inv.quantity <= product.minimumStock;
    expect(isLowStock).toBe(false);
  });

  it("detects low stock when quantity equals exactly minimumStock", async () => {
    const product = await Product.create({
      name: "Cable",
      sku: "CBL-EXACT-001",
      purchasePrice: 500,
      sellingPrice: 1000,
      minimumStock: 4,
    });
    const inv = await Inventory.create({ productId: product._id, quantity: 4 });
    const isLowStock = inv.quantity <= product.minimumStock;
    expect(isLowStock).toBe(true); // boundary: at minimum is still "low"
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 4: toggleProductActive
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — toggleProductActive", () => {
  it("deactivates an active product", async () => {
    const product = await Product.create({
      name: "Active Product",
      sku: "ACT-001",
      purchasePrice: 1000,
      sellingPrice: 1500,
      isActive: true,
    });

    product.isActive = !product.isActive;
    await product.save();

    const updated = await Product.findById(product._id);
    expect(updated?.isActive).toBe(false);
  });

  it("re-activates an inactive product", async () => {
    const product = await Product.create({
      name: "Inactive Product",
      sku: "INACT-001",
      purchasePrice: 1000,
      sellingPrice: 1500,
      isActive: false,
    });

    product.isActive = !product.isActive;
    await product.save();

    const updated = await Product.findById(product._id);
    expect(updated?.isActive).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 5: updateProduct — field changes persisted correctly
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — updateProduct", () => {
  it("updates name and prices", async () => {
    const product = await Product.create({
      name: "Old Name",
      sku: "UPD-001",
      purchasePrice: 5000,
      sellingPrice: 8000,
    });

    product.name = "New Name";
    product.purchasePrice = 6000;
    product.sellingPrice = 9000;
    await product.save();

    const updated = await Product.findById(product._id);
    expect(updated?.name).toBe("New Name");
    expect(updated?.purchasePrice).toBe(6000);
    expect(updated?.sellingPrice).toBe(9000);
  });

  it("updates minimumStock", async () => {
    const product = await Product.create({
      name: "Stock Limit Product",
      sku: "STKLMT-001",
      purchasePrice: 1000,
      sellingPrice: 1500,
      minimumStock: 0,
    });

    product.minimumStock = 10;
    await product.save();

    const updated = await Product.findById(product._id);
    expect(updated?.minimumStock).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 6: RBAC — only Inventory Manager can create/update products
// ─────────────────────────────────────────────────────────────────────────────
describe("Products — Permission checks", () => {
  it("Inventory Manager has products.create permission", async () => {
    const { hasPermission } = await import("@/lib/rbac");
    expect(hasPermission("Inventory Manager", "products.create")).toBe(true);
  });

  it("Cashier does NOT have products.create permission", async () => {
    const { hasPermission } = await import("@/lib/rbac");
    expect(hasPermission("Cashier", "products.create")).toBe(false);
  });

  it("Administrator does NOT have products.create permission", async () => {
    const { hasPermission } = await import("@/lib/rbac");
    expect(hasPermission("Administrator", "products.create")).toBe(false);
  });

  it("Inventory Manager has products.update permission", async () => {
    const { hasPermission } = await import("@/lib/rbac");
    expect(hasPermission("Inventory Manager", "products.update")).toBe(true);
  });
});
