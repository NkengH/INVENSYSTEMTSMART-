import { connectToDatabase } from "@/db";
import { Purchase, PurchaseItem, Product } from "@/db/schema";
import { formatCFA } from "@/lib/format";
import { PurchaseForm } from "./PurchaseForm";
import { PurchasesTable, PurchaseDetail } from "./PurchasesTable";
import { ShoppingCart, Clock, CheckCircle, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  await connectToDatabase();
  const [allPurchases, allPurchaseItems, allProducts] = await Promise.all([
    Purchase.find().sort({ createdAt: -1 }).lean(),
    PurchaseItem.find().lean(),
    Product.find().lean(),
  ]);

  const formattedProducts = allProducts
    .filter((p) => p.isActive)
    .map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
    }));

  const detailedPurchases: PurchaseDetail[] = allPurchases.map((p: any) => {
    const items = allPurchaseItems
      .filter((pi) => pi.purchaseId.toString() === p._id.toString())
      .map((pi) => {
        const prod = allProducts.find((prod) => prod._id.toString() === pi.productId.toString());
        return {
          id: pi._id.toString(),
          productName: prod?.name || "Product",
          productSku: prod?.sku || "—",
          quantityOrdered: pi.quantityOrdered,
          quantityReceived: pi.quantityReceived || 0,
          unitPrice: pi.unitPrice,
          total: pi.quantityOrdered * pi.unitPrice,
        };
      });

    return {
      id: p._id.toString(),
      purchaseNumber: p.purchaseNumber,
      vendorName: p.vendorName || "General Tech Supplier",
      paymentTerms: p.paymentTerms || "Cash On Delivery",
      expectedDeliveryDate: p.expectedDeliveryDate ? p.expectedDeliveryDate.toISOString() : undefined,
      notes: p.notes,
      status: p.status,
      totalAmount: p.totalAmount,
      createdAt: p.createdAt ? p.createdAt.toISOString() : "",
      items,
    };
  });

  const pendingCount  = allPurchases.filter((p) => p.status === "Submitted" || p.status === "Partially Received").length;
  const fullyReceived = allPurchases.filter((p) => p.status === "Fully Received").length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Purchase Orders &amp; Procurement</h1>
          <p className="page-subtitle">Manage supplier replenishment, track incoming shipments, and generate official purchase orders</p>
        </div>
        <PurchaseForm products={formattedProducts} />
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon purple"><ShoppingCart size={18} /></div>
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-value">{allPurchases.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><Clock size={18} /></div>
          <div className="stat-card-label">Pending Reception</div>
          <div className="stat-card-value" style={{ color: pendingCount > 0 ? "var(--warning)" : "var(--success)" }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><CheckCircle size={18} /></div>
          <div className="stat-card-label">Fully Received</div>
          <div className="stat-card-value" style={{ color: "var(--success)" }}>{fullyReceived}</div>
        </div>
      </div>

      <PurchasesTable purchases={detailedPurchases} />
    </>
  );
}
