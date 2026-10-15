import { connectToDatabase } from "@/db";
import { User } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { UserActions, ToggleActiveButton, ResetPasswordButton } from "./UserActions";
import { Users, UserCheck, UserX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await connectToDatabase();
  const session = await getSession();
  const allUsers = await User.find().sort({ createdAt: -1 }).lean();
  const activeCount = allUsers.filter((u) => u.isActive).length;
  const inactiveCount = allUsers.length - activeCount;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">User Accounts</h1>
          <p className="page-subtitle">Manage system users, assign approved roles, and control account status</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <UserActions />
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><Users size={18} /></div>
          <div className="stat-card-label">Total Accounts</div>
          <div className="stat-card-value">{allUsers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><UserCheck size={18} /></div>
          <div className="stat-card-label">Active Users</div>
          <div className="stat-card-value" style={{ color: "var(--success)" }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon red"><UserX size={18} /></div>
          <div className="stat-card-label">Deactivated Users</div>
          <div className="stat-card-value" style={{ color: "var(--danger)" }}>{inactiveCount}</div>
        </div>
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-title">Registered Accounts</div>
          <span className="badge badge-gray">{allUsers.length} users</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Assigned Role</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => {
              const roleBadgeColor: Record<string, string> = {
                "Administrator": "badge-indigo",
                "Inventory Manager": "badge-green",
                "Cashier": "badge-blue",
              };

              return (
                <tr key={user._id.toString()}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, #2b5eff, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: "white", flexShrink: 0
                      }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{user.username}</span>
                        {session?.userId === user._id.toString() && (
                          <span style={{ fontSize: "0.7rem", color: "var(--brand-600)", marginLeft: 6, fontWeight: 700 }}>
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${roleBadgeColor[user.role] || "badge-gray"}`}>{user.role}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      <span className={`badge ${user.isActive ? "badge-green" : "badge-red"}`}>
                        {user.isActive ? "● Active" : "○ Inactive"}
                      </span>
                      {user.mustChangePassword && (
                        <span className="badge badge-amber" style={{ fontSize: "0.72rem" }} title="User must change password upon next login">
                          🔑 Temp Password
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-500)", fontSize: "0.82rem" }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ToggleActiveButton
                        userId={user._id.toString()}
                        isActive={user.isActive}
                        currentUserId={session?.userId}
                      />
                      <ResetPasswordButton
                        userId={user._id.toString()}
                        username={user.username}
                        currentUserId={session?.userId}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="table-empty">
                    <span className="table-empty-icon">👤</span>
                    No user accounts registered. Click <strong>Add New User</strong> to create one.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
