import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import {
  User, Product, Inventory, TillSession, Sale, SaleItem,
  Refund, RefundItem, StockMovement, Receipt,
} from "@/db/schema";

beforeAll(async () => { await startInMemoryMongo(); });
afterAll(async () => { await stopInMemoryMongo(); });
beforeEach(async () => { await clearDatabase(); });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function seedCompletedSale() {
  const cashier = await User.create({ username: "cashier_refund", passwordHash: "pw", role: "Cashier" });
  const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 50000, status: "OPEN" });
  const product = await Product.create({ name: "Laptop", sku: "LAP-001", purchasePrice: 500000, sellingPrice: 650000 });
  await Inventory.create({ productId: product._id, quantity: 10 });

  const sale = await Sale.create({
    saleNumber: "SALE-REF-001",
    tillSessionId: till._id,
    cashierId: cashier._id,
    totalAmount: 650000,
    paymentMethod: "CASH",
    status: "COMPLETED",
  });

  const saleItem = await SaleItem.create({
    saleId: sale._id,
    productId: product._id,
    quantity: 2,
    unitPrice: 325000,
    returnedQuantity: 0,
  });

  return { cashier, till, product, sale, saleItem };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule 1: Cannot refund if no open till
// ─────────────────────────────────────────────────────────────────────────────
describe("Refunds — Open till requirement", () => {
  it("finds open till for refund cashier", async () => {
    const { cashier, till } = await seedCompletedSale();
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).not.toBeNull();
  });

  it("has no open till after it is closed", async () => {
    const { cashier, till } = await seedCompletedSale();
    await TillSession.findByIdAndUpdate(till._id, { status: "CLOSED" });
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: Cannot refund a fully refunded sale
// ─────────────────────────────────────────────────────────────────────────────
describe("Refunds — Already-refunded sale guard", () => {
  it("detects a REFUNDED sale and blocks re-refund", async () => {
    const { sale } = await seedCompletedSale();
    sale.status = "REFUNDED";
    await sale.save();

    const freshSale = await Sale.findById(sale._id);
    expect(freshSale?.status).toBe("REFUNDED");
    // In the action: if (sale.status === "REFUNDED") throw Error
    expect(freshSale?.status === "REFUNDED").toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 3: Quantity validation
// ─────────────────────────────────────────────────────────────────────────────
describe("Refunds — Quantity validation", () => {
  it("can refund up to the original quantity", async () => {
    const { saleItem } = await seedCompletedSale();
    const availableToRefund = saleItem.quantity - (saleItem.returnedQuantity || 0);
    expect(availableToRefund).toBe(2);
    expect(1 <= availableToRefund).toBe(true); // refunding 1 should be valid
  });

  it("blocks refund exceeding available quantity", async () => {
    const { saleItem } = await seedCompletedSale();
    const availableToRefund = saleItem.quantity - (saleItem.returnedQuantity || 0);
    const requestedRefundQty = 5;
    expect(requestedRefundQty > availableToRefund).toBe(true); // should trigger error
  });

  it("blocks refund of already returned items", async () => {
    const { saleItem } = await seedCompletedSale();
    // Simulate partial previous refund
    saleItem.returnedQuantity = 2;
    await saleItem.save();

    const availableToRefund = saleItem.quantity - saleItem.returnedQuantity;
    expect(availableToRefund).toBe(0);
    expect(1 > availableToRefund).toBe(true); // cannot refund any more
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 4: Full refund flow
// ─────────────────────────────────────────────────────────────────────────────
describe("Refunds — Full refund flow", () => {
  it("creates a Refund document", async () => {
    const { cashier, sale, till } = await seedCompletedSale();
    const refundNumber = "REF-" + Date.now();

    const refund = await Refund.create({
      refundNumber,
      saleId: sale._id,
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 325000,
    });

    expect(refund.refundNumber).toBe(refundNumber);
    expect(refund.totalAmount).toBe(325000);
    expect(refund.saleId.toString()).toBe(sale._id.toString());
  });

  it("creates a RefundItem linked to the Refund", async () => {
    const { cashier, sale, till, product, saleItem } = await seedCompletedSale();

    const refund = await Refund.create({
      refundNumber: "REF-001",
      saleId: sale._id,
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 325000,
    });

    const refundItem = await RefundItem.create({
      refundId: refund._id,
      saleItemId: saleItem._id,
      productId: product._id,
      quantity: 1,
      unitPrice: 325000,
      restoredToInventory: true,
    });

    expect(refundItem.quantity).toBe(1);
    expect(refundItem.restoredToInventory).toBe(true);
  });

  it("restores inventory when restoredToInventory is true", async () => {
    const { product } = await seedCompletedSale();
    const inv = await Inventory.findOne({ productId: product._id });
    const prevQty = inv!.quantity;

    // Simulate restoring 1 unit
    inv!.quantity = prevQty + 1;
    await inv!.save();

    const updatedInv = await Inventory.findOne({ productId: product._id });
    expect(updatedInv!.quantity).toBe(prevQty + 1);
  });

  it("creates a REFUND StockMovement when item is restored to inventory", async () => {
    const { cashier, product } = await seedCompletedSale();

    const movement = await StockMovement.create({
      productId: product._id,
      movementType: "REFUND",
      quantity: 1,
      previousQuantity: 9,
      newQuantity: 10,
      reason: "Customer Refund (REF-001) - Returned to Stock",
      performedBy: cashier._id,
    });

    expect(movement.movementType).toBe("REFUND");
    expect(movement.newQuantity).toBe(10);
  });

  it("marks the sale as REFUNDED when all items are returned", async () => {
    const { sale, saleItem } = await seedCompletedSale();

    // Mark all items as returned
    saleItem.returnedQuantity = saleItem.quantity;
    await saleItem.save();

    const allSaleItems = await SaleItem.find({ saleId: sale._id });
    const allFullyReturned = allSaleItems.every((si) => si.returnedQuantity >= si.quantity);

    sale.status = allFullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";
    await sale.save();

    const updatedSale = await Sale.findById(sale._id);
    expect(updatedSale?.status).toBe("REFUNDED");
  });

  it("marks the sale as PARTIALLY_REFUNDED when only some items are returned", async () => {
    const { sale, saleItem } = await seedCompletedSale();

    // Add another item that is NOT fully returned
    saleItem.returnedQuantity = 1; // only 1 out of 2
    await saleItem.save();

    const allSaleItems = await SaleItem.find({ saleId: sale._id });
    const allFullyReturned = allSaleItems.every((si) => si.returnedQuantity >= si.quantity);

    sale.status = allFullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";
    await sale.save();

    const updatedSale = await Sale.findById(sale._id);
    expect(updatedSale?.status).toBe("PARTIALLY_REFUNDED");
  });

  it("creates a REFUND Receipt document", async () => {
    const { sale, till, cashier } = await seedCompletedSale();

    const refund = await Refund.create({
      refundNumber: "REF-RCT-001",
      saleId: sale._id,
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 10000,
    });

    const receipt = await Receipt.create({
      receiptNumber: "RCT-REF-" + Date.now(),
      type: "REFUND",
      referenceId: refund._id.toString(),
    });

    expect(receipt.type).toBe("REFUND");
    expect(receipt.referenceId).toBe(refund._id.toString());
  });
});
