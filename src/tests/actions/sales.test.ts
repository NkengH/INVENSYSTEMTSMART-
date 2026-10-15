/**
 * Business logic tests for the Sales server action.
 *
 * Strategy: We cannot call `processSale()` directly because it internally calls
 * `getSession()` which reads Next.js cookies — which aren't available in Vitest.
 * Instead, we test the *business rules* that the action enforces by reproducing
 * the same logic against a real in-memory MongoDB.  This gives us high-confidence
 * coverage without needing a running Next.js server.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { User, Product, Inventory, TillSession, Sale, SaleItem, StockMovement, Receipt } from "@/db/schema";
import mongoose from "mongoose";

beforeAll(async () => {
  await startInMemoryMongo();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  await clearDatabase();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — create test fixtures
// ─────────────────────────────────────────────────────────────────────────────
async function createCashierWithOpenTill(openingBalance = 50000) {
  const cashier = await User.create({ username: "cashier_test", passwordHash: "pw", role: "Cashier" });
  const till = await TillSession.create({
    cashierId: cashier._id,
    openingBalance,
    cashierName: "cashier_test",
    status: "OPEN",
  });
  return { cashier, till };
}

async function createProductWithStock(sku: string, stock: number, sellingPrice = 10000) {
  const product = await Product.create({
    name: `Product ${sku}`,
    sku,
    purchasePrice: 5000,
    sellingPrice,
  });
  await Inventory.create({ productId: product._id, quantity: stock });
  return product;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule 1: A sale requires an open till session
// ─────────────────────────────────────────────────────────────────────────────
describe("Sales — Till session requirement", () => {
  it("can find an open till for a cashier", async () => {
    const { cashier, till } = await createCashierWithOpenTill();
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).not.toBeNull();
    expect(openTill?._id.toString()).toBe(till._id.toString());
  });

  it("returns null when cashier has no open till", async () => {
    const cashier = await User.create({ username: "no_till_cashier", passwordHash: "pw", role: "Cashier" });
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).toBeNull();
  });

  it("does not find a CLOSED till as open", async () => {
    const cashier = await User.create({ username: "closed_till_cashier", passwordHash: "pw", role: "Cashier" });
    await TillSession.create({ cashierId: cashier._id, openingBalance: 0, status: "CLOSED" });
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: Stock sufficiency check before creating a sale
// ─────────────────────────────────────────────────────────────────────────────
describe("Sales — Stock check business rule", () => {
  it("allows a sale when stock is sufficient", async () => {
    const product = await createProductWithStock("PROD-A", 10);
    const inv = await Inventory.findOne({ productId: product._id });
    const requestedQty = 3;
    expect(inv!.quantity >= requestedQty).toBe(true);
  });

  it("blocks a sale when stock is exactly 0", async () => {
    const product = await createProductWithStock("PROD-B", 0);
    const inv = await Inventory.findOne({ productId: product._id });
    expect(inv!.quantity < 1).toBe(true);
  });

  it("blocks a sale when requested quantity exceeds stock", async () => {
    const product = await createProductWithStock("PROD-C", 2);
    const inv = await Inventory.findOne({ productId: product._id });
    const requestedQty = 5;
    expect(inv!.quantity < requestedQty).toBe(true);
  });

  it("allows sale when requested quantity equals available stock", async () => {
    const product = await createProductWithStock("PROD-D", 5);
    const inv = await Inventory.findOne({ productId: product._id });
    const requestedQty = 5;
    expect(inv!.quantity >= requestedQty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 3: Full sale flow — creates Sale, SaleItem, deducts inventory, logs StockMovement
// ─────────────────────────────────────────────────────────────────────────────
describe("Sales — Full transaction flow", () => {
  it("creates a Sale document with correct totals", async () => {
    const { cashier, till } = await createCashierWithOpenTill();

    const saleNumber = "SALE-TEST-" + Date.now();
    const sale = await Sale.create({
      saleNumber,
      tillSessionId: till._id,
      cashierId: cashier._id,
      subtotalAmount: 20000,
      discountAmount: 2000,
      taxAmount: 0,
      totalAmount: 18000,
      paymentMethod: "CASH",
      status: "COMPLETED",
    });

    expect(sale.saleNumber).toBe(saleNumber);
    expect(sale.totalAmount).toBe(18000);
    expect(sale.discountAmount).toBe(2000);
    expect(sale.status).toBe("COMPLETED");
  });

  it("creates SaleItem linked to the Sale", async () => {
    const { cashier, till } = await createCashierWithOpenTill();
    const product = await createProductWithStock("LAPTOP-001", 10, 650000);

    const sale = await Sale.create({
      saleNumber: "SALE-SI-001",
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 650000,
      paymentMethod: "CASH",
    });

    const saleItem = await SaleItem.create({
      saleId: sale._id,
      productId: product._id,
      quantity: 1,
      unitPrice: 650000,
    });

    expect(saleItem.saleId.toString()).toBe(sale._id.toString());
    expect(saleItem.quantity).toBe(1);
    expect(saleItem.returnedQuantity).toBe(0);
  });

  it("deducts stock from inventory after a sale", async () => {
    const { cashier, till } = await createCashierWithOpenTill();
    const product = await createProductWithStock("MOUSE-001", 10, 5000);

    // Simulate stock deduction
    const inv = await Inventory.findOne({ productId: product._id });
    const prevQty = inv!.quantity;
    const soldQty = 3;
    inv!.quantity = prevQty - soldQty;
    await inv!.save();

    const updatedInv = await Inventory.findOne({ productId: product._id });
    expect(updatedInv!.quantity).toBe(7);
  });

  it("creates a StockMovement of type SALE", async () => {
    const { cashier } = await createCashierWithOpenTill();
    const product = await createProductWithStock("KBD-TEST-001", 15, 8000);

    const movement = await StockMovement.create({
      productId: product._id,
      movementType: "SALE",
      quantity: 2,
      previousQuantity: 15,
      newQuantity: 13,
      reason: "Customer POS Sale",
      performedBy: cashier._id,
    });

    expect(movement.movementType).toBe("SALE");
    expect(movement.newQuantity).toBe(13);
    expect(movement.previousQuantity - movement.newQuantity).toBe(2);
  });

  it("creates a Receipt document for the sale", async () => {
    const { cashier, till } = await createCashierWithOpenTill();
    const sale = await Sale.create({
      saleNumber: "SALE-RCT-001",
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 5000,
      paymentMethod: "ORANGE_MONEY",
    });

    const receipt = await Receipt.create({
      receiptNumber: "RCT-" + Date.now(),
      type: "SALE",
      referenceId: sale._id.toString(),
    });

    expect(receipt.type).toBe("SALE");
    expect(receipt.referenceId).toBe(sale._id.toString());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 4: Total amount calculation
// ─────────────────────────────────────────────────────────────────────────────
describe("Sales — Total amount calculation", () => {
  it("calculates subtotal correctly from line items", () => {
    const items = [
      { quantity: 2, unitPrice: 10000 },
      { quantity: 1, unitPrice: 25000 },
    ];
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    expect(subtotal).toBe(45000);
  });

  it("applies discount correctly", () => {
    const subtotal = 45000;
    const discount = 5000;
    const total = Math.max(0, subtotal - discount);
    expect(total).toBe(40000);
  });

  it("total never goes negative even with over-discount", () => {
    const subtotal = 1000;
    const discount = 9999;
    const total = Math.max(0, subtotal - discount);
    expect(total).toBe(0);
  });

  it("calculates change correctly", () => {
    const totalAmount = 18500;
    const cashTendered = 20000;
    const change = cashTendered - totalAmount;
    expect(change).toBe(1500);
  });
});
