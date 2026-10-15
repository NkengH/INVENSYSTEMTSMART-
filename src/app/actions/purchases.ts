"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/db";
import { Purchase, PurchaseItem, Product, Inventory, Category } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCFA } from "@/lib/format";
import { revalidatePath } from "next/cache";

// ── Purchase Management: Low-Stock Detection ─────────────────────────────────

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  deficit: number;
  purchasePrice: number;
  unit: string;
}

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "purchases.view")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  // Reuse the same low-stock rule as the dashboard: quantity <= minimumStock
  const lowStockItems = await Inventory.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $match: {
        "product.isActive": true,
        $expr: { $lte: ["$quantity", "$product.minimumStock"] },
      },
    },
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        name: "$product.name",
        sku: "$product.sku",
        categoryId: "$product.categoryId",
        currentStock: "$quantity",
        minimumStock: "$product.minimumStock",
        purchasePrice: "$product.purchasePrice",
        unit: "$product.unit",
      },
    },
    { $sort: { currentStock: 1 } },
  ]);

  // Resolve category names in one batch
  const categoryIds = [...new Set(lowStockItems.map((i: any) => i.categoryId?.toString()).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c._id.toString()] = c.name;

  return lowStockItems.map((item: any) => ({
    id: item.productId.toString(),
    name: item.name,
    sku: item.sku,
    categoryName: item.categoryId ? (catMap[item.categoryId.toString()] ?? "Uncategorised") : "Uncategorised",
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    deficit: Math.max(0, item.minimumStock - item.currentStock),
    purchasePrice: item.purchasePrice ?? 0,
    unit: item.unit ?? "pcs",
  }));
}

// ── Purchase History ──────────────────────────────────────────────────────────

export interface PurchaseHistoryItem {
  id: string;
  purchaseNumber: string;
  vendorName: string;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  status: string;
  totalAmount: number;
  totalItems: number;
  totalQty: number;
  createdAt: string;
  notes?: string;
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    total: number;
  }[];
}

export async function getPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "purchases.view")) {
    throw new Error("Unauthorized");
  }

  const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(100).lean();
  const purchaseIds = purchases.map((p) => p._id);
  const allItems = await PurchaseItem.find({ purchaseId: { $in: purchaseIds } }).lean();

  const allProductIds = [...new Set(allItems.map((i: any) => i.productId?.toString()).filter(Boolean))];
  const products = await Product.find({ _id: { $in: allProductIds } }).lean();
  const prodMap: Record<string, any> = {};
  for (const p of products) prodMap[p._id.toString()] = p;

  const itemsByPO: Record<string, typeof allItems> = {};
  for (const item of allItems) {
    const key = item.purchaseId.toString();
    if (!itemsByPO[key]) itemsByPO[key] = [];
    itemsByPO[key].push(item);
  }

  return purchases.map((p) => {
    const items = itemsByPO[p._id.toString()] ?? [];
    const totalQty = items.reduce((s, i) => s + i.quantityOrdered, 0);
    const populatedItems = items.map((i) => {
      const prod = prodMap[i.productId?.toString()] || {};
      return {
        id: i._id.toString(),
        productName: prod.name || "Unknown Product",
        productSku: prod.sku || "N/A",
        quantityOrdered: i.quantityOrdered,
        quantityReceived: i.quantityReceived ?? 0,
        unitPrice: i.unitPrice,
        total: (i.quantityOrdered || 0) * (i.unitPrice || 0),
      };
    });

    return {
      id: p._id.toString(),
      purchaseNumber: p.purchaseNumber,
      vendorName: p.vendorName ?? "General Supplier",
      paymentTerms: p.paymentTerms ?? "Cash On Delivery",
      expectedDeliveryDate: p.expectedDeliveryDate ? p.expectedDeliveryDate.toISOString() : undefined,
      status: p.status,
      totalAmount: p.totalAmount,
      totalItems: items.length,
      totalQty,
      createdAt: p.createdAt.toISOString(),
      notes: p.notes,
      items: populatedItems,
    };
  });
}

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
    createdBy: mongoose.isValidObjectId(session.userId) ? session.userId : undefined,
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
  return { success: true };
}

