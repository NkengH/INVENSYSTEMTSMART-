import { connectToDatabase } from "@/db";
import { AuditLog } from "@/db/schema";
import { AuditLogsTable, AuditLogRow } from "./AuditLogsTable";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await connectToDatabase();
  const rawLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();

  const formattedLogs: AuditLogRow[] = rawLogs.map((log) => ({
    id: log._id.toString(),
    timestamp: log.createdAt ? log.createdAt.toISOString() : "",
    userName: log.userName || "system",
    role: log.role || "System",
    action: log.action || "EVENT",
    description: log.description || "",
  }));

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">System Audit Logs</h1>
          <p className="page-subtitle">Immutable security audit trail and system activity monitoring</p>
        </div>
      </div>

      <AuditLogsTable logs={formattedLogs} />
    </>
  );
}
