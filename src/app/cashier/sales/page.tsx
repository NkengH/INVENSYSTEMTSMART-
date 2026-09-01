import { connectToDatabase } from "@/db";
import { Product, Inventory, TillSession, Category } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { SaleForm } from "./SaleForm";
import Link from "next/link";
import { AlertTriangle, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await connectToDatabase();
  const session = await getSession();

  const openTill = session
    ? await TillSession.findOne({
        cashierId: session.userId,
        status: "OPEN",
      }).lean()
    : null;

  if (!openTill) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Point of Sale (POS)</h1>
            <p className="page-subtitle">Process customer transactions and generate instant receipts</p>
          </div>
        </div>
        <div className="alert alert-warning" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={22} style={{ color: "var(--warning)" }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>Till Session Required</div>
              <div style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
                You must open a till session with your initial cash float before processing transactions.
              </div>
            </div>
          </div>
          <Link href="/cashier/till" className="btn btn-primary btn-sm">
            Open Till Session &rarr;
          </Link>
        </div>
      </>
    );
  }

  // Get products with categories and available inventory
  const [allProducts, allInventory, allCategories] = await Promise.all([
    Product.find({ isActive: true }).lean(),
    Inventory.find().lean(),
    Category.find().lean(),
  ]);

  const productsWithStock = allProducts.map((p) => {
    const inv = allInventory.find((i) => i.productId.toString() === p._id.toString());
    const cat = allCategories.find((c) => c._id.toString() === p.categoryId?.toString());
    return {
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      categoryName: cat?.name || "General",
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      stock: inv?.quantity || 0,
    };
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="page-title">Point of Sale (POS)</h1>
            <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              ● Till Open
            </span>
          </div>
          <p className="page-subtitle">Real-time product lookup, cart management, tender calculation, and receipt generation</p>
        </div>
      </div>
      <SaleForm products={productsWithStock} />
    </>
  );
}
