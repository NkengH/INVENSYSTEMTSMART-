"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, Search, ChevronRight, Home, Keyboard, Sparkles,
  Sun, Moon, CheckCircle, AlertTriangle, Info, Trash2, ArrowRight
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { QuickSearchModal } from "./QuickSearchModal";
import { ShortcutsModal } from "./ShortcutsModal";
import { sounds } from "@/lib/sound";

export interface LiveNotificationItem {
  id: string;
  type: "warning" | "success" | "info" | "error";
  title: string;
  message: string;
  time: string;
  timestamp?: number;
  read: boolean;
  link?: string;
  category?: "inventory" | "till" | "sales" | "ai" | "system";
}

const ROUTE_LABELS: Record<string, string> = {
  admin: "Administrator",
  users: "User Accounts",
  roles: "Roles & Permissions",
  audit: "Audit Logs",
  ai: "AI Assistant",
  "inventory-manager": "Inventory Manager",
  products: "Product Catalog",
  inventory: "Inventory Records",
  issuance: "Issue Stock",
  movements: "Stock Movements",
  reports: "Analytics & Reports",
  cashier: "Cashier POS",
  sales: "Sales Register",
  till: "Till Session",
  refunds: "Refunds & Returns",
  receipts: "Receipt Lookup",
};

