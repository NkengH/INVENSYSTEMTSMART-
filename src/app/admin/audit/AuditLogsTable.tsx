"use client";

import { useState, useMemo } from "react";
import { Activity, Search, X, User, Filter } from "lucide-react";

export interface AuditLogRow {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  action: string;
  description: string;
}

const actionColorMap: Record<string, string> = {
  CREATE: "badge-blue",
  UPDATE: "badge-indigo",
  DELETE: "badge-red",
  LOGIN: "badge-green",
  LOGOUT: "badge-gray",
  SALE: "badge-green",
  REFUND: "badge-red",
  PURCHASE: "badge-purple",
  TILL: "badge-amber",
  RECEPTION: "badge-amber",
  ISSUE: "badge-blue",
};

function getBadgeClass(action: string) {
  for (const key of Object.keys(actionColorMap)) {
    if (action?.toUpperCase().includes(key)) return actionColorMap[key];
  }
  return "badge-gray";
}

export function AuditLogsTable({ logs }: { logs: AuditLogRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesRole = selectedRole === "ALL" || log.role === selectedRole;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.userName && log.userName.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [logs, searchQuery, selectedRole]);

  return (
    <div className="data-table-container">
      <div className="data-table-header" style={{ flexDirection: "column", gap: 12, alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="data-table-title">System Event Timeline ({filteredLogs.length} of {logs.length})</div>
          <Activity size={16} style={{ color: "var(--gray-400)" }} />
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              type="text"
              placeholder="Search audit trail by description, action, or user..."
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
            {[
              { id: "ALL", label: "All Roles" },
              { id: "Administrator", label: "Admin" },
              { id: "Inventory Manager", label: "Manager" },
              { id: "Cashier", label: "Cashier" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  whiteSpace: "nowrap",
                  background: selectedRole === tab.id ? "#fff" : "transparent",
                  color: selectedRole === tab.id ? "var(--brand-700)" : "var(--gray-600)",
                  boxShadow: selectedRole === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User &amp; Role</th>
            <th>Action Category</th>
            <th>Event Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td>
                <span className="mono" style={{ color: "var(--gray-500)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString("en-GB", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                  }) : "—"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={13} style={{ color: "var(--gray-600)" }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--gray-800)", fontSize: "0.85rem" }}>
                      {log.userName || "system"}
                    </span>
                    <span style={{ display: "block", fontSize: "0.72rem", color: "var(--gray-400)" }}>
                      {log.role || "System"}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${getBadgeClass(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td style={{ color: "var(--gray-700)", fontSize: "0.85rem", maxWidth: 450 }}>
                {log.description}
              </td>
            </tr>
          ))}
          {filteredLogs.length === 0 && (
            <tr>
              <td colSpan={4}>
                <div className="table-empty">
                  <span className="table-empty-icon">🔍</span>
                  <p style={{ fontWeight: 600, color: "var(--gray-700)", margin: "8px 0 4px" }}>No Matching Audit Events</p>
                  <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: "0 0 10px" }}>
                    No events match your filter criteria.
                  </p>
                  <button onClick={() => { setSearchQuery(""); setSelectedRole("ALL"); }} className="btn btn-secondary btn-sm">
                    Reset Filters
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
