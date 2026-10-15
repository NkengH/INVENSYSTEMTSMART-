import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { Product, Inventory, StockMovement } from "@/db/schema";
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

describe("Stock Adjustments — Permissions and Logic", () => {
  it("verifies Inventory Manager has clearance to manage and issue inventory", () => {
    expect(hasPermission("Inventory Manager", "inventory.manage")).toBe(true);
    expect(hasPermission("Inventory Manager", "inventory.issue")).toBe(true);
    expect(hasPermission("Inventory Manager", "inventory.read")).toBe(true);
  });

  it("verifies Administrator has clearance to manage and issue inventory", () => {
    expect(hasPermission("Administrator", "inventory.manage")).toBe(true);
    expect(hasPermission("Administrator", "inventory.issue")).toBe(true);
  });

  it("denies Cashier inventory.manage permission", () => {
    expect(hasPermission("Cashier", "inventory.manage")).toBe(false);
  });

  it("successfully adjusts stock (+Add) as Inventory Manager", async () => {
    const { adjustStock } = await import("@/app/actions/adjustments");

    const product = await Product.create({
      name: "DDR5 RAM 32GB",
      sku: "EWTAETERY",
      purchasePrice: 45000,
      sellingPrice: 60000,
    });
    await Inventory.create({ productId: product._id, quantity: 5 });

    const result = await adjustStock({
      productId: product._id.toString(),
      adjustmentType: "ADD",
      quantity: 10,
      reason: "OTHER",
      notes: "approved",
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(15);
    expect(result.previousQuantity).toBe(5);

    const inv = await Inventory.findOne({ productId: product._id });
    expect(inv?.quantity).toBe(15);

    const movements = await StockMovement.find({ productId: product._id });
    expect(movements.length).toBe(1);
    expect(movements[0].movementType).toBe("ADJUSTMENT");
    expect(movements[0].quantity).toBe(10);
    expect(movements[0].previousQuantity).toBe(5);
    expect(movements[0].newQuantity).toBe(15);
  });

  it("successfully adjusts stock (-Deduct) as Inventory Manager", async () => {
    const { adjustStock } = await import("@/app/actions/adjustments");

    const product = await Product.create({
      name: "HDD Hard Drive",
      sku: "HDD-001",
      purchasePrice: 20000,
      sellingPrice: 30000,
    });
    await Inventory.create({ productId: product._id, quantity: 15 });

    const result = await adjustStock({
      productId: product._id.toString(),
      adjustmentType: "DEDUCT",
      quantity: 5,
      reason: "DEFECTIVE_RETURN",
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(10);

    const inv = await Inventory.findOne({ productId: product._id });
    expect(inv?.quantity).toBe(10);
  });

  it("successfully sets exact stock quantity (SET)", async () => {
    const { adjustStock } = await import("@/app/actions/adjustments");

    const product = await Product.create({
      name: "Mouse Pad",
      sku: "PAD-001",
      purchasePrice: 2000,
      sellingPrice: 5000,
    });
    await Inventory.create({ productId: product._id, quantity: 3 });

    const result = await adjustStock({
      productId: product._id.toString(),
      adjustmentType: "SET",
      quantity: 25,
      reason: "AUDIT_DISCREPANCY",
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(25);

    const inv = await Inventory.findOne({ productId: product._id });
    expect(inv?.quantity).toBe(25);
  });

  it("rejects stock adjustment when user is unauthenticated or has no clearance", async () => {
    const { adjustStock } = await import("@/app/actions/adjustments");

    mockSessionUser = {
      userId: "cashier-1",
      role: "Cashier",
      username: "cashier1",
    };

    const product = await Product.create({
      name: "Headphones",
      sku: "HP-001",
      purchasePrice: 15000,
      sellingPrice: 25000,
    });

    await expect(
      adjustStock({
        productId: product._id.toString(),
        adjustmentType: "ADD",
        quantity: 10,
        reason: "OTHER",
      })
    ).rejects.toThrow("Unauthorized: Authorized inventory clearance required");
  });
});
