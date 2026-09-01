import { connectToDatabase } from "@/db";
import { Product, Inventory } from "@/db/schema";
import { IssuanceForm } from "./IssuanceForm";
import { Box, Layers } from "lucide-react";

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Box size={16} style={{ color: "var(--brand-600)" }} />
              Issue Inventory Items
            </div>
          </div>
          <div className="card-body">
            <IssuanceForm products={productsWithStock} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} style={{ color: "var(--gray-500)" }} />
              Stock Availability Quick-View
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {productsWithStock.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{p.name}</td>
                    <td><span className="mono badge badge-gray">{p.sku}</span></td>
                    <td>
                      <span className={`badge ${p.stock > 0 ? "badge-green" : "badge-red"}`}>
                        {p.stock} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
