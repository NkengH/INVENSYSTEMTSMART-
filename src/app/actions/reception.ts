"use server";

import { connectToDatabase } from "@/db";
import { Purchase, PurchaseItem, Inventory, StockMovement } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function receivePurchase(purchaseId: string, receivedItems: { itemId: string; received: number }[]) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "inventory.receive")) {
    throw new Error("Unauthorized");
  }

  let anyReceived = false;

  for (const data of receivedItems) {
    if (data.received > 0) {
      anyReceived = true;
      const item = await PurchaseItem.findById(data.itemId);
      if (!item) continue;

      const newReceived = (item.quantityReceived || 0) + data.received;
      item.quantityReceived = newReceived;
      await item.save();

      // Update inventory
      let inv = await Inventory.findOne({ productId: item.productId });
      if (!inv) {
        inv = await Inventory.create({ productId: item.productId, quantity: 0 });
      }

      const prevQty = inv.quantity || 0;
      const newQty = prevQty + data.received;
      inv.quantity = newQty;
      await inv.save();

      // Stock Movement
      await StockMovement.create({
        productId: item.productId,
        movementType: "RECEIPT",
        quantity: data.received,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: "Stock Reception from PO",
        referenceId: purchaseId,
        performedBy: session.userId,
      });
    }
  }

  if (anyReceived) {
    // Check if all items for this purchase are fully received
    const allItems = await PurchaseItem.find({ purchaseId });
    const allFullyReceived = allItems.length > 0 && allItems.every((i) => (i.quantityReceived || 0) >= i.quantityOrdered);

    await Purchase.findByIdAndUpdate(purchaseId, {
      status: allFullyReceived ? "Fully Received" : "Partially Received",
    });

    await logAudit("Receive Stock", `Received items for PO ${purchaseId}`, {
      permission: "inventory.receive",
      resource: "purchase",
      resourceId: purchaseId,
    });
  }

  revalidatePath("/inventory-manager/reception");
  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager/movements");
  revalidatePath("/inventory-manager/purchases");
  revalidatePath("/inventory-manager");
  return { success: true };
}
