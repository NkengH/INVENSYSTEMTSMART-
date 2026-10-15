"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openTill, closeTill } from "@/app/actions/till";
import { formatCFA } from "@/lib/format";
import {
  CreditCard,
  CheckCircle2,
  Lock,
  User,
  Clock,
  AlertCircle,
  PlusCircle,
  ShoppingCart,
  X
} from "lucide-react";

export function OpenTillForm({
  defaultWorkerName = "",
  defaultOpen = false,
}: {
  defaultWorkerName?: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(defaultOpen);
  const [workerName, setWorkerName] = useState(defaultWorkerName);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Step 4 & 5: Validate and submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsExistingSession(false);
    setSuccessMessage("");

    // 4. Validate data
    const numBalance = parseFloat(balance);
    if (balance.trim() === "" || isNaN(numBalance) || numBalance < 0) {
      setError("Please enter a valid opening amount (0 or greater).");
      return; // Keep Cashier on the form so information can be corrected
    }

    setLoading(true);
    try {
      // 5 & 7: Check existing session in MongoDB & create new session
      const res = await openTill(numBalance, workerName);

      // 8. Successful creation
      setSuccessMessage(res.message || "Session saved successfully.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
      router.refresh();
    } catch (err: any) {
      const msg = err.message || "Failed to create till session.";
      if (msg.includes("already exists") || msg.includes("already open")) {
        // 6. If a session already exists
        setIsExistingSession(true);
        setError("A till session already exists.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // 8. Successful creation display
  if (successMessage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          className="alert alert-success"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 16,
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "1rem" }}>
            <CheckCircle2 size={20} />
            <span>Session saved successfully.</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            The till session has been created with status <strong>OPEN</strong>. Opening float:{" "}
            <strong>{formatCFA(parseFloat(balance) || 0)}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/cashier/sales"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ShoppingCart size={16} /> Proceed with Sales &rarr;
          </a>
          <button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              router.refresh();
            }}
            className="btn btn-secondary"
          >
            View Active Session
          </button>
        </div>
      </div>
    );
  }

  // 2. Create Session button state (when form is not yet opened)
  if (!showForm) {
    return (
      <div style={{ textAlign: "center", padding: "16px 8px" }}>
        <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", marginBottom: 18 }}>
          An active till session is required to balance the cash drawer and process sales.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "12px 20px",
            fontSize: "0.95rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <PlusCircle size={18} /> Create Session
        </button>
      </div>
    );
  }

  // 2 & 3. Till session creation form
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 4 & 6. Error & Existing Session feedback */}
      {error && (
        <div
          className={isExistingSession ? "alert alert-warning" : "form-error"}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          {isExistingSession && (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <a href="/cashier/sales" className="btn btn-primary btn-sm">
                <ShoppingCart size={14} /> Go to POS Sales
              </a>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsExistingSession(false);
                  router.refresh();
                }}
                className="btn btn-secondary btn-sm"
              >
                Return to Session Screen
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Enter session details: Worker Name */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="worker-name">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <User size={14} /> Cashier / Worker Name
          </span>
        </label>
        <input
          id="worker-name"
          type="text"
          required
          className="form-input"
          placeholder="e.g. John Doe"
          value={workerName}
          onChange={(e) => setWorkerName(e.target.value)}
        />
        <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 4 }}>
          Name of the authenticated cashier responsible for this till session.
        </p>
      </div>

      {/* 3. Enter session details: Opening Amount */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="open-bal">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={14} /> Opening Amount / Cash Drawer Float (CFA)
          </span>
        </label>
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
          Enter the initial floating cash amount in drawer at session start.
        </p>
      </div>

      {/* System auto-captured time indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "var(--gray-50)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.8rem",
          color: "var(--gray-600)",
        }}
      >
        <Clock size={15} style={{ flexShrink: 0, color: "var(--brand-500)" }} />
        <span>Session opening date and time will be automatically recorded by the system.</span>
      </div>

      {/* Form buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          disabled={loading}
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" /> Creating Session...
            </>
          ) : (
            <>
              <CreditCard size={16} /> Create Session
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setError("");
          }}
          className="btn btn-secondary"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }
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
