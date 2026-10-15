"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryModal, setRecoveryModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password. Please try again.");
      }

      if (data.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }

      const dest =
        data.role === "Administrator"
          ? "/admin"
          : data.role === "Inventory Manager"
          ? "/inventory-manager"
          : data.role === "Cashier"
          ? "/cashier"
          : "/admin";

      window.location.href = dest;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }



  return (
    <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      {/* Official INVENSMART Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <img
          src="/logo.png"
          alt="INVENSMART - Smart Inventory, Better Decisions."
          style={{
            maxWidth: 260,
            width: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: "2.1rem",
          fontWeight: 800,
          color: "var(--gray-900, #0f172a)",
          textAlign: "center",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          margin: "0 0 10px",
        }}
      >
        Hello Again!
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--gray-500, #64748b)",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: 340,
          margin: "0 auto 28px",
          fontWeight: 400,
        }}
      >
        Welcome back to INVENSMART system. Please enter your credentials to continue.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
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
            }}
          >
            {error}
          </div>
        )}



        {/* Username Input Field */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            padding: "0 16px",
            background: "var(--gray-50, #f8fafc)",
            border: "1.5px solid var(--gray-200, #dbeafe)",
            borderRadius: 12,
            gap: 12,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "#1b6ef3";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27, 110, 243, 0.15)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--gray-200, #dbeafe)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <User size={18} color="#64748b" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.95rem",
              color: "var(--gray-900, #0f172a)",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Password Input Field */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            padding: "0 16px",
            background: "var(--gray-50, #f8fafc)",
            border: "1.5px solid var(--gray-200, #dbeafe)",
            borderRadius: 12,
            gap: 12,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "#1b6ef3";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27, 110, 243, 0.15)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--gray-200, #dbeafe)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Lock size={18} color="#64748b" style={{ flexShrink: 0 }} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.95rem",
              color: "var(--gray-900, #0f172a)",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "#64748b",
              flexShrink: 0,
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Remember Me & Recovery Password Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.88rem",
            marginTop: 2,
            marginBottom: 6,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              color: "var(--gray-500, #64748b)",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: 17,
                height: 17,
                borderRadius: 4,
                accentColor: "#1b6ef3",
                cursor: "pointer",
              }}
            />
            <span>Remember Me</span>
          </label>

          <button
            type="button"
            onClick={() => setRecoveryModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#1b6ef3",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            Recovery Password
          </button>
        </div>

        {/* Primary Login Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: 52,
            background: "#1b6ef3",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            fontSize: "1.02rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 4px 14px rgba(27, 110, 243, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = "#1558c4";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = "#1b6ef3";
          }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 18, height: 18 }} />
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Recovery Password Modal */}
      {recoveryModal && (
        <div
          className="modal-backdrop"
          onClick={() => setRecoveryModal(false)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, padding: 24, textAlign: "center" }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#eaf3ff",
                color: "#1b6ef3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 8 }}>
              Password Recovery
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--gray-500)",
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              To reset your credentials, please contact your system administrator or IT security
              desk at <strong>admin@invensmart.com</strong> or call <strong>(+237) 651 704 545</strong>.
            </p>
            <button
              onClick={() => setRecoveryModal(false)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", background: "#1b6ef3" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
