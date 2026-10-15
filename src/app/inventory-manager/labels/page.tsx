import { Suspense } from "react";
import { connectToDatabase } from "@/db";
import { Product, Category, Inventory } from "@/db/schema";
import { LabelStudio, LabelProductItem } from "./LabelStudio";

export const dynamic = "force-dynamic";

export default async function LabelsStudioPage() {
  await connectToDatabase();

  const [products, categories, inventories] = await Promise.all([
    Product.find({ isActive: true }).sort({ name: 1 }).lean(),
    Category.find().lean(),
    Inventory.find().lean(),
  ]);

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    categoryMap.set(c._id.toString(), c.name);
  }

  const inventoryMap = new Map<string, number>();
  for (const inv of inventories) {
    inventoryMap.set(inv.productId.toString(), inv.quantity || 0);
  }

  const items: LabelProductItem[] = products.map((p) => {
    const catName = p.categoryId ? categoryMap.get(p.categoryId.toString()) || "Electronics" : "Electronics";
    const qty = inventoryMap.get(p._id.toString()) || 0;
    return {
      id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || p.sku,
      category: catName,
      sellingPrice: p.sellingPrice,
      stock: qty,
    };
  });

  return (
    <>
      <div className="page-header no-print">
        <div className="page-header-left">
          <h1 className="page-title">Barcode & Shelf Label Studio</h1>
          <p className="page-subtitle">
            Generate, customize, and batch-print vector barcodes, shelf price tags, and QR stickers for products
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="loading-state">Loading Barcode Studio...</div>}>
        <LabelStudio products={items} />
      </Suspense>
    </>
  );
}
