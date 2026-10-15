import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { User, Product, Category, Inventory, TillSession, Sale, StockMovement } from "@/db/schema";

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  await startInMemoryMongo();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  await clearDatabase();
});

// ─── User Schema ──────────────────────────────────────────────────────────────
describe("User Schema", () => {
  it("creates a valid user with required fields", async () => {
    const user = await User.create({
      username: "admin_user",
      passwordHash: "hashed_pw",
      role: "Administrator",
    });
    expect(user.username).toBe("admin_user");
    expect(user.role).toBe("Administrator");
    expect(user.isActive).toBe(true); // default
  });

  it("rejects a user with an invalid role", async () => {
    await expect(
      User.create({ username: "bad_user", passwordHash: "pw", role: "SuperHero" })
    ).rejects.toThrow();
  });

  it("rejects a user without a username", async () => {
    await expect(
      User.create({ passwordHash: "pw", role: "Cashier" })
    ).rejects.toThrow();
  });

  it("rejects duplicate usernames", async () => {
    await User.create({ username: "duplicate", passwordHash: "pw", role: "Cashier" });
    await expect(
      User.create({ username: "duplicate", passwordHash: "pw2", role: "Cashier" })
    ).rejects.toThrow();
  });

  it("accepts all three valid roles", async () => {
    const roles = ["Administrator", "Inventory Manager", "Cashier"] as const;
    for (const [i, role] of roles.entries()) {
      const user = await User.create({
        username: `user_${i}`,
        passwordHash: "pw",
        role,
      });
      expect(user.role).toBe(role);
    }
  });

  it("defaults isActive to true", async () => {
    const user = await User.create({ username: "activetest", passwordHash: "pw", role: "Cashier" });
    expect(user.isActive).toBe(true);
  });

  it("defaults mustChangePassword to false and passwordChangedAt to null", async () => {
    const user = await User.create({ username: "default_pw_test", passwordHash: "pw", role: "Cashier" });
    expect(user.mustChangePassword).toBe(false);
    expect(user.passwordChangedAt).toBeNull();
  });
});

// ─── Product Schema ───────────────────────────────────────────────────────────
describe("Product Schema", () => {
  it("creates a valid product", async () => {
    const p = await Product.create({
      name: "Laptop Dell XPS",
      sku: "LAPTOP-XPS-001",
      purchasePrice: 500000,
      sellingPrice: 650000,
    });
    expect(p.sku).toBe("LAPTOP-XPS-001");
    expect(p.isActive).toBe(true);
    expect(p.minimumStock).toBe(0);
    expect(p.unit).toBe("pcs");
  });

  it("rejects a product without SKU", async () => {
    await expect(
      Product.create({ name: "Unnamed", purchasePrice: 100, sellingPrice: 150 })
    ).rejects.toThrow();
  });

  it("rejects duplicate SKUs", async () => {
    await Product.create({ name: "P1", sku: "SKU-001", purchasePrice: 100, sellingPrice: 150 });
    await expect(
      Product.create({ name: "P2", sku: "SKU-001", purchasePrice: 200, sellingPrice: 250 })
    ).rejects.toThrow();
  });

  it("rejects a product without purchasePrice", async () => {
    await expect(
      Product.create({ name: "NoPP", sku: "SKU-002", sellingPrice: 150 })
    ).rejects.toThrow();
  });

  it("rejects a product without sellingPrice", async () => {
    await expect(
      Product.create({ name: "NoSP", sku: "SKU-003", purchasePrice: 100 })
    ).rejects.toThrow();
  });

  it("stores minimumStock correctly", async () => {
    const p = await Product.create({
      name: "Monitor",
      sku: "MON-001",
      purchasePrice: 80000,
      sellingPrice: 100000,
      minimumStock: 5,
    });
    expect(p.minimumStock).toBe(5);
  });
});

// ─── Inventory Schema ─────────────────────────────────────────────────────────
describe("Inventory Schema", () => {
  it("creates an inventory record with default quantity 0", async () => {
    const product = await Product.create({
      name: "Printer HP",
      sku: "PRT-HP-001",
      purchasePrice: 40000,
      sellingPrice: 55000,
    });
    const inv = await Inventory.create({ productId: product._id });
    expect(inv.quantity).toBe(0);
  });

  it("stores a positive quantity", async () => {
    const product = await Product.create({
      name: "Mouse",
      sku: "MSE-001",
      purchasePrice: 3000,
      sellingPrice: 5000,
    });
    const inv = await Inventory.create({ productId: product._id, quantity: 20 });
    expect(inv.quantity).toBe(20);
  });

  it("rejects duplicate inventory for the same product", async () => {
    const product = await Product.create({
      name: "Keyboard",
      sku: "KBD-001",
      purchasePrice: 5000,
      sellingPrice: 8000,
    });
    await Inventory.create({ productId: product._id, quantity: 10 });
    await expect(
      Inventory.create({ productId: product._id, quantity: 5 })
    ).rejects.toThrow();
  });
});

