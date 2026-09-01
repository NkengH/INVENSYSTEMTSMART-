"use client";

import { useState } from "react";
import { formatCFA } from "@/lib/format";
import { Printer, X, Download, Check } from "lucide-react";

export interface ReceiptDetail {
  id: string;
  receiptNumber: string;
  type: "SALE" | "REFUND";
  referenceId: string;
  createdAt: string;
  cashierName: string;
  tillSessionId: string;
  paymentMethod: string;
  totalAmount: number;
  items: {
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export function ReceiptViewer({ receipt }: { receipt: ReceiptDetail }) {
  const [isOpen, setIsOpen] = useState(false);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-secondary btn-sm" style={{ padding: "4px 10px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 5 }}>
        <Printer size={13} /> View &amp; Print
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 460, padding: 0 }}>
            {/* Header controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)" }} className="no-print">
              <div>
                <span style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.95rem" }}>Receipt Voucher</span>
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginLeft: 8 }}>{receipt.receiptNumber}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Printer size={14} /> Print Receipt
                </button>
                <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
              </div>
            </div>

            {/* Printable Commercial Thermal Receipt Layout */}
            <div
              id="printable-receipt"
              style={{
                padding: "24px 28px",
                background: "#ffffff",
                color: "#111827",
                fontFamily: "var(--font-mono), 'Courier New', Courier, monospace",
                fontSize: "0.82rem",
                lineHeight: 1.45,
              }}
            >
              {/* Store Header */}
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "0.02em", color: "#000" }}>
                  MAC COMPUTERS &amp; ELECTRONICS
                </div>
                <div style={{ fontSize: "0.72rem", color: "#4b5563", fontWeight: 500, marginTop: 2 }}>
                  Vente de Matériels Informatiques &amp; Accessoires
                </div>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>
                  Akwa Central, Douala — Cameroun
                </div>
                <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>
                  Tel: (+237) 651 704 545 / 699 545 548
                </div>
                <div style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: 2 }}>
                  RCCM: RC/DLA/2024/B/1842 • NIU: M01241678902A
                </div>
                <div style={{ margin: "10px 0 8px", borderTop: "1px dashed #6b7280" }} />
                <div style={{ fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
                  {receipt.type === "SALE" ? "••• TICKET DE CAISSE / SALE TICKET •••" : "••• BORDEREAU DE RETOUR / REFUND •••"}
                </div>
              </div>

              {/* Metadata */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.76rem", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>N° Ticket:</span>
                  <span style={{ fontWeight: 700 }}>{receipt.receiptNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Date/Heure:</span>
                  <span>{new Date(receipt.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Caissier(e):</span>
                  <span style={{ textTransform: "capitalize" }}>{receipt.cashierName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Session Caisse:</span>
                  <span>#{receipt.tillSessionId.slice(-6)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Mode Paiement:</span>
                  <span style={{ fontWeight: 700 }}>{receipt.paymentMethod}</span>
                </div>
              </div>

              <div style={{ margin: "8px 0", borderTop: "1px dashed #6b7280" }} />

              {/* Line Items Table */}
              <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #111827" }}>
                    <th style={{ padding: "4px 0", width: "50%" }}>Désignation</th>
                    <th style={{ textAlign: "center", padding: "4px 0" }}>Qté</th>
                    <th style={{ textAlign: "right", padding: "4px 0" }}>P.U</th>
                    <th style={{ textAlign: "right", padding: "4px 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px dotted #e5e7eb" }}>
                      <td style={{ padding: "5px 0" }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>{item.productSku}</div>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "top", padding: "5px 0" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", verticalAlign: "top", padding: "5px 0" }}>{formatCFA(item.unitPrice)}</td>
                      <td style={{ textAlign: "right", verticalAlign: "top", padding: "5px 0", fontWeight: 700 }}>{formatCFA(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ margin: "10px 0 8px", borderTop: "1px dashed #6b7280" }} />

              {/* Total Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 900, margin: "6px 0" }}>
                <span>NET À PAYER (CFA):</span>
                <span>{formatCFA(receipt.totalAmount)}</span>
              </div>

              <div style={{ margin: "10px 0 8px", borderTop: "1px dashed #6b7280" }} />

              {/* Barcode Simulation & Footer */}
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <div
                  style={{
                    display: "inline-block",
                    letterSpacing: "4px",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    color: "#000",
                    border: "1px solid #111",
                    padding: "4px 14px",
                    borderRadius: 4,
                  }}
                >
                  *||| | |||| | |||||| || |*
                </div>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: 4 }}>
                  REF: {receipt.referenceId}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#374151", fontWeight: 600, marginTop: 8 }}>
                  Merci pour votre confiance ! / Thank you!
                </div>
                <div style={{ fontSize: "0.64rem", color: "#6b7280", marginTop: 2 }}>
                  Les articles vendus ne sont ni repris ni échangés sauf accord préalable sous 7 jours avec ce ticket.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
