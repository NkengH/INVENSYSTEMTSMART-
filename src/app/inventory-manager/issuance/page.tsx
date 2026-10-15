import { connectToDatabase } from "@/db";
import { Product, Inventory } from "@/db/schema";
import { IssuanceView } from "./IssuanceView";

export const dynamic = "force-dynamic";

export default async function IssuancePage() {
  await connectToDatabase();
  const allProducts = await Product.find({ isActive: true }).lean();
  const allInventory = await Inventory.find().lean();

  const productsWithStock = allProducts.map((p) => {
    const inv = allInventory.find((i) => i.productId.toString() === p._id.toString());
    return {
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      stock: inv?.quantity || 0,
    };
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Stock Issuance</h1>
          <p className="page-subtitle">Issue authorized inventory items out of the warehouse with full audit traceability</p>
        </div>
      </div>

      <IssuanceView initialProducts={productsWithStock} />
    </>
  );
}
