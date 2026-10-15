"use client";

import { useState } from "react";
import {
  ShieldCheck, Database, Activity, MapPin, Keyboard,
  Sparkles, Phone, Mail, Clock, Wifi, Server, Lock
} from "lucide-react";
import { ShortcutsModal } from "./ShortcutsModal";

export function AppFooter() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      <footer className="app-footer">
        {/* Top system status bar */}
        <div className="app-footer-status-bar">
          <div className="app-footer-status-inner">
            <div className="app-footer-status-group">
              <span className="app-footer-status-item">
                <span className="app-footer-pulse green" />
                <Activity size={12} />
                <span>All Systems Operational</span>
              </span>
              <span className="app-footer-status-sep" />
              <span className="app-footer-status-item">
                <Database size={12} style={{ color: "var(--brand-500)" }} />
                <span>MongoDB Atlas</span>
                <span className="app-footer-status-badge connected">Connected</span>
              </span>
              <span className="app-footer-status-sep" />
              <span className="app-footer-status-item">
                <Lock size={12} style={{ color: "#10b981" }} />
                <span>TLS 1.3 · 256-bit AES</span>
              </span>
              <span className="app-footer-status-sep" />
              <span className="app-footer-status-item">
                <Wifi size={12} style={{ color: "#0284c7" }} />
                <span>API Latency 14ms</span>
              </span>
            </div>

            <div className="app-footer-status-right">
              <span className="app-footer-status-item">
                <MapPin size={12} style={{ color: "#f59e0b" }} />
                <span>AIRFORCE COMPUTER</span>
              </span>
              <span className="app-footer-status-sep" />
              <span className="app-footer-status-item">
                <Server size={12} style={{ color: "var(--gray-400)" }} />
                <span>NIU: M01241678902A</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main footer body */}
        <div className="app-footer-body">
          {/* Brand column */}
          <div className="app-footer-col brand-col">
            <div className="app-footer-brand">
              <div className="app-footer-logo">
                <span>IS</span>
              </div>
              <div>
                <div className="app-footer-brand-name">INVENSMART AI</div>
                <div className="app-footer-brand-tagline">Enterprise Inventory & POS Platform</div>
              </div>
            </div>
            <p className="app-footer-description">
              Intelligent inventory management and point-of-sale solution engineered for growing businesses. Powered by Google Gemini AI.
            </p>
            <span className="app-footer-ai-badge">
              <Sparkles size={11} />
              AI Engine v2.4 · Gemini Pro
            </span>
          </div>

          {/* Quick Links */}
          <div className="app-footer-col">
            <h4 className="app-footer-col-title">Platform</h4>
            <ul className="app-footer-links">
              <li><a href="/admin">Dashboard Overview</a></li>
              <li><a href="/inventory-manager">Inventory Management</a></li>
              <li><a href="/cashier">Point of Sale</a></li>
              <li><a href="/inventory-manager/reports">Reports & Analytics</a></li>
              <li>
                <button
                  onClick={() => setShortcutsOpen(true)}
                  className="app-footer-link-btn-inline"
                >
                  <Keyboard size={12} />
                  Keyboard Shortcuts
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="app-footer-col">
            <h4 className="app-footer-col-title">Support</h4>
            <ul className="app-footer-links">
              <li className="app-footer-contact-item">
                <Phone size={13} style={{ color: "var(--brand-500)", flexShrink: 0 }} />
                <div>
                  <div className="app-footer-contact-label">Helpline</div>
                  <a href="tel:+237651704545" className="app-footer-contact-value">(+237) 651 704 545</a>
                </div>
              </li>
              <li className="app-footer-contact-item">
                <Mail size={13} style={{ color: "var(--brand-500)", flexShrink: 0 }} />
                <div>
                  <div className="app-footer-contact-label">Email Support</div>
                  <a href="mailto:support@maccomputers.cm" className="app-footer-contact-value">support@maccomputers.cm</a>
                </div>
              </li>
              <li className="app-footer-contact-item">
                <Clock size={13} style={{ color: "var(--brand-500)", flexShrink: 0 }} />
                <div>
                  <div className="app-footer-contact-label">Business Hours</div>
                  <span className="app-footer-contact-value">Mon–Sat, 07:30–18:00 WAT</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal / Compliance */}
          <div className="app-footer-col">
            <h4 className="app-footer-col-title">Compliance</h4>
            <ul className="app-footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Data Processing Agreement</a></li>
              <li><a href="#">Security & Compliance</a></li>
            </ul>
            <div className="app-footer-cert-badges">
              <span className="app-footer-cert-badge">
                <ShieldCheck size={11} />
                SOC 2
              </span>
              <span className="app-footer-cert-badge">
                <Lock size={11} />
                ISO 27001
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="app-footer-bottom-bar">
          <div className="app-footer-bottom-inner">
            <span className="app-footer-copyright">
              © {new Date().getFullYear()} <strong>MAC COMPUTERS SARL</strong>. All rights reserved. · v2.4.2 Production
            </span>
            <div className="app-footer-bottom-right">
              <span>Built with ❤ in Cameroon</span>
              <span className="app-footer-bottom-sep">·</span>
              <span>Made for African Commerce</span>
            </div>
          </div>
        </div>
      </footer>

      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
