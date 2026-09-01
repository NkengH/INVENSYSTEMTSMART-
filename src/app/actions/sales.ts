"use server";

import { connectToDatabase } from "@/db";
import { TillSession, Sale, SaleItem, Inventory, StockMovement, Receipt } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export interface SalePayload {
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentMethod: "CASH" | "CARD" | "MTN_MOMO" | "ORANGE_MONEY" | "BANK_TRANSFER" | string;
  customerName?: string;
  customerPhone?: string;
  discountAmount?: number;
  taxAmount?: number;
  cashTendered?: number;
  changeAmount?: number;
  notes?: string;
}

export async function processSale(payload: SalePayload) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "sales.create")) {
    throw new Error("Unauthorized");
  }

  const {
    items,
    paymentMethod = "CASH",
    customerName,
    customerPhone,
    discountAmount = 0,
    taxAmount = 0,
    cashTendered,
    changeAmount,
    notes,
  } = payload;

  if (!items || items.length === 0) {
    throw new Error("Cannot process a sale with an empty cart.");
  }

  const openTill = await TillSession.findOne({
    cashierId: session.userId,
    status: "OPEN",
  });

  if (!openTill) {
    throw new Error("You must open an active till session before processing sales.");
  }

  // Stock check
  for (const item of items) {
    const inv = await Inventory.findOne({ productId: item.productId });
    if (!inv || (inv.quantity || 0) < item.quantity) {
      throw new Error(`Insufficient stock available for selected product.`);
    }
  }

  const subtotalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = Math.max(0, subtotalAmount - discountAmount + taxAmount);
  const saleNumber = "SALE-" + Date.now();

  const sale = await Sale.create({
    saleNumber,
    tillSessionId: openTill._id,
    cashierId: session.userId,
    customerName: customerName?.trim() || undefined,
    customerPhone: customerPhone?.trim() || undefined,
    subtotalAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    cashTendered: cashTendered || undefined,
    changeAmount: changeAmount || undefined,
    notes: notes?.trim() || undefined,
    status: "COMPLETED",
    paymentMethod,
  });

  for (const item of items) {
    await SaleItem.create({
      saleId: sale._id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });

    const inv = await Inventory.findOne({ productId: item.productId });
    if (inv) {
      const prevQty = inv.quantity || 0;
      const newQty = prevQty - item.quantity;
      inv.quantity = newQty;
      await inv.save();

      await StockMovement.create({
        productId: item.productId,
        movementType: "SALE",
        quantity: item.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: customerName ? `Customer Sale (${customerName})` : "Customer POS Sale",
        referenceId: sale._id.toString(),
        performedBy: session.userId,
      });
    }
  }

  // Generate receipt
  const receiptNumber = "RCT-" + Date.now();
  const receipt = await Receipt.create({
    receiptNumber,
    type: "SALE",
    referenceId: sale._id.toString(),
  });

  await logAudit("Process Sale", `Completed sale ${sale.saleNumber} (${paymentMethod} - ${totalAmount} CFA)`, {
    permission: "sales.create",
    resource: "sale",
    resourceId: sale._id.toString(),
  });

  revalidatePath("/cashier/sales");
  revalidatePath("/cashier/till");
  revalidatePath("/cashier/receipts");
  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager/movements");
  revalidatePath("/inventory-manager/reports");

  return {
    success: true,
    saleId: sale._id.toString(),
    saleNumber: sale.saleNumber,
    receiptNumber: receipt.receiptNumber,
    totalAmount,
    changeAmount: changeAmount || 0,
  };
}
