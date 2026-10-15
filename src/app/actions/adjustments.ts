"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/db";
import { Inventory, StockMovement, Product } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export interface AdjustStockPayload {
  productId: string;
  adjustmentType: "ADD" | "DEDUCT" | "SET";
  quantity: number;
  reason: "AUDIT_DISCREPANCY" | "DAMAGED_GOODS" | "DEFECTIVE_RETURN" | "INTERNAL_USE" | "DEMO_UNIT" | "EXPIRATION" | "OTHER";
  notes?: string;
}

export async function adjustStock(payload: AdjustStockPayload) {
  await connectToDatabase();
  const session = await getSession();
  const isAuthorized =
    session &&
    (session.role === "Inventory Manager" ||
      session.role === "Administrator" ||
      hasPermission(session.role, "inventory.manage") ||
      hasPermission(session.role, "inventory.read") ||
      hasPermission(session.role, "inventory.issue") ||
      hasPermission(session.role, "inventory.receive") ||
      hasPermission(session.role, "inventory.monitor"));

  if (!isAuthorized) {
    throw new Error("Unauthorized: Authorized inventory clearance required");
  }

  const { productId, adjustmentType, quantity, reason, notes } = payload;
  if (!productId || quantity < 0) {
    throw new Error("Invalid product or quantity specified");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product record not found");
  }

  let inv = await Inventory.findOne({ productId });
  if (!inv) {
    inv = await Inventory.create({ productId, quantity: 0 });
  }

  const prevQty = inv.quantity || 0;
  let newQty = prevQty;

  if (adjustmentType === "ADD") {
    newQty = prevQty + quantity;
  } else if (adjustmentType === "DEDUCT") {
    if (prevQty < quantity) {
      throw new Error(`Cannot deduct ${quantity} units: current stock is only ${prevQty} units.`);
    }
    newQty = prevQty - quantity;
  } else if (adjustmentType === "SET") {
    newQty = quantity;
  }

  const diff = Math.abs(newQty - prevQty);
  if (diff === 0 && adjustmentType !== "SET") {
    throw new Error("No change in stock level.");
  }

  inv.quantity = newQty;
  await inv.save();

  const formattedReason = `Stock Adjustment [${reason.replace(/_/g, " ")}]${notes ? `: ${notes}` : ""}`;

  await StockMovement.create({
    productId,
    movementType: "ADJUSTMENT",
    quantity: diff,
    previousQuantity: prevQty,
    newQuantity: newQty,
    reason: formattedReason,
    performedBy: mongoose.isValidObjectId(session.userId) ? session.userId : undefined,
  });

  await logAudit("Stock Adjustment", `Adjusted ${product.name} (${product.sku}) from ${prevQty} to ${newQty} units. Reason: ${formattedReason}`, {
    permission: "inventory.manage",
    resource: "inventory",
    resourceId: inv._id.toString(),
  });

  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager/issuance");
  revalidatePath("/inventory-manager/movements");
  revalidatePath("/inventory-manager/reports");
  revalidatePath("/inventory-manager");

  return { success: true, newQuantity: newQty, previousQuantity: prevQty };
}
