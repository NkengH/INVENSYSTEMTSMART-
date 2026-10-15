"use server";

import { connectToDatabase } from "@/db";
import { User } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession, createSession } from "@/lib/auth";
import { hasPermission, Role } from "@/lib/rbac";
import * as bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function createUser(data: { username: string; password: string; role: Role }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "users.create")) {
    throw new Error("Unauthorized: Administrator access required");
  }

  const username = data.username.toLowerCase().trim();
  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters long");
  }

  if (!data.password || data.password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const validRoles: Role[] = ["Administrator", "Inventory Manager", "Cashier"];
  if (!validRoles.includes(data.role)) {
    throw new Error("Invalid role selected");
  }

  const existing = await User.findOne({ username });
  if (existing) {
    throw new Error("A user with this username already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const newUser = await User.create({
    username,
    passwordHash,
    role: data.role,
    isActive: true,
    mustChangePassword: true,
    passwordChangedAt: null,
  });

  await logAudit("Create User", `Created user account '${username}' with role '${data.role}' (temporary password assigned)`, {
    permission: "users.create",
    resource: "user",
    resourceId: newUser._id.toString(),
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true, id: newUser._id.toString() };
}

export async function resetUserPassword(userId: string, temporaryPassword?: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "users.update")) {
    throw new Error("Unauthorized: Administrator access required");
  }

  if (session.userId === userId) {
    throw new Error("You cannot reset your own password with this function. Please use Change Password.");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  const tempPassword =
    temporaryPassword && temporaryPassword.trim().length >= 6
      ? temporaryPassword.trim()
      : Math.random().toString(36).slice(-8) + "!A1";

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  targetUser.passwordHash = passwordHash;
  targetUser.mustChangePassword = true;
  targetUser.passwordChangedAt = null;
  await targetUser.save();

  await logAudit("Reset Password", `Reset temporary password for user '${targetUser.username}'`, {
    permission: "users.update",
    resource: "user",
    resourceId: targetUser._id.toString(),
  });

  revalidatePath("/admin/users");
  return { success: true, temporaryPassword: tempPassword, username: targetUser.username };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  await connectToDatabase();
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: You must be logged in to change your password");
  }

  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword) {
    throw new Error("Current password is required");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirmation do not match");
  }

  if (newPassword === currentPassword) {
    throw new Error("New password must be different from current temporary password");
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    throw new Error("User account not found or deactivated");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  await user.save();

  // Refresh session cookie with mustChangePassword = false
  await createSession(user._id.toString(), user.role, user.username, false);

  await logAudit(
    "Change Password",
    `User '${user.username}' successfully changed their password`,
    {
      permission: "users.update",
      resource: "user",
      resourceId: user._id.toString(),
    }
  );

  return { success: true, role: user.role };
}

export async function toggleUserActive(userId: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "users.activate")) {
    throw new Error("Unauthorized: Administrator access required");
  }

  if (session.userId === userId) {
    throw new Error("You cannot deactivate your own account");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  const newStatus = !targetUser.isActive;
  targetUser.isActive = newStatus;
  await targetUser.save();

  await logAudit(
    newStatus ? "Activate User" : "Deactivate User",
    `${newStatus ? "Activated" : "Deactivated"} user account '${targetUser.username}'`,
    {
      permission: newStatus ? "users.activate" : "users.deactivate",
      resource: "user",
      resourceId: targetUser._id.toString(),
    }
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true, isActive: newStatus };
}

export async function updateUserRole(userId: string, newRole: Role) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "users.assign_role")) {
    throw new Error("Unauthorized: Administrator access required");
  }

  const validRoles: Role[] = ["Administrator", "Inventory Manager", "Cashier"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role selected");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  const oldRole = targetUser.role;
  targetUser.role = newRole;
  await targetUser.save();

  await logAudit("Assign Role", `Changed role for '${targetUser.username}' from '${oldRole}' to '${newRole}'`, {
    permission: "users.assign_role",
    resource: "user",
    resourceId: targetUser._id.toString(),
  });

  revalidatePath("/admin/users");
  return { success: true };
}
