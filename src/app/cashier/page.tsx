import { connectToDatabase } from "@/db";
import { Sale, TillSession } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatCFA } from "@/lib/format";
import { ShoppingCart, DollarSign, CreditCard, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CashierDashboard() {
  await connectToDatabase();
  const session = await getSession();

  const openTill = session
    ? await TillSession.findOne({ cashierId: session.userId, status: "OPEN" }).lean()
    : null;

  let todaysSales: any[] = [];
  let totalRevenue = 0;
  let cashSales = 0;

  if (openTill) {
    todaysSales = await Sale.find({ tillSessionId: openTill._id }).lean();
    totalRevenue = todaysSales.reduce((s, t) => s + Number(t.totalAmount), 0);
    cashSales = todaysSales.filter((s) => s.paymentMethod === "CASH").reduce((s, t) => s + Number(t.totalAmount), 0);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Cashier Dashboard</h1>
          <p className="page-subtitle">
            {openTill ? "Session active — ready to process sales" : "No active till session"}
          </p>
        </div>
        {openTill ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="badge badge-blue" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
              Worker: {openTill.workerName || openTill.cashierName || session?.username || "Cashier"}
            </span>
            <span className="badge badge-green" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
              ● Till Open
            </span>
          </div>
        ) : (
          <a href="/cashier/till" className="btn btn-primary"><CreditCard size={15} /> Create Session</a>
        )}
      </div>

      {!openTill && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <CreditCard size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>You must create a till session before processing sales. <a href="/cashier/till" style={{ fontWeight: 700, textDecoration: "underline" }}>Create Session →</a></span>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><ShoppingCart size={20} /></div>
          <div className="stat-card-label">Sales Today</div>
          <div className="stat-card-value">{todaysSales.length}</div>
          <div className="stat-card-sub">This session</div>
          <div className="stat-card-accent" style={{ background: "#2563eb" }} />
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><TrendingUp size={20} /></div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ fontSize: "1.4rem", color: "var(--success)" }}>
            {formatCFA(totalRevenue)}
          </div>
          <div className="stat-card-sub">This session</div>
          <div className="stat-card-accent" style={{ background: "#059669" }} />
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><DollarSign size={20} /></div>
          <div className="stat-card-label">Cash Tendered</div>
          <div className="stat-card-value" style={{ fontSize: "1.4rem", color: "var(--warning)" }}>
            {formatCFA(cashSales)}
          </div>
          <div className="stat-card-sub">In-drawer cash</div>
          <div className="stat-card-accent" style={{ background: "#d97706" }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Quick Actions</div>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/cashier/sales"    className="btn btn-primary"><ShoppingCart size={15} /> Process Sale</a>
          <a href="/cashier/till"     className="btn btn-secondary"><CreditCard size={15} /> Manage Till</a>
          <a href="/cashier/refunds"  className="btn btn-secondary">Process Refund</a>
          <a href="/cashier/receipts" className="btn btn-secondary">View Receipts</a>
        </div>
      </div>
    </>
  );
}
