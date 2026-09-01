"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Shield, Package, Box, CreditCard, Sparkles } from "lucide-react";

interface Persona {
  role: string;
  username: string;
  badge: string;
  badgeClass: string;
  icon: any;
  color: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    role: "Administrator",
    username: "admin",
    badge: "Full System Control",
    badgeClass: "badge-purple",
    icon: Shield,
    color: "#818cf8",
  },
  {
    role: "Inventory Manager",
    username: "manager",
    badge: "Inventory, Orders & AI",
    badgeClass: "badge-green",
    icon: Package,
    color: "#34d399",
  },
  {
    role: "Cashier",
    username: "cashier",
    badge: "POS, Sales & Till",
    badgeClass: "badge-blue",
    icon: CreditCard,
    color: "#60a5fa",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function performLogin(u: string, p: string) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handlePersonaSelect(personaUsername: string) {
    const p = personaUsername + "123";
    setUsername(personaUsername);
    setPassword(p);
    performLogin(personaUsername, p);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1-Click Demo Personas */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-300)", marginBottom: 10, letterSpacing: "0.03em", textTransform: "uppercase" }}>
          <Sparkles size={13} /> 1-Click Demo Switcher
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {DEMO_PERSONAS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.username}
                type="button"
                onClick={() => handlePersonaSelect(p.username)}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = p.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: p.color, flexShrink: 0 }}>
                  <Icon size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{p.role}</div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)" }}>{p.badge}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 600 }}>or sign in manually</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>

      {/* Manual Login Form */}
      <form onSubmit={(e) => { e.preventDefault(); performLogin(username, password); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div className="form-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="login-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="login-input"
            placeholder="e.g. admin, manager, cashier"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? (
            <>
              <span className="loading-spinner" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>
      </form>
    </div>
  );
}
