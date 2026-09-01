import { generateComprehensiveAIAnalysis } from "@/app/actions/ai";
import { AIChatPanel } from "./AIChatPanel";
import {
  TrendingUp, AlertTriangle, PackageCheck,
  BarChart3, AlertOctagon, ShieldCheck, Activity, Layers
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AIAnalysisPage() {
  const analysis = await generateComprehensiveAIAnalysis();

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="page-title">AI Inventory Intelligence</h1>
            <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={14} /> Gemini AI
            </span>
          </div>
          <p className="page-subtitle">
            Predictive modeling, actionable insights, and interactive Q&A — powered by Google Gemini AI
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            Updated: {new Date(analysis.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Decision Co-Pilot Panel */}
      <div style={{ marginBottom: 24 }}>
        <AIChatPanel />
      </div>

      {analysis.status === "insufficient_data" && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{analysis.message}</span>
        </div>
      )}

      {/* 6 Structured Business Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* 1. Demand Forecasting */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={16} />
              </div>
              1. Demand Forecasting
            </div>
            <span className="badge badge-blue">Sales Projection</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.demandForecasting.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Reorder Recommendations */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PackageCheck size={16} />
              </div>
              2. Procurement &amp; Reorder Plan
            </div>
            <span className="badge badge-green">Recommended</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.reorderRecommendations.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Low-Stock Prediction */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={16} />
              </div>
              3. Depletion Risk Warnings
            </div>
            <span className="badge badge-amber">Stock Warning</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.lowStockPredictions.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Sales Analysis */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 size={16} />
              </div>
              4. Sales Velocity Breakdown
            </div>
            <span className="badge badge-purple">Commercial</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.salesAnalysis.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. Slow-Moving Products */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertOctagon size={16} />
              </div>
              5. Deadstock &amp; Stagnant Lines
            </div>
            <span className="badge badge-red">Capital Risk</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.slowMovingProducts.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 6. Inventory Anomaly Detection */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div className="card-header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f4f4f5", color: "#3f3f46", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity size={16} />
              </div>
              6. Stock Ledger Auditing
            </div>
            <span className="badge badge-gray">Discrepancy Check</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.anomalyDetection.map((item, idx) => (
                <li key={idx} style={{ color: "var(--gray-800)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
