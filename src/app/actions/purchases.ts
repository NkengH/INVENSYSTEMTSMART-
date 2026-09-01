"use server";

import { connectToDatabase } from "@/db";
import { Purchase, PurchaseItem } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCFA } from "@/lib/format";
import { revalidatePath } from "next/cache";

export interface CreatePurchasePayload {
  vendorName?: string;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export async function createPurchase(data: CreatePurchasePayload) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "purchases.create")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const validItems = data.items.filter((i) => i.quantity > 0 && i.unitPrice > 0);
  if (validItems.length === 0) {
    throw new Error("At least one valid item with positive quantity and price is required");
  }

  const totalAmount = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const purchaseNumber = "PO-" + Date.now();

  const purchase = await Purchase.create({
    purchaseNumber,
    vendorName: data.vendorName?.trim() || "Tech Distribution Hub",
    paymentTerms: data.paymentTerms || "Cash On Delivery",
    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
    notes: data.notes?.trim() || undefined,
    status: "Submitted",
    totalAmount,
    createdBy: session.userId,
  });

  for (const item of validItems) {
    await PurchaseItem.create({
      purchaseId: purchase._id,
      productId: item.productId,
      quantityOrdered: item.quantity,
      quantityReceived: 0,
      unitPrice: item.unitPrice,
    });
  }

  await logAudit("Create Purchase", `Created purchase order ${purchaseNumber} from ${purchase.vendorName} (${formatCFA(totalAmount)})`, {
    permission: "purchases.create",
    resource: "purchase",
    resourceId: purchase._id.toString(),
  });

  revalidatePath("/inventory-manager/purchases");
  revalidatePath("/inventory-manager/reception");
  return { success: true, id: purchase._id.toString(), purchaseNumber };
}

export async function cancelPurchase(purchaseId: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "purchases.cancel")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) {
    throw new Error("Purchase order not found");
  }

  if (purchase.status === "Fully Received") {
    throw new Error("Cannot cancel a fully received purchase order");
  }

  purchase.status = "Cancelled";
  await purchase.save();

  await logAudit("Cancel Purchase", `Cancelled purchase order ${purchase.purchaseNumber}`, {
    permission: "purchases.cancel",
    resource: "purchase",
    resourceId: purchase._id.toString(),
  });

  revalidatePath("/inventory-manager/purchases");
  revalidatePath("/inventory-manager/reception");
  return { success: true };
}
