import { connectToDatabase } from "@/db";
import { Product } from "@/db/schema";
import { ProductForm } from "./ProductForm";
import { ProductsTable } from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await connectToDatabase();
  const allProducts = await Product.find().sort({ createdAt: -1 }).lean();

  const formattedProducts = allProducts.map((p) => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
    minimumStock: p.minimumStock,
    unit: p.unit,
    isActive: p.isActive,
    createdAt: p.createdAt ? p.createdAt.toISOString() : "",
  }));

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            Manage product master records, pricing in CFA, minimum stock thresholds, and lifecycle status
          </p>
        </div>
        <ProductForm />
      </div>

      <ProductsTable products={formattedProducts} />
    </>
  );
}
