"use client";

import { useState } from "react";
import { createUser, toggleUserActive } from "@/app/actions/users";
import { Role } from "@/lib/rbac";
import { UserPlus, UserCheck, UserX, X } from "lucide-react";

export function UserActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Cashier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles: Role[] = ["Administrator", "Inventory Manager", "Cashier"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUser({ username, password, role });
      setIsOpen(false);
      setUsername("");
      setPassword("");
      setRole("Cashier");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary btn-sm">
        <UserPlus size={15} /> Add New User
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create User Account</h2>
              <button onClick={() => setIsOpen(false)} className="modal-close"><X size={18} /></button>
            </div>

            {error && (
              <div className="form-error" style={{ margin: "16px 24px 0" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-username">Username</label>
                  <input
                    id="new-username"
                    type="text"
                    className="form-input"
                    placeholder="e.g. john_manager"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-password">Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-role">Assigned Role</label>
                  <select
                    id="new-role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    required
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner" /> Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} /> Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ToggleActiveButton({ userId, isActive, currentUserId }: { userId: string; isActive: boolean; currentUserId?: string }) {
  const [loading, setLoading] = useState(false);
  const isSelf = currentUserId === userId;

  async function handleToggle() {
    if (isSelf) return;
    setLoading(true);
    try {
      await toggleUserActive(userId);
    } catch (err: any) {
      alert(err.message || "Failed to change user status");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) {
    return (
      <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontStyle: "italic" }}>
        Current User
      </span>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
      style={{ padding: "4px 10px", fontSize: "0.78rem" }}
      title={isActive ? "Deactivate Account" : "Activate Account"}
    >
      {loading ? (
        <span className="loading-spinner" style={{ width: 12, height: 12 }} />
      ) : isActive ? (
        <>
          <UserX size={13} /> Deactivate
        </>
      ) : (
        <>
          <UserCheck size={13} /> Activate
        </>
      )}
    </button>
  );
}
