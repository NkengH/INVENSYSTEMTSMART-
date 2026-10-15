import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import {
  Product,
  Inventory,
  StockMovement,
  TillSession,
  Sale,
  Notification,
  User,
} from "@/db/schema";
import {
  getLiveNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications";

beforeAll(async () => {
  await startInMemoryMongo();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  await clearDatabase();
});

describe("Live Notification System", () => {
  it("generates an Out of Stock alert when active product inventory is 0", async () => {
    const product = await Product.create({
      name: "Wireless Mouse",
      sku: "MOUSE-001",
      purchasePrice: 5000,
      sellingPrice: 8000,
      minimumStock: 5,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 0,
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `out-of-stock-${product._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Out of Stock Alert");
    expect(alert?.type).toBe("warning");
    expect(alert?.message).toContain("Wireless Mouse");
    expect(alert?.message).toContain("completely depleted");
  });

  it("generates a Low Stock alert when active product inventory <= minimumStock", async () => {
    const product = await Product.create({
      name: "Mechanical Keyboard",
      sku: "KEY-001",
      purchasePrice: 20000,
      sellingPrice: 35000,
      minimumStock: 4,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 3,
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `low-stock-${product._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Low Stock Alert");
    expect(alert?.message).toContain("down to 3 pcs");
  });

  it("does NOT generate low stock alert when inventory > minimumStock", async () => {
    const product = await Product.create({
      name: "Gaming Laptop",
      sku: "LAP-001",
      purchasePrice: 400000,
      sellingPrice: 600000,
      minimumStock: 2,
      isActive: true,
    });

    await Inventory.create({
      productId: product._id,
      quantity: 10,
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id.includes(product._id.toString()));
    expect(alert).toBeUndefined();
  });

  it("generates an active till session alert when till is OPEN", async () => {
    const cashier = await User.create({
      username: "cashier1",
      passwordHash: "hash",
      role: "Cashier",
    });

    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 50000,
      status: "OPEN",
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `till-open-${till._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Till Session Active");
    expect(alert?.message).toContain("50,000 CFA");
  });

  it("generates a till variance alert when till closed with discrepancy", async () => {
    const cashier = await User.create({
      username: "cashier2",
      passwordHash: "hash",
      role: "Cashier",
    });

    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 50000,
      expectedBalance: 70000,
      closingBalance: 68000,
      difference: -2000,
      status: "CLOSED",
      closedAt: new Date(),
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `till-disc-${till._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Till Variance Alert");
    expect(alert?.message).toContain("Shortage");
  });

  it("generates stock movement alerts for recent issuances and adjustments", async () => {
    const product = await Product.create({
      name: "USB-C Adapter",
      sku: "USB-001",
      purchasePrice: 3000,
      sellingPrice: 5000,
    });

    const movement = await StockMovement.create({
      productId: product._id,
      movementType: "ISSUE",
      quantity: 5,
      previousQuantity: 20,
      newQuantity: 15,
      reason: "Internal Store Use",
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `movement-${movement._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Stock Issue");
    expect(alert?.message).toContain("5 units of USB-C Adapter");
  });

  it("generates sale alerts for completed POS sales", async () => {
    const cashier = await User.create({
      username: "cashier3",
      passwordHash: "hash",
      role: "Cashier",
    });

    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 10000,
      status: "OPEN",
    });

    const sale = await Sale.create({
      saleNumber: "SALE-TEST-001",
      tillSessionId: till._id,
      cashierId: cashier._id,
      totalAmount: 45000,
      paymentMethod: "CASH",
      status: "COMPLETED",
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === `sale-${sale._id.toString()}`);
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("Sale Processed");
    expect(alert?.message).toContain("SALE-TEST-001");
    expect(alert?.message).toContain("45,000 CFA");
  });

  it("persists and reads custom notifications from Notification collection", async () => {
    const customNotif = await Notification.create({
      type: "info",
      title: "AI Promo Alert",
      message: "Weekend surge predicted for networking gear.",
      read: false,
    });

    const notifs = await getLiveNotifications();
    const alert = notifs.find((n) => n.id === customNotif._id.toString());
    expect(alert).toBeDefined();
    expect(alert?.title).toBe("AI Promo Alert");

    // Test markNotificationRead
    await markNotificationRead(customNotif._id.toString());
    const updated = await Notification.findById(customNotif._id);
    expect(updated?.read).toBe(true);
  });

  it("marks all specified notifications read", async () => {
    const n1 = await Notification.create({
      title: "Alert 1",
      message: "Msg 1",
      read: false,
    });
    const n2 = await Notification.create({
      title: "Alert 2",
      message: "Msg 2",
      read: false,
    });

    await markAllNotificationsRead([n1._id.toString(), n2._id.toString()]);
    const updated1 = await Notification.findById(n1._id);
    const updated2 = await Notification.findById(n2._id);
    expect(updated1?.read).toBe(true);
    expect(updated2?.read).toBe(true);
  });
});