export async function receivePurchase(purchaseId: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || (session.role !== "Inventory Manager" && session.role !== "Administrator")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) {
    throw new Error("Purchase order not found");
  }

  if (purchase.status === "Fully Received") {
    throw new Error("Purchase order has already been received");
  }

  if (purchase.status === "Cancelled") {
    throw new Error("Cannot receive a cancelled purchase order");
  }

  const items = await PurchaseItem.find({ purchaseId });
  const { StockMovement } = await import("@/db/schema");

  for (const item of items) {
    const unreceivedQty = item.quantityOrdered - (item.quantityReceived || 0);
    if (unreceivedQty > 0) {
      item.quantityReceived = item.quantityOrdered;
      await item.save();

      let inv = await Inventory.findOne({ productId: item.productId });
      if (!inv) {
        inv = await Inventory.create({ productId: item.productId, quantity: 0 });
      }
      const prevQty = inv.quantity || 0;
      inv.quantity = prevQty + unreceivedQty;
      await inv.save();

      await StockMovement.create({
        productId: item.productId,
        movementType: "RECEIPT",
        quantity: unreceivedQty,
        previousQuantity: prevQty,
        newQuantity: inv.quantity,
        reason: `PO Receipt (${purchase.purchaseNumber})`,
        referenceId: purchase._id.toString(),
        performedBy: mongoose.isValidObjectId(session.userId) ? session.userId : undefined,
      });
    }
  }

  purchase.status = "Fully Received";
  await purchase.save();

  await logAudit("Receive Purchase", `Received all goods for purchase order ${purchase.purchaseNumber}`, {
    permission: "purchases.receive",
    resource: "purchase",
    resourceId: purchase._id.toString(),
  });

  revalidatePath("/inventory-manager/purchases");
  revalidatePath("/inventory-manager/inventory");
  revalidatePath("/inventory-manager/movements");
  return { success: true };
}

// ── AI Purchase Insights ──────────────────────────────────────────────────────

export interface AIPurchaseAdvice {
  productId: string;
  recommendation: string;
  suggestedQty: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
}

export async function getAIPurchaseAdvice(lowStockProducts: LowStockProduct[]): Promise<AIPurchaseAdvice[]> {
  await connectToDatabase();
  const session = await getSession();
  if (!session || (session.role !== "Inventory Manager" && session.role !== "Administrator")) {
    throw new Error("Unauthorized");
  }

  if (lowStockProducts.length === 0) return [];

  const productIds = lowStockProducts.map((p) => p.id);
  const { SaleItem } = await import("@/db/schema");
  const recentSales = await SaleItem.find({ productId: { $in: productIds } })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  const salesCountByProduct: Record<string, number> = {};
  for (const s of recentSales) {
    const pid = s.productId?.toString();
    if (pid) {
      salesCountByProduct[pid] = (salesCountByProduct[pid] || 0) + (s.quantity || 1);
    }
  }

  return lowStockProducts.map((p) => {
    const recentUnits = salesCountByProduct[p.id] || 0;
    const isOutOfStock = p.currentStock === 0;

    let urgency: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    let recommendation = "";
    let suggestedQty = Math.max(p.deficit, 1);

    if (isOutOfStock) {
      urgency = "HIGH";
      if (recentUnits > 5) {
        suggestedQty = Math.max(p.deficit * 2, p.minimumStock);
        recommendation = `CRITICAL: Out of stock with strong velocity (${recentUnits} sold recently). Recommended buffer: +${suggestedQty} units.`;
      } else {
        recommendation = `URGENT: Product is completely out of stock. Immediate replenishment of ${suggestedQty} units recommended.`;
      }
    } else if (recentUnits > 10) {
      urgency = "HIGH";
      suggestedQty = Math.max(p.deficit + 5, Math.ceil(p.minimumStock * 1.5));
      recommendation = `HIGH DEMAND: High sales velocity (${recentUnits} units sold). Consider increasing to ${suggestedQty} units to prevent stockouts.`;
    } else if (recentUnits === 0 && p.currentStock > 0) {
      urgency = "LOW";
      suggestedQty = Math.max(1, p.deficit);
      recommendation = `SLOW-MOVING: Low recent sales velocity. Recommend conservative reorder of ${suggestedQty} units.`;
    } else {
      urgency = "MEDIUM";
      recommendation = `MODERATE: Replenish deficit of ${suggestedQty} units to restore standard minimum stock level.`;
    }

    return {
      productId: p.id,
      recommendation,
      suggestedQty,
      urgency,
    };
  });
}

