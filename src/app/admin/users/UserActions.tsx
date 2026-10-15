"use client";

import { useState } from "react";
import { createUser, toggleUserActive, resetUserPassword } from "@/app/actions/users";
import { Role } from "@/lib/rbac";
import { UserPlus, UserCheck, UserX, X, KeyRound, Copy, Check, ShieldAlert } from "lucide-react";

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
                  <label className="form-label" htmlFor="new-password">Initial Temporary Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 4, display: "block" }}>
                    🔒 This will be assigned as a temporary password. The user will be required to change it on their first login.
                  </span>
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

export function ResetPasswordButton({
  userId,
  username,
  currentUserId,
}: {
  userId: string;
  username: string;
  currentUserId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedPassword, setCompletedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSelf = currentUserId === userId;
  if (isSelf) return null;

  function generatePassword() {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Temp!${res}`;
    setTempPassword(generated);
  }

  function handleOpen() {
    generatePassword();
    setError("");
    setCompletedPassword(null);
    setCopied(false);
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!tempPassword || tempPassword.length < 6) {
      setError("Temporary password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await resetUserPassword(userId, tempPassword);
      setCompletedPassword(res.temporaryPassword);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (completedPassword) {
      navigator.clipboard.writeText(completedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn btn-secondary btn-sm"
        style={{ padding: "4px 10px", fontSize: "0.78rem" }}
        title="Reset Password to a temporary one"
      >
        <KeyRound size={13} /> Reset Password
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Reset User Password</h2>
              <button onClick={() => setIsOpen(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>

            {completedPassword ? (
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--success, #16a34a)",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  <Check size={18} /> Temporary Password Set Successfully
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", lineHeight: 1.45, marginBottom: 16 }}>
                  A new temporary password has been assigned for user <strong>{username}</strong>. They will be forced to choose their own private password upon next login.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--gray-100, #f1f5f9)",
                    border: "1px dashed var(--gray-300, #cbd5e1)",
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <code style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--brand-600, #1b6ef3)" }}>
                    {completedPassword}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6 }}
                  >
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "10px 12px",
                    background: "#fffbeb",
                    borderRadius: 8,
                    fontSize: "0.78rem",
                    color: "#92400e",
                    marginBottom: 20,
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    For security reasons, this temporary password will not be shown again. Communicate it to the user now.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => setIsOpen(false)} className="btn btn-primary">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="form-error" style={{ margin: "16px 24px 0" }}>
                    {error}
                  </div>
                )}

                <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", margin: 0, lineHeight: 1.45 }}>
                    Resetting password for <strong>{username}</strong>. The user will be required to set a new permanent password on their next login.
                  </p>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label className="form-label" htmlFor="temp-password" style={{ margin: 0 }}>
                        Temporary Password
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--brand-600)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        ⚡ Generate Random
                      </button>
                    </div>
                    <input
                      id="temp-password"
                      type="text"
                      className="form-input"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="loading-spinner" /> Resetting...
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} /> Set Temporary Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
