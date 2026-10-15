import { AIChatPanel } from "@/app/inventory-manager/ai/AIChatPanel";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAIAnalysisPage() {
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
            Interactive decision co-pilot and real-time inventory intelligence — powered by Google Gemini AI
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="badge badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={12} /> Administrator Level
          </span>
        </div>
      </div>

      {/* Decision Co-Pilot Panel */}
      <AIChatPanel />
    </>
  );
}