// ─── TillSession Schema ───────────────────────────────────────────────────────
describe("TillSession Schema", () => {
  it("creates an OPEN till session with default status", async () => {
    const cashier = await User.create({ username: "cashier1", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 50000,
      cashierName: "cashier1",
    });
    expect(till.status).toBe("OPEN");
    expect(till.openingBalance).toBe(50000);
  });

  it("rejects till session without cashierId", async () => {
    await expect(
      TillSession.create({ openingBalance: 10000 })
    ).rejects.toThrow();
  });

  it("rejects an invalid status", async () => {
    const cashier = await User.create({ username: "cashier2", passwordHash: "pw", role: "Cashier" });
    await expect(
      TillSession.create({ cashierId: cashier._id, openingBalance: 0, status: "INVALID" })
    ).rejects.toThrow();
  });
});

// ─── Sale Schema ──────────────────────────────────────────────────────────────
describe("Sale Schema", () => {
  it("creates a valid COMPLETED cash sale", async () => {
    const cashier = await User.create({ username: "cashier3", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 50000 });

    const sale = await Sale.create({
      saleNumber: "SALE-001",
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 25000,
      paymentMethod: "CASH",
      status: "COMPLETED",
    });

    expect(sale.saleNumber).toBe("SALE-001");
    expect(sale.status).toBe("COMPLETED");
    expect(sale.paymentMethod).toBe("CASH");
  });

  it("rejects a sale with an invalid payment method", async () => {
    const cashier = await User.create({ username: "cashier4", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 0 });

    await expect(
      Sale.create({
        saleNumber: "SALE-002",
        tillSessionId: till._id,
        cashierId: cashier._id,
        totalAmount: 5000,
        paymentMethod: "BITCOIN",
        status: "COMPLETED",
      })
    ).rejects.toThrow();
  });

  it("rejects a sale with invalid status", async () => {
    const cashier = await User.create({ username: "cashier5", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 0 });

    await expect(
      Sale.create({
        saleNumber: "SALE-003",
        tillSessionId: till._id,
        cashierId: cashier._id,
        totalAmount: 5000,
        paymentMethod: "CASH",
        status: "PENDING",
      })
    ).rejects.toThrow();
  });

  it("accepts MTN_MOMO as a payment method", async () => {
    const cashier = await User.create({ username: "cashier6", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 0 });

    const sale = await Sale.create({
      saleNumber: "SALE-004",
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 12000,
      paymentMethod: "MTN_MOMO",
    });
    expect(sale.paymentMethod).toBe("MTN_MOMO");
  });
});

// ─── StockMovement Schema ─────────────────────────────────────────────────────
describe("StockMovement Schema", () => {
  it("creates a SALE movement with correct quantities", async () => {
    const cashier = await User.create({ username: "cashier7", passwordHash: "pw", role: "Cashier" });
    const product = await Product.create({
      name: "USB Hub",
      sku: "USB-HUB-001",
      purchasePrice: 3000,
      sellingPrice: 5000,
    });

    const movement = await StockMovement.create({
      productId: product._id,
      movementType: "SALE",
      quantity: 2,
      previousQuantity: 10,
      newQuantity: 8,
      performedBy: cashier._id,
    });

    expect(movement.movementType).toBe("SALE");
    expect(movement.previousQuantity).toBe(10);
    expect(movement.newQuantity).toBe(8);
  });

  it("rejects an invalid movementType", async () => {
    const cashier = await User.create({ username: "cashier8", passwordHash: "pw", role: "Cashier" });
    const product = await Product.create({
      name: "Cable",
      sku: "CABLE-001",
      purchasePrice: 500,
      sellingPrice: 1000,
    });

    await expect(
      StockMovement.create({
        productId: product._id,
        movementType: "STOLEN",
        quantity: 1,
        previousQuantity: 5,
        newQuantity: 4,
        performedBy: cashier._id,
      })
    ).rejects.toThrow();
  });

  it("accepts all valid movement types", async () => {
    const cashier = await User.create({ username: "cashier9", passwordHash: "pw", role: "Cashier" });
    const product = await Product.create({
      name: "Power Strip",
      sku: "PWR-001",
      purchasePrice: 4000,
      sellingPrice: 6000,
    });

    const types = ["RECEIPT", "ISSUE", "SALE", "REFUND", "TRANSFER", "ADJUSTMENT"] as const;
    for (const movementType of types) {
      const m = await StockMovement.create({
        productId: product._id,
        movementType,
        quantity: 1,
        previousQuantity: 10,
        newQuantity: 9,
        performedBy: cashier._id,
      });
      expect(m.movementType).toBe(movementType);
    }
  });
});
