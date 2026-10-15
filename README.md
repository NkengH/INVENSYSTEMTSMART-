<div align="center">

  <img src="public/logo.png" alt="INVENSMART AI Logo" width="180" style="border-radius: 12px; margin-bottom: 12px;" />

  # INVENSMART AI
  ### Enterprise AI-Powered Inventory Intelligence & Point-of-Sale (POS) Platform

  [![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.6-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9.9-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Google Gemini AI](https://img.shields.io/badge/Gemini_AI-2.4_Pro-8E75C4?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Vitest](https://img.shields.io/badge/Tested_with-Vitest_5-729B1B?style=for-the-badge&logo=vitest)](https://vitest.dev/)

  <p align="center">
    <strong>Smart Inventory, Better Decisions.</strong> Engineered for commercial retail and warehouse operations, featuring automated till sessions, real-time stock issuance, printable receipts, and an AI co-pilot.
  </p>

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Seeding](#database-seeding)
  - [Demo Accounts](#demo-accounts)
- [Project Directory Structure](#-project-directory-structure)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Available Scripts](#-available-scripts)
- [Testing Suite](#-testing-suite)
- [Documentation & Deep Dives](#-documentation--deep-dives)

---

## 🚀 Overview

**INVENSMART AI** is a full-stack, enterprise-grade inventory management and point-of-sale system tailored for retail and warehouse operations. It eliminates manual discrepancies, stockouts, and till reconciliation delays with real-time stock movement audits, cash shift tracking, and predictive inventory analytics powered by Google Gemini AI.

---

## ✨ Key Features

### 🛒 Point of Sale (POS) & Cashier Register
- **Interactive POS Terminal:** Touch- and click-friendly product category layout with live cart calculations.
- **Tender & Change Calculator:** Multi-currency / quick-tender cash calculation with support for Cash, Mobile Money (MTN MoMo, Orange Money), and Bank Transfers.
- **Till Shift Controls:** Opening float entry, real-time sales reconciliation, discrepancy calculations (surpluses/shortages), and worker session assignments.
- **Thermal Receipts:** Ready-to-print formatted receipt previews with business header, NIU, itemized breakdown, and tax summaries.
- **Audio Feedback:** Synthesized Web Audio API beeps for product barcode scans and transaction success.

### 📦 Warehouse & Inventory Intelligence
- **Comprehensive Catalog:** Pre-seeded with 100 popular electronic products spanning Laptops, Phones, Storage, Audio, and Accessories.
- **Warehouse Purchase Orders (PO):** Multi-item order creation, supplier status tracking (`Pending`, `Received`, `Cancelled`), and automated stock increment upon delivery.
- **Internal Issuance Flow:** Move stock safely between central storage and sales counters with authorized issuer and receiver logging.
- **Multi-Factor Stock Adjustments:** Instant manual count updates with mandatory reason codes (Breakage, Expiry, Audit Count, Theft) generating immutable `StockMovement` records.
- **Automated Stock Alerts:** Real-time visual warnings for items below minimum stock threshold (`<= minimumStock`) or out of stock.

### 🤖 Google Gemini AI Co-Pilot
- **Conversational Analytics:** Ask questions about inventory health, fast-moving items, and reorder urgency via natural language.
- **Automated Reorder Forecasting:** AI analysis predicting product runout dates based on current sales velocity and stock level ratios.
- **Model Fallback Cascade:** Resilient multi-tier query handler with fallback options across `gemini-2.5-flash`, `gemini-2.0-flash`, and `gemini-1.5-flash`.

### 🛡️ Security, Audit & UX
- **Strict RBAC Middleware:** Server-side route guards enforcing permission boundaries across Administrators, Inventory Managers, and Cashiers.
- **Comprehensive Audit Trail:** Logs all critical actions (logins, price modifications, stock adjustments, till sessions).
- **Global Quick Search (`Ctrl + K`):** Instant modal search across products, navigation routes, and common actions.
- **Keyboard Shortcuts (`?`):** Modal overview of POS and navigation accelerator keys.
- **Dark & Light Mode:** System-adaptive theme engine with high-contrast accessibility.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
    subgraph Client ["Frontend Presentation Layer"]
        UI["Next.js App Router (React 19 Server/Client Components)"]
        POS["Cashier POS & Receipts"]
        Header["AppHeader (Live Search, Notifications, Theme)"]
        Footer["AppFooter (System Telemetry & Status)"]
    end

    subgraph Controller ["Controller & Security Layer"]
        Edge["Next.js Middleware (Session & RBAC Guard)"]
        API["API Route Handlers (/api/auth, /api/notifications)"]
        Actions["Server Actions (sales, adjustments, purchases, ai)"]
    end

    subgraph Model ["Data & Intelligence Layer"]
        DB["MongoDB Atlas + Mongoose 9.9"]
        Gemini["Google Gemini Pro AI Engine"]
    end

    UI -->|"User Actions"| Edge
    Edge --> Controller
    Controller -->|"Mutations & Queries"| DB
    Actions -->|"Prompts & Context"| Gemini
```

| Domain | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **Library** | React 19.2.6, TypeScript 5.9.3 |
| **Database** | MongoDB via Mongoose 9.9.4 |
| **Styling** | Vanilla CSS Design System + Tailwind CSS 4 |
| **Authentication** | `bcrypt` password hashing + Signed HTTP-Only JWT cookies (`jose`) |
| **AI Engine** | Google Gemini (`@google/generative-ai`) |
| **Data Visualization** | Recharts 3.10 |
| **Testing** | Vitest 5.0, Testing Library React, Supertest |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** 18.18+ (Node 20+ recommended)
- **MongoDB** instance (Local MongoDB server or MongoDB Atlas URI)
- **Google Gemini API Key** (Get free key from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NkengH/INVENSYSTEMTSMART-.git
   cd ai-inventory-management-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/ai_inventory

# Secure JWT Secret for Session Cookies
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters

# Google Gemini AI API Key
GEMINI_API_KEY=your_google_gemini_api_key
```

### Database Seeding

Start the development server and visit the setup endpoint to automatically initialize demo users and **100 popular electronic products**:

```bash
npm run dev
```

Then visit in your browser:
```
http://localhost:3000/api/setup
```

*(You will receive a JSON confirmation showing created/verified users and catalog count).*

---

### 🔑 Demo Accounts

The setup endpoint automatically configures 3 distinct test accounts:

| Role | Username | Password | Default Redirect |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | `/admin` |
| **Inventory Manager** | `manager` | `manager123` | `/inventory-manager` |
| **Cashier** | `cashier` | `cashier123` | `/cashier` |

---

## 📁 Project Directory Structure

```
ai-inventory-management-system/
├── public/                     # Static media assets & logo (logo.png)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/            # Server Actions (ai, sales, till, products, adjustments...)
│   │   ├── admin/              # Administrator portal (users, audit logs, roles, AI)
│   │   ├── api/                # REST endpoints (auth, setup, notifications, health)
│   │   ├── cashier/            # POS workspace (sales register, till shifts, receipts)
│   │   ├── change-password/    # Forced / self-service password reset
│   │   ├── inventory-manager/  # Stock management (inventory, POs, issuance, reports)
│   │   ├── globals.css         # Global CSS variables, theme tokens, and component styles
│   │   ├── layout.tsx          # Root shell layout with ThemeProvider
│   │   └── page.tsx            # Login gateway page
│   ├── components/             # Reusable UI components & modals
│   │   ├── AppHeader.tsx       # Live status topbar, search, notifications, theme toggle
│   │   ├── AppFooter.tsx       # Telemetry bar, system status, keyboard shortcuts trigger
│   │   ├── BrandLogo.tsx       # Brand logo component
│   │   ├── DashboardLayout.tsx # Role-aware responsive navigation sidebar
│   │   ├── QuickSearchModal.tsx# Global Ctrl+K command palette
│   │   └── ShortcutsModal.tsx  # Keyboard shortcuts cheatsheet
│   ├── db/                     # Database connection & Mongoose schema models
│   ├── lib/                    # Security, auth, RBAC guards, audio & format utilities
│   ├── proxy.ts                # Next.js route guard middleware
│   ├── scripts/                # Database seed files (100 popular electronics)
│   └── tests/                  # Vitest automated test suites
├── EXPLAINED.md                # Detailed MVC architecture explanation
├── SYSTEM_ARCHITECTURE_SUMMARY.md # Deep technical architecture summary
├── package.json
├── tsconfig.json
└── vitest.config.mts           # Vitest configuration
```

---

## 🔒 Role-Based Access Control (RBAC)

| Capability / Resource | Administrator | Inventory Manager | Cashier |
| :--- | :---: | :---: | :---: |
| **Cashier POS & Register Checkout** | ✅ | ✅ | ✅ |
| **Open & Close Till Shifts** | ✅ | ✅ | ✅ |
| **Receipt History & Reprints** | ✅ | ✅ | ✅ |
| **View Inventory Levels** | ✅ | ✅ | ❌ |
| **Record Stock Adjustments** | ✅ | ✅ | ❌ |
| **Warehouse Purchase Orders (POs)** | ✅ | ✅ | ❌ |
| **Internal Stock Issuance** | ✅ | ✅ | ❌ |
| **AI Demand Forecasting & Chat** | ✅ | ✅ | ❌ |
| **Analytics & Financial Reports** | ✅ | ✅ | ❌ |
| **User & Staff Account Management** | ✅ | ❌ | ❌ |
| **Audit Logs & Security Inspection** | ✅ | ❌ | ❌ |

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Launches local server with Webpack at `http://localhost:3000` |
| **Build** | `npm run build` | Builds optimized production bundle |
| **Start** | `npm run start` | Runs the compiled production application |
| **Lint** | `npm run lint` | Runs ESLint over project source files |
| **Type Check** | `npm run typecheck` | Validates TypeScript types across the entire project |
| **Test** | `npm run test` | Runs all Vitest test suites once |
| **Test Verbose** | `npm run test:verbose` | Runs tests displaying individual suite results |
| **Test Watch** | `npm run test:watch` | Starts Vitest in interactive watch mode |
| **Test Coverage** | `npm run test:coverage` | Computes test coverage using `@vitest/coverage-v8` |

---

## 🧪 Testing Suite

Automated testing is powered by **Vitest** with in-memory database mocks and isolated unit tests.

Run tests:
```bash
npm run test
```

### Coverage Highlights:
- **`src/tests/actions/`**: Unit tests for Server Actions (Sales, Tills, Products, Purchases, Refunds, Adjustments, Notifications).
- **`src/tests/lib/`**: Role-based access control (`rbac.ts`), session verification, and currency formatting (`format.ts`).
- **`src/tests/db/`**: Schema validations, unique constraints, and schema hook tests.

---

## 📖 Documentation & Deep Dives

For further technical reading, refer to the included guides:
- [EXPLAINED.md](EXPLAINED.md) — Comprehensive breakdown of the project through the **Model-View-Controller (MVC)** design pattern.
- [SYSTEM_ARCHITECTURE_SUMMARY.md](SYSTEM_ARCHITECTURE_SUMMARY.md) — Deep architectural document covering database models, security, and component breakdown.

---

## 📄 License

This project is proprietary and built for enterprise commercial inventory and POS management. All rights reserved.
