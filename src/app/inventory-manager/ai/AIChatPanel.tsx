"use client";

import { useState, useRef, useEffect } from "react";
import { askAIQuestion, AIChatMessage } from "@/app/actions/ai";
import { Send, User, Trash2, MessageSquare, Sparkles, TrendingUp, HelpCircle } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Which products are running low on stock?",
  "What are our top-performing products by sales velocity?",
  "What is our total warehouse inventory valuation in CFA?",
  "Recommend urgent supplier replenishment orders",
  "Which products have zero sales recorded?",
  "Give me a high-level inventory health and margin summary",
];

export function AIChatPanel() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(questionOverride?: string) {
    const question = questionOverride || input.trim();
    if (!question || loading) return;

    setError("");
    const userMessage: AIChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await askAIQuestion(question, [...messages, userMessage]);
      if (result.error) {
        setError(result.error);
      } else {
        const aiMessage: AIChatMessage = {
          role: "ai",
          content: result.answer,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="card" style={{ overflow: "hidden", border: "1px solid var(--gray-200)" }}>
      {/* Executive Co-Pilot Header */}
      <div
        className="card-header"
        style={{
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          color: "#fff",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#a5b4fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
              InvenSmart AI Assistant <Sparkles size={14} style={{ color: "#a5b4fc" }} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 1 }}>
              Powered by Google Gemini • Ask anything about your inventory, sales, or purchasing
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Trash2 size={12} /> Clear Chat
            </button>
          )}
          <span
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: "0.72rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ● Live Data Connected
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          height: 380,
          overflowY: "auto",
          padding: "20px",
          background: "var(--gray-50)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 20px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                color: "#4f46e5",
              }}
            >
              <MessageSquare size={22} />
            </div>
            <h3 style={{ fontWeight: 700, color: "var(--gray-900)", margin: "0 0 4px", fontSize: "1rem" }}>
              How can I assist your business analysis today?
            </h3>
            <p style={{ color: "var(--gray-500)", fontSize: "0.82rem", margin: "0 0 18px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
              Ask natural questions about stock positions, slow-moving lines, profit margins, or reorder forecasts in CFA.
            </p>

            {/* Suggested Question Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--gray-300)",
                    borderRadius: 999,
                    padding: "6px 13px",
                    fontSize: "0.76rem",
                    color: "var(--gray-700)",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = "var(--brand-600)";
                    (e.target as HTMLButtonElement).style.color = "var(--brand-700)";
                    (e.target as HTMLButtonElement).style.background = "var(--brand-50)";
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = "var(--gray-300)";
                    (e.target as HTMLButtonElement).style.color = "var(--gray-700)";
                    (e.target as HTMLButtonElement).style.background = "#fff";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background:
                  msg.role === "user"
                    ? "var(--brand-600)"
                    : "#18181b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {msg.role === "user" ? <User size={15} /> : <TrendingUp size={15} />}
            </div>

            {/* Bubble */}
            <div
              style={{
                background: msg.role === "user" ? "var(--brand-600)" : "#ffffff",
                color: msg.role === "user" ? "#ffffff" : "var(--gray-800)",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                maxWidth: "80%",
                fontSize: "0.86rem",
                lineHeight: 1.6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                border: msg.role === "user" ? "none" : "1px solid var(--gray-200)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              <div
                style={{
                  fontSize: "0.65rem",
                  opacity: 0.6,
                  marginTop: 6,
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#18181b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <TrendingUp size={15} />
            </div>
            <div
              style={{
                background: "#fff",
                padding: "12px 18px",
                borderRadius: "14px 14px 14px 4px",
                border: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="loading-spinner" />
              <span style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
                Querying database records &amp; compiling analytics...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="form-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "12px 18px",
          borderTop: "1px solid var(--gray-200)",
          background: "#fff",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about inventory, sales, pricing, or stock reorder planning..."
          disabled={loading}
          className="form-input"
          style={{
            flex: 1,
            margin: 0,
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "0.86rem",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{
            borderRadius: 8,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
}
