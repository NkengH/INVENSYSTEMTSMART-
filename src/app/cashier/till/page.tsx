import { connectToDatabase } from "@/db";
import { TillSession, Sale } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatCFA } from "@/lib/format";
import { OpenTillForm, CloseTillForm } from "./TillForms";
import { CreditCard, DollarSign, ShoppingCart, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TillPage() {
  await connectToDatabase();
  const session = await getSession();

  const openTill = session
    ? await TillSession.findOne({ cashierId: session.userId, status: "OPEN" }).lean()
    : null;

  let todaysSales: any[] = [];
  let expectedBalance = openTill ? Number(openTill.openingBalance) : 0;

  if (openTill) {
    todaysSales = await Sale.find({ tillSessionId: openTill._id }).lean();
    const cashSales = todaysSales
      .filter((s) => s.paymentMethod === "CASH")
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);
    expectedBalance += cashSales;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Till Session Management</h1>
          <p className="page-subtitle">Manage cash drawer sessions, monitor active transactions, and perform end-of-day reconciliation</p>
        </div>
        {openTill && (
          <span className="badge badge-green" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            ● Session Active
          </span>
        )}
      </div>

      {!openTill ? (
        <div style={{ maxWidth: 480 }}>
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            <CreditCard size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>No active till session. Open a session below to start processing sales.</span>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Open New Till Session</div>
            </div>
            <div className="card-body">
              <OpenTillForm />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Session summary */}
          <div>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-card-icon green"><DollarSign size={18} /></div>
                <div className="stat-card-label">Opening Float</div>
                <div className="stat-card-value" style={{ fontSize: "1.3rem" }}>
                  {formatCFA(openTill.openingBalance)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon blue"><ShoppingCart size={18} /></div>
                <div className="stat-card-label">Sales Recorded</div>
                <div className="stat-card-value" style={{ fontSize: "1.3rem" }}>{todaysSales.length}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={15} style={{ color: "var(--gray-400)" }} />
                  Current Session Details
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>Opened at</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {openTill.openedAt ? new Date(openTill.openedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--gray-100)" }}>
                    <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>Expected Drawer Balance</span>
                    <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--success)" }}>
                      {formatCFA(expectedBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close till */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Close Till Session</div>
            </div>
            <div className="card-body">
              <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", marginBottom: 20 }}>
                Count and input the total physical cash (CFA) currently in the drawer to reconcile and close this session.
              </p>
              <CloseTillForm expectedBalance={expectedBalance} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
