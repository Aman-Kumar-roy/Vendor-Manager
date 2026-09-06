# Changelog

All notable changes to the **Vasudha Polymer — Vendor & Transaction Management System (VTMS)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.2.0] - 2026-09-06

### Added
- **Canonical Server-Generated PDF Receipts (`pdfkit`)**:
  - Express REST API (`server/src/services/pdfReceiptService.ts`) is now the sole authoritative source of truth for generating official vector PDF receipts for both Web and Mobile.
  - Added `GET /api/v1/transactions/:id/receipt/pdf` streaming canonical vector PDF receipts with `Content-Disposition: inline; filename="Receipt-RCP-XXXXXXXX.pdf"`.
  - Added `pdfUrl: "/api/v1/transactions/:id/receipt/pdf"` metadata to `GET /api/v1/transactions/:id/receipt` and `POST /api/v1/transactions` responses.
  - In-memory buffer caching keyed by `transactionId + updatedAt` with TTL and automatic invalidation on updates/deletes, delivering sub-millisecond downloads with zero disk dependencies (safe for ephemeral Railway containers).
- **Authentication Fallback for PDF Previews**:
  - Extended `authMiddleware.ts` to accept JWT tokens via `req.query.token` in addition to standard `Authorization: Bearer` headers, enabling direct browser tab previews and native mobile downloads.
- **Deep-Link Direct URL Pasting & SPA Routing**:
  - Enhanced Express static routing (`server/src/app.ts`) with wildcard SPA fallback (`app.get('*')`) serving `client/dist/index.html` for any client routes (`/sellers`, `/reports`, `/receipts`) when accessing directly via pasted URLs on production servers.
  - Intelligent API baseURL resolution (`client/src/services/api.client.ts`) that automatically connects to local backend when developing locally and routes cleanly to relative `/api/v1` in production container deployments.
- **Automated API Test Suite Verification**:
  - Verified 20/20 test cases in `server/src/scripts/testApi.ts` covering authentication, vendor management, strict tank deliveries (`500L`, `1000L`, `2000L`), settlements, PDF generation, and reports.

### Changed
- **Web Receipt Action Flow (`TransactionReceipt.tsx`)**:
  - Replaced browser `window.print()` DOM dump with native server PDF preview and direct download buttons.
  - Added strict dimensions on company logo (`44x44pt`) and SVG icons (`12-14pt`) eliminating image distortion.
- **Company Branding Configuration**:
  - Integrated single root `.env` variables (`VITE_COMPANY_NAME`, `VITE_COMPANY_GST`, `VITE_COMPANY_PHONE`, `VITE_COMPANY_ADDRESS`) into `server/src/config/env.ts` with sensible defaults.

---

## [v1.1.0] - 2026-09-05

### Added
- **Vendor Toggle Logic Parity**:
  - Implemented `requireAdditional` toggle on `POST /api/v1/sellers`: validates Vendor Name, Email Address, and GSTIN when ON; allows vendor creation with Name only when OFF.
- **Role-Based Guards**:
  - Enforced `requireAdmin` middleware on user deletion and transaction update/deletion endpoints.
- **In-Context Success Flow**:
  - Replaced arbitrary redirects with in-context floating toast notifications and voucher confirmation cards.

---

## [v1.0.0] - 2026-09-05

### Added
- Initial Production Release of Vasudha Polymer VTMS:
  - Express REST API backend with modular Controller-Service-Model architecture and MongoDB via Mongoose.
  - React + Vite + Tailwind CSS Web Dashboard.
  - Dynamic financial ledger calculations (`totalDeliveries`, `totalPaid`, `totalDues`).
  - Automated seeding and health check endpoints.
