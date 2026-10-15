import { Suspense } from "react";
import { connectToDatabase } from "@/db";
import { Product, Inventory } from "@/db/schema";
import { InventoryTable, InventoryRow } from "./InventoryTable";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await connectToDatabase();
  const allProducts  = await Product.find({ isActive: true }).lean();
  const allInventory = await Inventory.find().lean();

  const rows: InventoryRow[] = allProducts.map((p) => {
    const inv = allInventory.find((i) => i.productId.toString() === p._id.toString());
    const qty = inv?.quantity || 0;
    const isOut = qty === 0;
    const isLow = qty > 0 && qty <= p.minimumStock;
    return {
      productId: p._id.toString(),
      name: p.name,
      sku: p.sku,
      unit: p.unit || "pcs",
      qty,
      minStock: p.minimumStock,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      valuation: qty * p.purchasePrice,
      isOut,
      isLow,
    };
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Warehouse Inventory</h1>
          <p className="page-subtitle">Real-time digital stock monitoring, health thresholds, and valuation across all product lines</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <InventoryTable rows={rows} />
      </Suspense>
    </>
  );
}
