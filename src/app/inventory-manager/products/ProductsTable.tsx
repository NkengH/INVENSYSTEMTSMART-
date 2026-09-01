"use client";

import { useState, useMemo } from "react";
import { formatCFA } from "@/lib/format";
import { EditProductModal, ToggleProductActiveButton } from "./ProductForm";
import { Package, Search, X, Download, TrendingUp } from "lucide-react";

export function ProductsTable({ products }: { products: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [products, searchQuery, statusFilter]);

  const activeCount = products.filter((p) => p.isActive).length;

  function exportCSV() {
    const headers = ["Product Name", "SKU", "Selling Price (CFA)", "Purchase Cost (CFA)", "Gross Margin (%)", "Min Stock", "Status"];
    const csvRows = filteredProducts.map((p) => {
      const sp = parseFloat(p.sellingPrice) || 0;
      const pp = parseFloat(p.purchasePrice) || 0;
      const margin = sp > 0 ? Math.round(((sp - pp) / sp) * 100) : 0;
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        sp,
        pp,
        `${margin}%`,
        p.minimumStock,
        p.isActive ? "ACTIVE" : "INACTIVE",
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Products_Catalog_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header" style={{ flexDirection: "column", gap: 12, alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="data-table-title">Product Catalog &amp; Pricing Master ({filteredProducts.length} of {products.length})</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={exportCSV} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={13} /> Export Catalog CSV
            </button>
            <span className="badge badge-blue">{activeCount} active lines</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              type="text"
              placeholder="Filter products by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 34, margin: 0, height: 36, fontSize: "0.85rem" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", padding: 3, borderRadius: 8 }}>
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: statusFilter === s ? "#fff" : "transparent",
                  color: statusFilter === s ? "var(--brand-700)" : "var(--gray-600)",
                  boxShadow: statusFilter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Selling Price (CFA)</th>
            <th>Purchase Cost (CFA)</th>
            <th>Gross Margin</th>
            <th>Min Buffer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => {
            const sp = parseFloat(p.sellingPrice) || 0;
            const pp = parseFloat(p.purchasePrice) || 0;
            const marginPct = sp > 0 ? Math.round(((sp - pp) / sp) * 100) : 0;
            const marginColor = marginPct >= 30 ? "var(--success)" : marginPct >= 15 ? "var(--brand-600)" : "var(--warning)";

            return (
              <tr key={p.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={15} style={{ color: "#4338ca" }} />
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{p.name}</span>
                  </div>
                </td>
                <td><span className="mono badge badge-gray">{p.sku}</span></td>
                <td style={{ fontWeight: 700, color: "var(--gray-900)" }}>{formatCFA(p.sellingPrice)}</td>
                <td style={{ color: "var(--gray-600)" }}>{formatCFA(p.purchasePrice)}</td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      background: "var(--gray-100)",
                      color: marginColor,
                    }}
                  >
                    <TrendingUp size={11} /> {marginPct}%
                  </span>
                </td>
                <td>
                  <span className="badge badge-amber">{p.minimumStock} {p.unit || "pcs"}</span>
                </td>
                <td>
                  <span className={`badge ${p.isActive ? "badge-green" : "badge-red"}`}>
                    {p.isActive ? "● Active" : "○ Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <EditProductModal product={p} />
                    <ToggleProductActiveButton productId={p.id} isActive={p.isActive} />
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="table-empty">
                  <span className="table-empty-icon">🔍</span>
                  <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Matching Products</p>
                  <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", margin: "0 0 10px" }}>
                    No products match your current search and filter criteria.
                  </p>
                  <button onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }} className="btn btn-secondary btn-sm">
                    Reset Filter
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