export function AppHeader({
  username,
  role,
}: {
  username: string;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Modals state
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Live Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifRef = useRef<HTMLDivElement>(null);

  // Live Clock state
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Notifications
  const fetchLiveNotifications = useCallback(
    async (isInitial = false) => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          const storedRead =
            typeof window !== "undefined"
              ? localStorage.getItem(`inv_read_notifications_${username || "user"}`)
              : null;
          const readIds: string[] = storedRead ? JSON.parse(storedRead) : [];

          const storedDismissed =
            typeof window !== "undefined"
              ? localStorage.getItem(`inv_dismissed_notifications_${username || "user"}`)
              : null;
          const dismissedIds: string[] = storedDismissed ? JSON.parse(storedDismissed) : [];

          const updated: LiveNotificationItem[] = data.notifications
            .filter((n: LiveNotificationItem) => !dismissedIds.includes(n.id))
            .map((n: LiveNotificationItem) => ({
              ...n,
              read: n.read || readIds.includes(n.id),
            }));

          setNotifications((prev) => {
            if (!isInitial) {
              const prevIds = new Set(prev.map((p) => p.id));
              const hasNewAlert = updated.some((n) => !n.read && !prevIds.has(n.id));
              if (hasNewAlert) {
                sounds.playNotificationChime();
              }
            }
            return updated;
          });
        }
      } catch (err) {
        // Silently catch background polling errors
      }
    },
    [username]
  );

  // Initial fetch and polling loop
  useEffect(() => {
    fetchLiveNotifications(true);

    // Poll every 10 seconds for real-time background transactions
    const pollInterval = setInterval(() => {
      fetchLiveNotifications(false);
    }, 10000);

    // Tab focus / visibility listener
    function handleVisibilityOrFocus() {
      if (document.visibilityState === "visible") {
        fetchLiveNotifications(false);
      }
    }

    // Custom events dispatched by app actions (sales, till, adjustments, issuance)
    function handleAppEvent() {
      fetchLiveNotifications(false);
    }

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("inventory:change", handleAppEvent);
    window.addEventListener("notifications:refresh", handleAppEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("inventory:change", handleAppEvent);
      window.removeEventListener("notifications:refresh", handleAppEvent);
    };
  }, [fetchLiveNotifications]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, idx) => {
    const href = "/" + pathSegments.slice(0, idx + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = idx === pathSegments.length - 1;
    return { href, label, isLast };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    const storedRead = localStorage.getItem(`inv_read_notifications_${username || "user"}`);
    const readIds: string[] = storedRead ? JSON.parse(storedRead) : [];
    const newReadIds = Array.from(new Set([...readIds, ...unreadIds]));
    localStorage.setItem(`inv_read_notifications_${username || "user"}`, JSON.stringify(newReadIds));

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead", ids: unreadIds }),
      });
    } catch {}
  }

  async function handleNotificationClick(n: LiveNotificationItem) {
    if (!n.read) {
      const storedRead = localStorage.getItem(`inv_read_notifications_${username || "user"}`);
      const readIds: string[] = storedRead ? JSON.parse(storedRead) : [];
      const newReadIds = Array.from(new Set([...readIds, n.id]));
      localStorage.setItem(`inv_read_notifications_${username || "user"}`, JSON.stringify(newReadIds));

      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );

      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markRead", id: n.id }),
        });
      } catch {}
    }

    if (n.link) {
      setNotifOpen(false);
      router.push(n.link);
    }
  }

  function clearAll() {
    const allIds = notifications.map((n) => n.id);
    const storedDismissed = localStorage.getItem(`inv_dismissed_notifications_${username || "user"}`);
    const dismissedIds: string[] = storedDismissed ? JSON.parse(storedDismissed) : [];
    const newDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
    localStorage.setItem(
      `inv_dismissed_notifications_${username || "user"}`,
      JSON.stringify(newDismissed)
    );
    setNotifications([]);
  }

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <>
      <header className="app-header">
        {/* LEFT: Dynamic Breadcrumbs & Live Time */}
        <div className="app-header-left">
          <nav aria-label="Breadcrumb" className="app-breadcrumbs">
            <Link href="/" className="app-breadcrumb-item app-breadcrumb-home" title="Home">
              <Home size={15} />
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="app-breadcrumb-segment">
                <ChevronRight size={13} className="app-breadcrumb-separator" />
                {crumb.isLast ? (
                  <span className="app-breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="app-breadcrumb-item">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Live Date / Time Badge */}
          {currentTime && (
            <div className="app-clock-badge">
              <span className="app-clock-time">{currentTime}</span>
              <span className="app-clock-divider">•</span>
              <span className="app-clock-date">{currentDate}</span>
            </div>
          )}
        </div>

        {/* CENTER: Quick Search Trigger & AI Status */}
        <div className="app-header-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="app-search-trigger"
            title="Search products and navigation (Ctrl+K)"
          >
            <Search size={14} className="app-search-icon" />
            <span className="app-search-text">Quick search or command...</span>
            <kbd className="app-search-kbd">Ctrl K</kbd>
          </button>

          <div className="app-ai-status-pill" title="AI Inventory Intelligence Core Online">
            <span className="app-pulse-dot" />
            <Sparkles size={12} className="app-ai-icon" />
            <span>AI Core Active</span>
          </div>
        </div>

        {/* RIGHT: Notifications, Shortcuts, Theme, User Pill */}
        <div className="app-header-right">
          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="app-header-btn"
            title="Keyboard Shortcuts Cheatsheet"
          >
            <Keyboard size={16} />
          </button>

          {/* Notifications Dropdown */}
          <div className="app-header-dropdown-container" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="app-header-btn"
              title="Real-time Live Notifications"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="app-notif-badge">{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="app-notif-dropdown">
                {/* Header */}
                <div className="app-notif-header">
                  <div className="app-notif-title">
                    <span>Notifications</span>
                    {unreadCount > 0 ? (
                      <span className="badge badge-blue" style={{ fontSize: "0.68rem" }}>
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="app-notif-live-badge">
                        <span className="app-pulse-dot" style={{ width: 6, height: 6 }} />
                        Live
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="app-notif-mark-all">
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        title="Clear all notifications"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--gray-400)",
                          display: "flex",
                          alignItems: "center",
                          padding: 2,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="app-notif-filters">
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setFilter("all")}
                      className={`app-notif-filter-btn ${filter === "all" ? "active" : ""}`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setFilter("unread")}
                      className={`app-notif-filter-btn ${filter === "unread" ? "active" : ""}`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                  <span className="app-notif-live-badge" title="Live Auto-Sync Active">
                    <span className="app-pulse-dot" style={{ width: 6, height: 6 }} />
                    Auto-Sync 10s
                  </span>
                </div>

                {/* Notifications List */}
                <div className="app-notif-list">
                  {displayedNotifications.length === 0 ? (
                    <div className="app-notif-empty">
                      <CheckCircle size={24} style={{ color: "var(--success)" }} />
                      <span style={{ fontWeight: 600 }}>All caught up!</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>
                        {filter === "unread"
                          ? "No unread notifications at the moment."
                          : "No active alerts or stock warnings."}
                      </span>
                    </div>
                  ) : (
                    displayedNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`app-notif-item ${!n.read ? "unread" : ""}`}
                      >
                        <div className="app-notif-item-icon">
                          {n.type === "warning" && <AlertTriangle size={15} color="#f59e0b" />}
                          {n.type === "error" && <AlertTriangle size={15} color="#ef4444" />}
                          {n.type === "success" && <CheckCircle size={15} color="#10b981" />}
                          {n.type === "info" && <Info size={15} color="#6366f1" />}
                        </div>
                        <div className="app-notif-item-content">
                          <div className="app-notif-item-title">
                            <span>{n.title}</span>
                            {n.link && <ArrowRight size={11} style={{ opacity: 0.5 }} />}
                          </div>
                          <div className="app-notif-item-msg">{n.message}</div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: 4,
                            }}
                          >
                            <span className="app-notif-item-time">{n.time}</span>
                            {n.category && (
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  textTransform: "uppercase",
                                  fontWeight: 700,
                                  color: "var(--gray-400)",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {n.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="app-header-btn"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
          </button>

          {/* User Quick Info */}
          <div className="app-header-user-pill">
            <div className="app-header-avatar">
              {(username || "US").slice(0, 2).toUpperCase()}
            </div>
            <div className="app-header-user-details">
              <span className="app-header-username">{username}</span>
              <span className="app-header-role">{role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
