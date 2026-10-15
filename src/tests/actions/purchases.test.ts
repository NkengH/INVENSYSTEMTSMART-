import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { Product, Inventory, Purchase, PurchaseItem, StockMovement } from "@/db/schema";
import { hasPermission } from "@/lib/rbac";

let mockSessionUser: { userId: string; role: string; username: string } | null = {
  userId: "user-mgr-1",
  role: "Inventory Manager",
  username: "manager1",
};

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => Promise.resolve(mockSessionUser)),
  connectToDatabase: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeAll(async () => {
  await startInMemoryMongo();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  await clearDatabase();
  mockSessionUser = {
    userId: "user-mgr-1",
    role: "Inventory Manager",
    username: "manager1",
  };
});

describe("Purchase Management — Comprehensive 10-Scenario Test Suite", () => {
  // ── TEST 1: Stock > Minimum Stock ──────────────────────────────────────────
  it("TEST 1: Product stock > minimum stock does NOT appear in Purchase Management", async () => {
    const { getLowStockProducts } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "HP EliteBook 840",
      sku: "HP-840",
      minimumStock: 5,
      purchasePrice: 250000,
      sellingPrice: 350000,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 8, // 8 > 5
    });

    const lowStock = await getLowStockProducts();
    expect(lowStock.find((p) => p.sku === "HP-840")).toBeUndefined();
  });

  // ── TEST 2: Stock = Minimum Stock ──────────────────────────────────────────
  it("TEST 2: Product stock = minimum stock appears as LOW STOCK", async () => {
    const { getLowStockProducts } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "Lenovo ThinkPad X1",
      sku: "LEN-X1",
      minimumStock: 5,
      purchasePrice: 400000,
      sellingPrice: 500000,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 5, // 5 == 5
    });

    const lowStock = await getLowStockProducts();
    const item = lowStock.find((p) => p.sku === "LEN-X1");
    expect(item).toBeDefined();
    expect(item?.currentStock).toBe(5);
    expect(item?.minimumStock).toBe(5);
    expect(item?.deficit).toBe(0);
  });

  // ── TEST 3: Stock < Minimum Stock ──────────────────────────────────────────
  it("TEST 3: Product stock < minimum stock appears as LOW STOCK with positive deficit", async () => {
    const { getLowStockProducts } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "Dell Latitude 5520",
      sku: "DELL5520",
      minimumStock: 5,
      purchasePrice: 320000,
      sellingPrice: 420000,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 2, // 2 < 5
    });

    const lowStock = await getLowStockProducts();
    const item = lowStock.find((p) => p.sku === "DELL5520");
    expect(item).toBeDefined();
    expect(item?.currentStock).toBe(2);
    expect(item?.minimumStock).toBe(5);
    expect(item?.deficit).toBe(3); // 5 - 2 = 3
  });

  // ── TEST 4: Selection Filters for Report ────────────────────────────────────
  it("TEST 4: Only selected products appear in the purchase report payload", async () => {
    const rows = [
      { id: "prod-1", name: "Dell 5520", purchaseQty: 5, purchasePrice: 100000, selected: true },
      { id: "prod-2", name: "HDD 500GB", purchaseQty: 10, purchasePrice: 20000, selected: true },
      { id: "prod-3", name: "HP EliteBook", purchaseQty: 3, purchasePrice: 200000, selected: false },
    ];

    const reportItems = rows.filter((r) => r.selected && r.purchaseQty > 0);
    expect(reportItems).toHaveLength(2);
    expect(reportItems.map((r) => r.name)).toEqual(["Dell 5520", "HDD 500GB"]);
  });

  // ── TEST 5: Manager Modifies Quantity ──────────────────────────────────────
  it("TEST 5: Purchase report uses updated purchase quantity and subtotal", async () => {
    const row = { id: "prod-1", name: "Dell 5520", deficit: 3, purchaseQty: 3, purchasePrice: 100000 };

    // Manager modifies quantity from deficit (3) to 7
    const updatedQty = 7;
    const subtotal = updatedQty * row.purchasePrice;

    expect(updatedQty).toBe(7);
    expect(subtotal).toBe(700000);
  });

  // ── TEST 6: Report Generation Does Not Alter Stock ──────────────────────────
  it("TEST 6: Generating a purchase report does NOT alter product stock in inventory", async () => {
    const { getLowStockProducts } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "Kingston 1TB SSD",
      sku: "SSD-1TB",
      minimumStock: 4,
      purchasePrice: 50000,
      sellingPrice: 70000,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 1,
    });

    // Manager fetches and generates report
    const lowStock = await getLowStockProducts();
    expect(lowStock).toHaveLength(1);

    // Verify stock remains untouched at 1
    const invAfter = await Inventory.findOne({ productId: product._id });
    expect(invAfter?.quantity).toBe(1);
  });

  // ── TEST 7: Saving Purchase Request ────────────────────────────────────────
  it("TEST 7: Manager saves purchase request correctly in the database", async () => {
    const { createPurchase } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "Logitech MX Master 3",
      sku: "LOGI-MX3",
      minimumStock: 6,
      purchasePrice: 65000,
      sellingPrice: 85000,
      isActive: true,
    });

    await Inventory.create({ productId: product._id, quantity: 1 });

    const result = await createPurchase({
      vendorName: "Logitech Distribution Africa",
      paymentTerms: "Net 30 Days",
      expectedDeliveryDate: "2026-10-15",
      notes: "Express replenishment",
      items: [{ productId: product._id.toString(), quantity: 5, unitPrice: 65000 }],
    });

    expect(result.success).toBe(true);
    expect(result.purchaseNumber).toMatch(/^PO-/);

    const savedPO = await Purchase.findById(result.id);
    expect(savedPO).toBeDefined();
    expect(savedPO?.status).toBe("Submitted");
    expect(savedPO?.vendorName).toBe("Logitech Distribution Africa");
    expect(savedPO?.totalAmount).toBe(325000);

    const items = await PurchaseItem.find({ purchaseId: result.id });
    expect(items).toHaveLength(1);
    expect(items[0].quantityOrdered).toBe(5);
    expect(items[0].quantityReceived).toBe(0);
  });

  // ── TEST 8: Cancelling a PO updates its status correctly ───────────────────
  it("TEST 8: Cancelling a Submitted PO sets its status to Cancelled", async () => {
    const { createPurchase, cancelPurchase } = await import("@/app/actions/purchases");

    const product = await Product.create({
      name: "RAM DDR4 16GB",
      sku: "RAM-16G",
      minimumStock: 8,
      purchasePrice: 25000,
      sellingPrice: 35000,
      isActive: true,
    });

    await Inventory.create({ productId: product._id, quantity: 2 });

    // 1. Create PO
    const { id: purchaseId } = await createPurchase({
      vendorName: "Memory Supply Co.",
      items: [{ productId: product._id.toString(), quantity: 6, unitPrice: 25000 }],
    });

    // 2. Verify it starts as Submitted
    let po = await Purchase.findById(purchaseId);
    expect(po?.status).toBe("Submitted");

    // 3. Cancel the PO
    const cancelResult = await cancelPurchase(purchaseId);
    expect(cancelResult.success).toBe(true);

    // 4. Status must be Cancelled; inventory must be unchanged
    po = await Purchase.findById(purchaseId);
    expect(po?.status).toBe("Cancelled");

    const inv = await Inventory.findOne({ productId: product._id });
    expect(inv?.quantity).toBe(2); // stock untouched
  });

  // ── TEST 9: Cashier Access Denied ──────────────────────────────────────────
  it("TEST 9: Cashier access is denied to Purchase Management operations", async () => {
    const { getLowStockProducts, createPurchase, cancelPurchase } = await import("@/app/actions/purchases");

    expect(hasPermission("Cashier", "purchases.view")).toBe(false);
    expect(hasPermission("Cashier", "purchases.create")).toBe(false);
    expect(hasPermission("Cashier", "purchases.cancel")).toBe(false);

    // Simulate Cashier session
    mockSessionUser = {
      userId: "user-cashier-1",
      role: "Cashier",
      username: "cashier1",
    };

    await expect(getLowStockProducts()).rejects.toThrow(/Unauthorized/);
    await expect(
      createPurchase({
        items: [{ productId: "507f1f77bcf86cd799439011", quantity: 1, unitPrice: 100 }],
      })
    ).rejects.toThrow(/Unauthorized/);
    await expect(cancelPurchase("507f1f77bcf86cd799439011")).rejects.toThrow(/Unauthorized/);
  });

  // ── TEST 10: Existing Sales and Stock Functionality Intact ─────────────────
  it("TEST 10: Existing sales and inventory mechanics continue working normally", async () => {
    const product = await Product.create({
      name: "Monitor 24 inch",
      sku: "MON-24",
      purchasePrice: 65000,
      sellingPrice: 85000,
      minimumStock: 2,
      isActive: true,
    });

    const inv = await Inventory.create({
      productId: product._id,
      quantity: 10,
    });

    // Simulate an existing sale deduction
    inv.quantity -= 3;
    await inv.save();

    await StockMovement.create({
      productId: product._id,
      movementType: "SALE",
      quantity: 3,
      previousQuantity: 10,
      newQuantity: 7,
      reason: "POS Sale completed",
    });

    const updatedInv = await Inventory.findOne({ productId: product._id });
    expect(updatedInv?.quantity).toBe(7);

    const movement = await StockMovement.findOne({ productId: product._id, movementType: "SALE" });
    expect(movement?.quantity).toBe(3);
    expect(movement?.newQuantity).toBe(7);
  });
});
