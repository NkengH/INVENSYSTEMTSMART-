"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/db";
import { Inventory, StockMovement } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function issueStock(productId: string, quantity: number, reason: string) {
  await connectToDatabase();
  const session = await getSession();
  const isAuthorized =
    session &&
    (session.role === "Inventory Manager" ||
      session.role === "Administrator" ||
      hasPermission(session.role, "inventory.issue"));

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const inv = await Inventory.findOne({ productId });
  if (!inv || (inv.quantity || 0) < quantity) {
    throw new Error("Insufficient stock to issue");
  }

  const prevQty = inv.quantity || 0;
  const newQty = prevQty - quantity;
  inv.quantity = newQty;
  await inv.save();

  await StockMovement.create({
    productId,
    movementType: "ISSUE",
    quantity,
    previousQuantity: prevQty,
    newQuantity: newQty,
    reason: reason || "Manual Stock Issuance",
    performedBy: mongoose.isValidObjectId(session.userId) ? session.userId : undefined,
  });

  await logAudit("Issue Stock", `Issued ${quantity} units of product ${productId}`, {
    permission: "inventory.issue",
    resource: "product",
    resourceId: productId,
  });

  revalidatePath("/inventory-manager/issuance");
  revalidatePath("/inventory-manager/movements");
  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager");
  return { success: true };
}
