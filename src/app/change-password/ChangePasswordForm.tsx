"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2, LogOut } from "lucide-react";
import { changePassword } from "@/app/actions/users";

interface ChangePasswordFormProps {
  username?: string;
  role?: string;
}

export function ChangePasswordForm({ username, role }: ChangePasswordFormProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current temporary password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your temporary password.");
      return;
    }

    setLoading(true);

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res?.success) {
        throw new Error("Failed to change password. Please check your current password.");
      }

      setSuccess(true);

      // Determine destination based on role
      const userRole = res.role || role;
      let targetPath = "/";
      if (userRole === "Administrator") targetPath = "/admin";
      else if (userRole === "Inventory Manager") targetPath = "/inventory-manager";
      else if (userRole === "Cashier") targetPath = "/cashier";

      setTimeout(() => {
        router.push(targetPath);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please check your credentials.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      {/* Official INVENSMART Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <img
          src="/logo.png"
          alt="INVENSMART - Smart Inventory, Better Decisions."
          style={{
            maxWidth: 220,
            width: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Icon Badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#eff6ff",
            border: "2px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            boxShadow: "0 6px 16px rgba(37, 99, 235, 0.12)",
          }}
        >
          <KeyRound size={34} />
        </div>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: "1.85rem",
          fontWeight: 800,
          color: "var(--gray-900, #0f172a)",
          textAlign: "center",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          margin: "0 0 8px",
        }}
      >
        Set Your Private Password
      </h1>

      {/* Username / Subtitle */}
      <p
        style={{
          fontSize: "0.92rem",
          color: "var(--gray-500, #64748b)",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: 380,
          margin: "0 auto 20px",
        }}
      >
        {username ? (
          <>
            Logged in as <strong style={{ color: "var(--gray-800)" }}>{username}</strong>.
          </>
        ) : null}
      </p>

      {/* Mandatory Notice */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 16px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.45 }}>
          <strong>Action Required:</strong> Your temporary password must be changed before you can continue to your dashboard.
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 12,
            color: "#065f46",
            fontSize: "0.88rem",
            fontWeight: 600,
            marginBottom: 20,
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          Password successfully changed! Redirecting...
        </div>
      )}

      {/* Error Message */}
      {error && !success && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            color: "#991b1b",
            fontSize: "0.84rem",
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Current Password Field */}
        <div>
          <label
            htmlFor="currentPassword"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--gray-700, #334155)",
              marginBottom: 6,
            }}
          >
            Current (Temporary) Password
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 50,
              padding: "0 14px",
              background: "var(--gray-50, #f8fafc)",
              border: "1.5px solid var(--gray-200, #dbeafe)",
              borderRadius: 12,
              gap: 10,
            }}
          >
            <Lock size={18} color="var(--gray-400, #94a3b8)" />
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter temporary password"
              disabled={loading || success}
              required
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.92rem",
                color: "var(--gray-900, #0f172a)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              style={{
                background: "none",
                border: "none",
                color: "var(--gray-400, #94a3b8)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              title={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password Field */}
        <div>
          <label
            htmlFor="newPassword"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--gray-700, #334155)",
              marginBottom: 6,
            }}
          >
            New Permanent Password
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 50,
              padding: "0 14px",
              background: "var(--gray-50, #f8fafc)",
              border: "1.5px solid var(--gray-200, #dbeafe)",
              borderRadius: 12,
              gap: 10,
            }}
          >
            <KeyRound size={18} color="var(--gray-400, #94a3b8)" />
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              disabled={loading || success}
              required
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.92rem",
                color: "var(--gray-900, #0f172a)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              style={{
                background: "none",
                border: "none",
                color: "var(--gray-400, #94a3b8)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              title={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--gray-700, #334155)",
              marginBottom: 6,
            }}
          >
            Confirm New Password
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 50,
              padding: "0 14px",
              background: "var(--gray-50, #f8fafc)",
              border: "1.5px solid var(--gray-200, #dbeafe)",
              borderRadius: 12,
              gap: 10,
            }}
          >
            <KeyRound size={18} color="var(--gray-400, #94a3b8)" />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              disabled={loading || success}
              required
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.92rem",
                color: "var(--gray-900, #0f172a)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              style={{
                background: "none",
                border: "none",
                color: "var(--gray-400, #94a3b8)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              title={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          style={{
            marginTop: 8,
            height: 50,
            background: "linear-gradient(135deg, #1b6ef3 0%, #0d52c7 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            fontSize: "0.96rem",
            fontWeight: 700,
            cursor: loading || success ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(27, 110, 243, 0.35)",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 16, height: 16 }} />
              Updating Password...
            </>
          ) : (
            "Change Password & Continue"
          )}
        </button>

        {/* Sign Out Link */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--gray-500, #64748b)",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "underline",
            }}
          >
            <LogOut size={14} /> Sign out and return to login
          </button>
        </div>
      </form>
    </div>
  );
}
