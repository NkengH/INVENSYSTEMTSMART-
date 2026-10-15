"use client";

import { useState, useMemo } from "react";
import { formatCFA } from "@/lib/format";
import {
  Download, FileText, Package, DollarSign, ArrowRightLeft,
  BarChart3, TrendingUp, PieChart, Layers, Calendar
} from "lucide-react";

interface ReportsData {
  inventory: {
    productName: string;
    sku: string;
    stock: number;
    minStock: number;
    purchasePrice: number;
    sellingPrice: number;
    inventoryValuation: number;
    status: string;
  }[];
  sales: {
    saleNumber: string;
    cashierName: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    date: string;
  }[];
  movements: {
    productName: string;
    movementType: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    date: string;
  }[];
}

export function ReportsViewer({ data }: { data: ReportsData }) {
  const [activeTab, setActiveTab] = useState<"visuals" | "inventory" | "sales" | "movements">("visuals");

  const totalSalesRevenue = useMemo(() => data.sales.reduce((acc, s) => acc + s.totalAmount, 0), [data.sales]);
  const totalInventoryValuation = useMemo(() => data.inventory.reduce((acc, i) => acc + i.inventoryValuation, 0), [data.inventory]);

  function downloadCSV(filename: string, rows: Record<string, any>[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const val = r[h] !== undefined ? String(r[h]).replace(/"/g, '""') : "";
              return `"${val}"`;
            })
            .join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Report Navigation Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--gray-200)", paddingBottom: 12, overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("visuals")}
            className={`btn btn-sm ${activeTab === "visuals" ? "btn-primary" : "btn-secondary"}`}
          >
            <BarChart3 size={14} /> Financial Performance Charts
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`btn btn-sm ${activeTab === "inventory" ? "btn-primary" : "btn-secondary"}`}
          >
            <Package size={14} /> Inventory Valuation ({data.inventory.length})
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`btn btn-sm ${activeTab === "sales" ? "btn-primary" : "btn-secondary"}`}
          >
            <DollarSign size={14} /> Sales Ledger ({data.sales.length})
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`btn btn-sm ${activeTab === "movements" ? "btn-primary" : "btn-secondary"}`}
          >
            <ArrowRightLeft size={14} /> Stock Movements ({data.movements.length})
          </button>
        </div>

        {activeTab !== "visuals" && (
          <button
            onClick={() => downloadCSV(`InvenSmart_${activeTab}_Report`, data[activeTab])}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* 1. VISUAL FINANCIAL PERFORMANCE CHARTS */}
      {activeTab === "visuals" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Revenue Summary */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} style={{ color: "var(--brand-600)" }} /> Sales Revenue Overview (CFA)
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Revenue Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "var(--success)" }}>Total Sales Revenue</span>
                    <span>{formatCFA(totalSalesRevenue)}</span>
                  </div>
                  <div style={{ height: 12, background: "var(--gray-100)", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${totalSalesRevenue > 0 ? 100 : 0}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #10b981, #059669)",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>

                {/* Warehouse Asset Value */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "var(--brand-600)" }}>Current Warehouse Asset Valuation</span>
                    <span>{formatCFA(totalInventoryValuation)}</span>
                  </div>
                  <div style={{ height: 12, background: "var(--gray-100)", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, #818cf8, #4f46e5)",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, padding: 14, background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Sales
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--success)", marginTop: 2 }}>
                    {formatCFA(totalSalesRevenue)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase" }}>
                    Warehouse Value
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-600)", marginTop: 2 }}>
                    {formatCFA(totalInventoryValuation)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Asset Valuation Lines */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PieChart size={16} style={{ color: "var(--brand-600)" }} /> Top High-Valuation Stock Lines
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.inventory
                  .slice()
                  .sort((a, b) => b.inventoryValuation - a.inventoryValuation)
                  .slice(0, 5)
                  .map((item, idx) => {
                    const pct = totalInventoryValuation > 0 ? Math.round((item.inventoryValuation / totalInventoryValuation) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{item.productName}</span>
                          <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>{formatCFA(item.inventoryValuation)} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "var(--gray-100)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand-500)", borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY REPORT */}
      {activeTab === "inventory" && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Units in Stock</th>
                <th>Min Safety</th>
                <th>Unit Cost</th>
                <th>Unit Price</th>
                <th>Total Valuation (CFA)</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: "var(--gray-900)" }}>{row.productName}</td>
                  <td><span className="mono badge badge-gray">{row.sku}</span></td>
                  <td style={{ fontWeight: 700 }}>{row.stock}</td>
                  <td style={{ color: "var(--gray-500)" }}>{row.minStock}</td>
                  <td>{formatCFA(row.purchasePrice)}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>{formatCFA(row.sellingPrice)}</td>
                  <td style={{ fontWeight: 800, color: "var(--gray-900)" }}>{formatCFA(row.inventoryValuation)}</td>
                  <td>
                    <span className={`badge ${row.status === "In Stock" ? "badge-green" : row.status === "Low Stock" ? "badge-amber" : "badge-red"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. SALES REPORT */}
      {activeTab === "sales" && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sale Ticket</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Payment Tender</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Revenue (CFA)</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((row, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--brand-600)" }}>{row.saleNumber}</td>
                  <td style={{ color: "var(--gray-500)" }}>{row.date}</td>
                  <td style={{ fontWeight: 600 }}>{row.cashierName}</td>
                  <td><span className="badge badge-blue">{row.paymentMethod}</span></td>
                  <td><span className="badge badge-green">{row.status}</span></td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{formatCFA(row.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. MOVEMENTS REPORT */}
      {activeTab === "movements" && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Type</th>
                <th style={{ textAlign: "center" }}>Qty Moved</th>
                <th style={{ textAlign: "center" }}>Before → After</th>
                <th>Audit Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.movements.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>{row.date}</td>
                  <td style={{ fontWeight: 600 }}>{row.productName}</td>
                  <td><span className="badge badge-purple">{row.movementType}</span></td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{row.quantity}</td>
                  <td style={{ textAlign: "center", color: "var(--gray-600)" }}>{row.previousQuantity} → {row.newQuantity}</td>
                  <td style={{ color: "var(--gray-700)", fontSize: "0.82rem" }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
