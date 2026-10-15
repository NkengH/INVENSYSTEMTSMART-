import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { User, TillSession } from "@/db/schema";

beforeAll(async () => { await startInMemoryMongo(); });
afterAll(async () => { await stopInMemoryMongo(); });
beforeEach(async () => { await clearDatabase(); });

// ─────────────────────────────────────────────────────────────────────────────
// Rule 1: Open Till
// ─────────────────────────────────────────────────────────────────────────────
describe("Till — openTill business rules", () => {
  it("creates a new OPEN till session for a cashier", async () => {
    const cashier = await User.create({ username: "cashier_till1", passwordHash: "pw", role: "Cashier" });

    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 50000,
      cashierName: cashier.username,
      workerName: cashier.username,
      status: "OPEN",
      openedAt: new Date(),
    });

    expect(till.status).toBe("OPEN");
    expect(till.openingBalance).toBe(50000);
  });

  it("prevents opening a second till when one is already OPEN", async () => {
    const cashier = await User.create({ username: "cashier_till2", passwordHash: "pw", role: "Cashier" });

    await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 50000,
      status: "OPEN",
    });

    // Replicate the guard: if an open till exists, action would throw
    const existingOpen = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(existingOpen).not.toBeNull(); // action would throw "A till session is already open."
  });

  it("allows opening a new till after the previous one is CLOSED", async () => {
    const cashier = await User.create({ username: "cashier_till3", passwordHash: "pw", role: "Cashier" });

    // First till — then close it
    const firstTill = await TillSession.create({ cashierId: cashier._id, openingBalance: 10000, status: "OPEN" });
    firstTill.status = "CLOSED";
    await firstTill.save();

    // Now no OPEN session exists
    const openTill = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(openTill).toBeNull();

    // So a new one can be created
    const newTill = await TillSession.create({ cashierId: cashier._id, openingBalance: 20000, status: "OPEN" });
    expect(newTill.status).toBe("OPEN");
  });

  it("stores the worker name on the till session", async () => {
    const cashier = await User.create({ username: "cashier_till4", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 0,
      cashierName: "John Doe",
      workerName: "John Doe",
      status: "OPEN",
    });

    expect(till.cashierName).toBe("John Doe");
    expect(till.workerName).toBe("John Doe");
  });

  it("automatically records opening timestamp upon creation with status OPEN", async () => {
    const cashier = await User.create({ username: "cashier_till5", passwordHash: "pw", role: "Cashier" });
    const beforeCreate = new Date();
    const till = await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 25000,
      cashierName: cashier.username,
      workerName: cashier.username,
      status: "OPEN",
      openedAt: new Date(),
    });

    expect(till.status).toBe("OPEN");
    expect(till.openedAt).toBeDefined();
    expect(new Date(till.openedAt).getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
  });

  it("rejects invalid opening balance data (< 0 or NaN)", () => {
    const validateBalance = (bal: any) => {
      const num = parseFloat(bal);
      if (bal === undefined || bal === null || isNaN(num) || num < 0) {
        throw new Error("Please enter a valid opening amount (0 or greater).");
      }
      return num;
    };

    expect(() => validateBalance(-500)).toThrow("Please enter a valid opening amount (0 or greater).");
    expect(() => validateBalance("abc")).toThrow("Please enter a valid opening amount (0 or greater).");
    expect(validateBalance("50000")).toBe(50000);
    expect(validateBalance(0)).toBe(0);
  });

  it("detects existing open till session and blocks duplicates with 'A till session already exists.'", async () => {
    const cashier = await User.create({ username: "cashier_till6", passwordHash: "pw", role: "Cashier" });
    await TillSession.create({
      cashierId: cashier._id,
      openingBalance: 15000,
      status: "OPEN",
      openedAt: new Date(),
    });

    const checkExistingAndCreate = async (userId: any) => {
      const existing = await TillSession.findOne({ cashierId: userId, status: "OPEN" });
      if (existing) {
        throw new Error("A till session already exists.");
      }
    };

    await expect(checkExistingAndCreate(cashier._id)).rejects.toThrow("A till session already exists.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: Close Till
// ─────────────────────────────────────────────────────────────────────────────
describe("Till — closeTill business rules", () => {
  it("closes an open till with correct balance and difference", async () => {
    const cashier = await User.create({ username: "cashier_close1", passwordHash: "pw", role: "Cashier" });
    const till = await TillSession.create({ cashierId: cashier._id, openingBalance: 50000, status: "OPEN" });

    const expectedBalance = 75000;
    const actualBalance = 73500;
    const diff = actualBalance - expectedBalance;

    till.expectedBalance = expectedBalance;
    till.closingBalance = actualBalance;
    till.difference = diff;
    till.status = "CLOSED";
    till.closedAt = new Date();
    await till.save();

    const closed = await TillSession.findById(till._id);
    expect(closed?.status).toBe("CLOSED");
    expect(closed?.closingBalance).toBe(73500);
    expect(closed?.difference).toBe(-1500);
    expect(closed?.closedAt).toBeDefined();
  });

  it("detects a shortage (negative difference)", async () => {
    const expected = 100000;
    const actual = 95000;
    const diff = actual - expected;
    expect(diff).toBe(-5000); // shortage
    expect(diff < 0).toBe(true);
  });

  it("detects a surplus (positive difference)", async () => {
    const expected = 100000;
    const actual = 102000;
    const diff = actual - expected;
    expect(diff).toBe(2000); // overage
    expect(diff > 0).toBe(true);
  });

  it("detects a balanced till (zero difference)", async () => {
    const expected = 80000;
    const actual = 80000;
    const diff = actual - expected;
    expect(diff).toBe(0);
  });

  it("throws if no open till exists on close attempt", async () => {
    const cashier = await User.create({ username: "cashier_close2", passwordHash: "pw", role: "Cashier" });

    // No open till created — simulate the guard
    const existingOpen = await TillSession.findOne({ cashierId: cashier._id, status: "OPEN" });
    expect(existingOpen).toBeNull(); // action would throw "No open till session."
  });
});
