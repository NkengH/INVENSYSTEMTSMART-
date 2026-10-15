import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from "@/tests/helpers/mongoHelper";
import { User } from "@/db/schema";
import { createUser, resetUserPassword, changePassword } from "@/app/actions/users";
import * as bcrypt from "bcrypt";

let mockSession: { userId: string; role: string; username: string; mustChangePassword?: boolean } | null = {
  userId: "admin-id-1",
  role: "Administrator",
  username: "admin_tester",
  mustChangePassword: false,
};

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
  createSession: vi.fn(),
  connectToDatabase: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(() => Promise.resolve()),
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
  mockSession = {
    userId: "admin-id-1",
    role: "Administrator",
    username: "admin_tester",
    mustChangePassword: false,
  };
});

describe("Temporary Password & First-Login Password Change Flow", () => {
  it("Admin creates a user: account is created with mustChangePassword = true and hashed password", async () => {
    const res = await createUser({
      username: "cashier_john",
      password: "TempPass123!",
      role: "Cashier",
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const createdUser = await User.findById(res.id);
    expect(createdUser).not.toBeNull();
    expect(createdUser!.username).toBe("cashier_john");
    expect(createdUser!.role).toBe("Cashier");
    expect(createdUser!.mustChangePassword).toBe(true);
    expect(createdUser!.passwordChangedAt).toBeNull();

    // Verify password is encrypted, NOT stored in plaintext
    expect(createdUser!.passwordHash).not.toBe("TempPass123!");
    const match = await bcrypt.compare("TempPass123!", createdUser!.passwordHash);
    expect(match).toBe(true);
  });

  it("Admin resets user password: sets mustChangePassword = true and generates secure temporary password", async () => {
    // 1. Create a user who previously changed password
    const user = await User.create({
      username: "manager_sarah",
      passwordHash: await bcrypt.hash("PermanentPass123!", 10),
      role: "Inventory Manager",
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    });

    // 2. Admin resets password
    const resetRes = await resetUserPassword(user._id.toString(), "NewTempPass456!");
    expect(resetRes.success).toBe(true);
    expect(resetRes.temporaryPassword).toBe("NewTempPass456!");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser!.mustChangePassword).toBe(true);
    expect(updatedUser!.passwordChangedAt).toBeNull();

    const match = await bcrypt.compare("NewTempPass456!", updatedUser!.passwordHash);
    expect(match).toBe(true);
  });

  it("User cannot change password with incorrect current password", async () => {
    const user = await User.create({
      username: "cashier_alice",
      passwordHash: await bcrypt.hash("TempPass123!", 10),
      role: "Cashier",
      mustChangePassword: true,
      passwordChangedAt: null,
    });

    // Mock session as this user
    mockSession = {
      userId: user._id.toString(),
      role: "Cashier",
      username: "cashier_alice",
      mustChangePassword: true,
    };

    await expect(
      changePassword({
        currentPassword: "WrongPassword999!",
        newPassword: "PrivatePassword123!",
        confirmPassword: "PrivatePassword123!",
      })
    ).rejects.toThrow("Incorrect current password");
  });

  it("User cannot change password if new passwords do not match", async () => {
    const user = await User.create({
      username: "cashier_bob",
      passwordHash: await bcrypt.hash("TempPass123!", 10),
      role: "Cashier",
      mustChangePassword: true,
      passwordChangedAt: null,
    });

    mockSession = {
      userId: user._id.toString(),
      role: "Cashier",
      username: "cashier_bob",
      mustChangePassword: true,
    };

    await expect(
      changePassword({
        currentPassword: "TempPass123!",
        newPassword: "PrivatePassword123!",
        confirmPassword: "DifferentPassword456!",
      })
    ).rejects.toThrow("New password and confirmation do not match");
  });

  it("User cannot reuse the current temporary password as the new password", async () => {
    const user = await User.create({
      username: "cashier_clara",
      passwordHash: await bcrypt.hash("TempPass123!", 10),
      role: "Cashier",
      mustChangePassword: true,
      passwordChangedAt: null,
    });

    mockSession = {
      userId: user._id.toString(),
      role: "Cashier",
      username: "cashier_clara",
      mustChangePassword: true,
    };

    await expect(
      changePassword({
        currentPassword: "TempPass123!",
        newPassword: "TempPass123!",
        confirmPassword: "TempPass123!",
      })
    ).rejects.toThrow("New password must be different from current temporary password");
  });

  it("User successfully changes password: updates hash, mustChangePassword=false, passwordChangedAt=Date", async () => {
    const user = await User.create({
      username: "cashier_david",
      passwordHash: await bcrypt.hash("TempPass123!", 10),
      role: "Cashier",
      mustChangePassword: true,
      passwordChangedAt: null,
    });

    mockSession = {
      userId: user._id.toString(),
      role: "Cashier",
      username: "cashier_david",
      mustChangePassword: true,
    };

    const res = await changePassword({
      currentPassword: "TempPass123!",
      newPassword: "SuperSecurePrivatePassword789!",
      confirmPassword: "SuperSecurePrivatePassword789!",
    });

    expect(res.success).toBe(true);
    expect(res.role).toBe("Cashier");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser!.mustChangePassword).toBe(false);
    expect(updatedUser!.passwordChangedAt).toBeInstanceOf(Date);

    // Old temporary password no longer works
    const oldMatch = await bcrypt.compare("TempPass123!", updatedUser!.passwordHash);
    expect(oldMatch).toBe(false);

    // New password works
    const newMatch = await bcrypt.compare("SuperSecurePrivatePassword789!", updatedUser!.passwordHash);
    expect(newMatch).toBe(true);
  });
});
