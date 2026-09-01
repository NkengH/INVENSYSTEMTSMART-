"use server";

import { connectToDatabase } from "@/db";
import { Sale, SaleItem, Refund, RefundItem, Inventory, StockMovement, Receipt, TillSession } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCFA } from "@/lib/format";
import { revalidatePath } from "next/cache";

interface RefundItemInput {
  saleItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  restoreToInventory: boolean;
}

export async function processRefund(saleId: string, items: RefundItemInput[]) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "refunds.process")) {
    throw new Error("Unauthorized: Cashier role required for refunds");
  }

  const openTill = await TillSession.findOne({
    cashierId: session.userId,
    status: "OPEN",
  });

  if (!openTill) {
    throw new Error("You must have an open till session to process refunds.");
  }

  const sale = await Sale.findById(saleId);
  if (!sale) {
    throw new Error("Original sale not found");
  }

  if (sale.status === "REFUNDED") {
    throw new Error("This sale has already been fully refunded.");
  }

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    throw new Error("No items selected for refund.");
  }

  // Validate quantities against original sale items
  let totalRefundAmount = 0;
  for (const item of validItems) {
    const saleItem = await SaleItem.findById(item.saleItemId);
    if (!saleItem) {
      throw new Error(`Sale item not found: ${item.saleItemId}`);
    }

    const availableToRefund = saleItem.quantity - (saleItem.returnedQuantity || 0);
    if (item.quantity > availableToRefund) {
      throw new Error(`Cannot refund ${item.quantity} units. Only ${availableToRefund} returnable.`);
    }

    totalRefundAmount += item.quantity * item.unitPrice;
  }

  const refundNumber = "REF-" + Date.now();
  const refund = await Refund.create({
    refundNumber,
    saleId: sale._id,
    tillSessionId: openTill._id,
    cashierId: session.userId,
    totalAmount: totalRefundAmount,
  });

  for (const item of validItems) {
    const saleItem = await SaleItem.findById(item.saleItemId);
    if (saleItem) {
      saleItem.returnedQuantity = (saleItem.returnedQuantity || 0) + item.quantity;
      await saleItem.save();
    }

    await RefundItem.create({
      refundId: refund._id,
      saleItemId: item.saleItemId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      restoredToInventory: item.restoreToInventory,
    });

    // If item is in resalable condition, restore stock and log movement
    if (item.restoreToInventory) {
      let inv = await Inventory.findOne({ productId: item.productId });
      if (!inv) {
        inv = await Inventory.create({ productId: item.productId, quantity: 0 });
      }

      const prevQty = inv.quantity || 0;
      const newQty = prevQty + item.quantity;
      inv.quantity = newQty;
      await inv.save();

      await StockMovement.create({
        productId: item.productId,
        movementType: "REFUND",
        quantity: item.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: `Customer Refund (${refundNumber}) - Returned to Stock`,
        referenceId: refund._id.toString(),
        performedBy: session.userId,
      });
    }
  }

  // Update original sale status
  const allSaleItems = await SaleItem.find({ saleId: sale._id });
  const allFullyReturned = allSaleItems.every((si) => si.returnedQuantity >= si.quantity);

  sale.status = allFullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";
  await sale.save();

  // Create receipt for refund
  const receiptNumber = "RCT-REF-" + Date.now();
  await Receipt.create({
    receiptNumber,
    type: "REFUND",
    referenceId: refund._id.toString(),
  });

  await logAudit("Process Refund", `Processed refund ${refundNumber} for Sale ${sale.saleNumber} (${formatCFA(totalRefundAmount)})`, {
    permission: "refunds.process",
    resource: "refund",
    resourceId: refund._id.toString(),
  });

  revalidatePath("/cashier/refunds");
  revalidatePath("/cashier/sales");
  revalidatePath("/cashier/receipts");
  revalidatePath("/cashier/till");
  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager/movements");

  return { success: true, refundId: refund._id.toString(), refundNumber };
}
