"use client";

import { useState } from "react";
import { openTill, closeTill } from "@/app/actions/till";
import { formatCFA } from "@/lib/format";
import { CreditCard, CheckCircle2, Lock } from "lucide-react";

export function OpenTillForm() {
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await openTill(parseFloat(balance));
    } catch (err: any) {
      setError(err.message || "Failed to open till");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div className="form-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="open-bal">Opening Cash Drawer Balance (CFA)</label>
        <input
          id="open-bal"
          type="number"
          step="1"
          min="0"
          required
          className="form-input"
          placeholder="e.g. 50000"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 4 }}>
          Enter the initial floating cash amount present in the cash drawer at session start.
        </p>
      </div>

      <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: "100%" }}>
        {loading ? (
          <>
            <span className="loading-spinner" /> Opening Session...
          </>
        ) : (
          <>
            <CreditCard size={16} /> Open Till Session
          </>
        )}
      </button>
    </form>
  );
}

export function CloseTillForm({ expectedBalance }: { expectedBalance: number }) {
  const [actualBalance, setActualBalance] = useState(expectedBalance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!confirm("Are you sure you want to reconcile and close this till session?")) return;
    setLoading(true);
    try {
      await closeTill(expectedBalance, parseFloat(actualBalance));
    } catch (err: any) {
      setError(err.message || "Failed to close till");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div className="form-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="actual-bal" style={{ color: "var(--danger)", fontWeight: 700 }}>
          Counted Cash in Drawer (CFA)
        </label>
        <input
          id="actual-bal"
          type="number"
          step="1"
          min="0"
          required
          className="form-input"
          style={{ fontSize: "1.2rem", fontWeight: 700, borderColor: "var(--danger)" }}
          value={actualBalance}
          onChange={(e) => setActualBalance(e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 4 }}>
          <span>Expected Balance:</span>
          <strong>{formatCFA(expectedBalance)}</strong>
        </div>
      </div>

      <button disabled={loading} type="submit" className="btn btn-danger" style={{ width: "100%" }}>
        {loading ? (
          <>
            <span className="loading-spinner" /> Closing Session...
          </>
        ) : (
          <>
            <Lock size={16} /> Reconcile and Close Till
          </>
        )}
      </button>
    </form>
  );
}
