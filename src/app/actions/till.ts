"use server";

import { connectToDatabase } from "@/db";
import { TillSession } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function openTill(openingBalance: number, workerName?: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "till.open")) {
    throw new Error("Unauthorized");
  }

  // 4. Validate data
  if (openingBalance === undefined || openingBalance === null || isNaN(openingBalance) || openingBalance < 0) {
    throw new Error("Please enter a valid opening amount (0 or greater).");
  }

  // 5. Check existing session in MongoDB
  const existingOpen = await TillSession.findOne({
    cashierId: session.userId,
    status: "OPEN",
  });

  // 6. If a session already exists
  if (existingOpen) {
    throw new Error("A till session already exists.");
  }

  // 7. If no session exists -> Create the new till session in MongoDB
  const finalWorkerName = workerName?.trim() || session.username || "Cashier";

  const till = await TillSession.create({
    cashierId: session.userId,
    cashierName: finalWorkerName,
    workerName: finalWorkerName,
    openingBalance: Number(openingBalance),
    status: "OPEN",
    openedAt: new Date(),
  });

  await logAudit("Open Till", `Worker "${finalWorkerName}" opened till session with float ${openingBalance}`, {
    permission: "till.open",
    resource: "till",
    resourceId: till._id.toString(),
  });

  revalidatePath("/cashier/till");
  revalidatePath("/cashier/sales");
  revalidatePath("/cashier");

  // 8. Successful creation
  return {
    success: true,
    message: "Session saved successfully.",
    _id: till._id.toString(),
    id: till._id.toString(),
    cashierName: till.cashierName,
    workerName: till.workerName,
    openingBalance: till.openingBalance,
    status: till.status,
    openedAt: till.openedAt,
  };
}

export const createTillSession = openTill;

export async function closeTill(expectedBalance: number, actualBalance: number) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "till.close")) {
    throw new Error("Unauthorized");
  }

  const existingOpen = await TillSession.findOne({
    cashierId: session.userId,
    status: "OPEN",
  });

  if (!existingOpen) {
    throw new Error("No open till session.");
  }

  const diff = actualBalance - expectedBalance;

  existingOpen.expectedBalance = expectedBalance;
  existingOpen.closingBalance = actualBalance;
  existingOpen.difference = diff;
  existingOpen.status = "CLOSED";
  existingOpen.closedAt = new Date();
  await existingOpen.save();

  await logAudit("Close Till", `Closed till session`, {
    permission: "till.close",
    resource: "till",
    resourceId: existingOpen._id.toString(),
  });

  revalidatePath("/cashier/till");
  revalidatePath("/cashier/sales");
  return { success: true };
}
