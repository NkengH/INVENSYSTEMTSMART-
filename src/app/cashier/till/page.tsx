import { connectToDatabase } from "@/db";
import { TillSession, Sale } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatCFA } from "@/lib/format";
import { OpenTillForm, CloseTillForm } from "./TillForms";
import { CreditCard, DollarSign, ShoppingCart, Clock, UserCheck, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TillPage() {
  await connectToDatabase();
  const session = await getSession();

  const openTill = session
    ? await TillSession.findOne({ cashierId: session.userId, status: "OPEN" }).lean()
    : null;

  // Retrieve recent till sessions
  const recentSessions = await TillSession.find()
    .sort({ openedAt: -1 })
    .limit(8)
    .lean();

  let todaysSales: any[] = [];
  let expectedBalance = openTill ? Number(openTill.openingBalance) : 0;

  if (openTill) {
    todaysSales = await Sale.find({ tillSessionId: openTill._id }).lean();
    const cashSales = todaysSales
      .filter((s) => s.paymentMethod === "CASH")
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);
    expectedBalance += cashSales;
  }

  const activeWorker = openTill?.workerName || openTill?.cashierName || session?.username || "Assigned Cashier";

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Till Session Management</h1>
          <p className="page-subtitle">Manage cash drawer sessions, track active workers, and perform end-of-day reconciliation</p>
        </div>
        {openTill && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge badge-blue" style={{ fontSize: "0.82rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <UserCheck size={14} /> Worker: <strong>{activeWorker}</strong>
            </span>
            <span className="badge badge-green" style={{ fontSize: "0.82rem", padding: "6px 12px" }}>
              ● Session Active
            </span>
          </div>
        )}
      </div>

      {!openTill ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 480px) 1fr", gap: 24, alignItems: "start" }}>
          <div>
            <div className="alert alert-warning" style={{ marginBottom: 20 }}>
              <CreditCard size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>No active till session. Open a session below to start processing sales.</span>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-header-title">Create Till Session</div>
              </div>
              <div className="card-body">
                <OpenTillForm defaultWorkerName={session?.username || ""} />
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={16} /> Recent Till Sessions History
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Worker / Cashier</th>
                      <th>Opened</th>
                      <th>Float</th>
                      <th>Closing</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: 24 }}>
                          No previous till sessions found.
                        </td>
                      </tr>
                    ) : (
                      recentSessions.map((ts: any) => (
                        <tr key={ts._id.toString()}>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                              {ts.workerName || ts.cashierName || "Cashier"}
                            </div>
                          </td>
                          <td style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
                            {ts.openedAt ? new Date(ts.openedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCFA(ts.openingBalance)}</td>
                          <td>
                            {ts.closingBalance !== undefined ? (
                              <span style={{ fontWeight: 600, color: ts.difference && ts.difference !== 0 ? "var(--danger)" : "var(--success)" }}>
                                {formatCFA(ts.closingBalance)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--gray-400)" }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${ts.status === "OPEN" ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.72rem" }}>
                              {ts.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>Assigned Worker</span>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary-dark)" }}>
                        {activeWorker}
                      </span>
                    </div>
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
                  Logged-in Worker: <strong>{activeWorker}</strong>. Count and input total physical cash (CFA) currently in the drawer to reconcile and close this session.
                </p>
                <CloseTillForm expectedBalance={expectedBalance} />
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={16} /> Recent Till Sessions History
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Worker / Cashier</th>
                      <th>Opened</th>
                      <th>Closed</th>
                      <th>Float</th>
                      <th>Closing Balance</th>
                      <th>Difference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((ts: any) => (
                      <tr key={ts._id.toString()}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                            {ts.workerName || ts.cashierName || "Cashier"}
                          </div>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
                          {ts.openedAt ? new Date(ts.openedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
                          {ts.closedAt ? new Date(ts.closedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Active"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCFA(ts.openingBalance)}</td>
                        <td>
                          {ts.closingBalance !== undefined ? (
                            <span style={{ fontWeight: 600 }}>{formatCFA(ts.closingBalance)}</span>
                          ) : (
                            <span style={{ color: "var(--gray-400)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {ts.difference !== undefined ? (
                            <span style={{ fontWeight: 700, color: ts.difference === 0 ? "var(--success)" : "var(--danger)" }}>
                              {ts.difference > 0 ? `+${formatCFA(ts.difference)}` : formatCFA(ts.difference)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--gray-400)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${ts.status === "OPEN" ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.72rem" }}>
                            {ts.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
