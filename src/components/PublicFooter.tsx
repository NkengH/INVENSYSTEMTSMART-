"use client";

import { ShieldCheck, MapPin, Phone, Sparkles } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        {/* Left: Brand + location */}
        <div className="public-footer-left">
          <img
            src="/logo.png"
            alt="INVENSMART"
            style={{
              height: 28,
              width: "auto",
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
          <div className="public-footer-brand-info">
            <span className="public-footer-brand-name">INVENSMART AI</span>
            <span className="public-footer-brand-sep">·</span>
            <span className="public-footer-location">
              <MapPin size={11} style={{ color: "#f59e0b" }} />
              Douala, Cameroon
            </span>
          </div>
        </div>

        {/* Center: Legal */}
        <div className="public-footer-center">
          <span>© {new Date().getFullYear()} <strong>MAC COMPUTERS SARL</strong></span>
          <span className="public-footer-sep">·</span>
          <a href="#" className="public-footer-link">Privacy Policy</a>
          <span className="public-footer-sep">·</span>
          <a href="#" className="public-footer-link">Terms</a>
        </div>

        {/* Right: Security + contact */}
        <div className="public-footer-right">
          <span className="public-footer-secure">
            <ShieldCheck size={13} style={{ color: "#10b981" }} />
            TLS 1.3 Encrypted
          </span>
          <span className="public-footer-sep">·</span>
          <a href="tel:+237651704545" className="public-footer-link">
            <Phone size={11} />
            (+237) 651 704 545
          </a>
          <span className="public-footer-sep">·</span>
          <span className="public-footer-ai-badge">
            <Sparkles size={10} />
            AI Powered
          </span>
        </div>
      </div>
    </footer>
  );
}
