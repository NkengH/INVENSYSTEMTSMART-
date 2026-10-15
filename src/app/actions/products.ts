"use server";

import { connectToDatabase } from "@/db";
import { Product, Inventory, StockMovement } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createProduct(data: {
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit?: string;
  description?: string;
  initialStock?: number;
}) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "products.create")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const sku = data.sku.toUpperCase().trim();
  const existing = await Product.findOne({ sku });
  if (existing) {
    throw new Error(`Product with SKU '${sku}' already exists`);
  }

  const product = await Product.create({
    name: data.name.trim(),
    sku,
    purchasePrice: Number(data.purchasePrice),
    sellingPrice: Number(data.sellingPrice),
    minimumStock: Number(data.minimumStock) || 0,
    unit: data.unit?.trim() || "pcs",
    description: data.description?.trim(),
    isActive: true,
  });

  const initialStockQty = Math.max(0, Number(data.initialStock) || 0);

  // Initialize inventory at initial stock quantity
  await Inventory.create({
    productId: product._id,
    quantity: initialStockQty,
  });

  if (initialStockQty > 0) {
    await StockMovement.create({
      productId: product._id,
      movementType: "ADJUSTMENT",
      quantity: initialStockQty,
      previousQuantity: 0,
      newQuantity: initialStockQty,
      reason: "INITIAL_STOCK",
      performedBy: session.userId,
    });
  }

  await logAudit("Create Product", `Created product ${product.name} (${product.sku}) with ${initialStockQty} initial stock`, {
    permission: "products.create",
    resource: "product",
    resourceId: product._id.toString(),
  });

  revalidatePath("/inventory-manager/products");
  revalidatePath("/inventory-manager/inventory");
  return { success: true, id: product._id.toString() };
}

export async function updateProduct(
  productId: string,
  data: {
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    minimumStock: number;
    unit?: string;
    description?: string;
  }
) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "products.update")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  product.name = data.name.trim();
  product.purchasePrice = Number(data.purchasePrice);
  product.sellingPrice = Number(data.sellingPrice);
  product.minimumStock = Number(data.minimumStock) || 0;
  if (data.unit) product.unit = data.unit.trim();
  if (data.description !== undefined) product.description = data.description.trim();

  await product.save();

  await logAudit("Update Product", `Updated product ${product.name} (${product.sku})`, {
    permission: "products.update",
    resource: "product",
    resourceId: product._id.toString(),
  });

  revalidatePath("/inventory-manager/products");
  revalidatePath("/inventory-manager/inventory");
  return { success: true };
}

export async function toggleProductActive(productId: string) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "products.deactivate")) {
    throw new Error("Unauthorized: Inventory Manager access required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const newStatus = !product.isActive;
  product.isActive = newStatus;
  await product.save();

  await logAudit(
    newStatus ? "Activate Product" : "Deactivate Product",
    `${newStatus ? "Activated" : "Deactivated"} product ${product.name} (${product.sku})`,
    {
      permission: "products.deactivate",
      resource: "product",
      resourceId: product._id.toString(),
    }
  );

  revalidatePath("/inventory-manager/products");
  revalidatePath("/inventory-manager/inventory");
  return { success: true, isActive: newStatus };
}
