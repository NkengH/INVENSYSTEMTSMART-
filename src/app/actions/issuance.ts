"use server";

import { connectToDatabase } from "@/db";
import { Inventory, StockMovement } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function issueStock(productId: string, quantity: number, reason: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "inventory.issue")) {
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
    performedBy: session.userId,
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
