import { connectToDatabase } from "@/db";
import { AuditLog } from "@/db/schema";
import { getSession } from "./auth";

export async function logAudit(
  action: string,
  description: string,
  opts?: { permission?: string; resource?: string; resourceId?: string }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    await AuditLog.create({
      userId: session?.userId,
      userName: session?.username,
      role: session?.role,
      action,
      description,
      permission: opts?.permission,
      resource: opts?.resource,
      resourceId: opts?.resourceId,
    });
  } catch (error) {
    console.error("Failed to log audit entry:", error);
  }
}
