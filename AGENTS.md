# Vendor Manager & VTMS — AI Agent Instructions (AGENTS.md)

> These rules apply to ALL AI agents working inside this project (`ai-architecture-pack`).

---

## 🔴 Critical Agent Rules

### IMPORTANT RULE: Do NOT Add or Remove Fields Without Explicit Instruction

- Only the following tank sizes are allowed: `500`, `1000`, `2000` (`tank500`, `tank1000`, `tank2000`)
- Do NOT add `tank300`, `tank750`, `tank1500`, or any other tank size
- Do NOT add fields unless explicitly told
- Always update documentation when fields or project structure change
- If you think a field is missing, ASK first – do NOT add it on your own

---

### 1. Database: MongoDB via `mongoose` ONLY
- Always use **`mongoose`** models via `server/src/config/db.ts` (`connectMongoDB()`).
- Database URI configured via `MONGODB_URI` in `.env`.
- Store core collections: `User`, `Seller`, `Transaction`.
- Compute dynamic totals (`totalDeliveries`, `totalPaid`, `totalDues`) in controllers — NEVER hardcode or store totals in database documents.

### 2. Server Architecture: Express Controller Pattern (`server/src/controllers/`)
- Express REST API follows modular Controller-Service-Model architecture.
- Routes mapping in `server/src/routes/` forward to controller class methods in `server/src/controllers/`.
- Handlers:
  - `authController.ts` (`/api/v1/auth`)
  - `sellerController.ts` (`/api/v1/sellers`)
  - `transactionController.ts` (`/api/v1/transactions`)
  - `reportController.ts` (`/api/v1/reports`)

### 3. Workspace Directory Layout & Responsibilities
- **`server/`**: Express + TypeScript REST API backend (`http://localhost:5000/api/v1`).
- **`client/`**: React + Vite + Tailwind web dashboard.
- **`vtms-app/`**: Cross-platform mobile app built with **React Native (Expo)** + **TypeScript**. Includes `WebMobileFrame` device simulator preview for web browsers.
- **`api-tests/`**: Playwright API test automation suite.
- **`resume/`**: Master career documents, Markdown, HTML, PDF exports.

### 4. Environment Configuration: Single Root `.env`
- Use a **single `.env` file at the project root** (`.env`).
- Environment Variables: `MONGODB_URI`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `VITE_API_URL`.
- Company Invoice / Receipt Variables: `VITE_COMPANY_NAME`, `VITE_COMPANY_GST`, `VITE_COMPANY_PHONE`, `VITE_COMPANY_ADDRESS`.

### 5. Mobile Application (`vtms-app`) Standards
- React Native (Expo) with TypeScript.
- Uses the same Express backend REST API (`/api/v1`) as the web client.
- `WebMobileFrame` simulator wrapper provides Spacez-style interactive mobile device preview on web without affecting native iOS/Android builds.
- Seamless fallback data mode in `AuthContext` and API clients if backend API is offline.

### 6. Forms, Light/Dark Modes & UX
- All `<form>` elements MUST have `noValidate`.
- Use React state for field-level errors (red text underneath fields).
- Never use native browser validation popups or `window.alert()`.
- Never use native browser `<input type="date">` or `<input type="month">` date pickers that display OS light-mode popups. Always use custom dark glassmorphism components (`CustomDatePicker`, `CustomMonthPicker`).
- Custom pickers and dropdowns (`CustomDatePicker`, `CustomMonthPicker`, Linked Delivery Selector) must implement intelligent upward opening (`openUpward`) when space below the viewport is constrained (< 340px).
- Modal bodies must include scrollable containers (`max-h-[calc(90vh-9rem)] overflow-y-auto`) so child inputs and pickers are never cut off on mobile devices.
- Receipt preview modals must use vertical `flex-col` containers to prevent side-by-side squishing on mobile screens.
- Ensure high contrast in both Light Mode and Dark Mode.
- Table rows MUST be clickable with `cursor-pointer` and hover highlight. Action buttons MUST include `e.stopPropagation()`.
- Main table rows must remain uncluttered: do NOT display tank count breakdown pills directly inside rows or under seller names; users click the row to inspect full tank distributions in `OrderDetailsModal`.

### 7. Mobile Responsiveness & Dual-Layout Architecture
- All table views (`SellerTable`, `TransactionTable`, `ReceiptsPage`, `ReportsPage`) must implement a dual-layout pattern:
  - Mobile Card View (`md:hidden`): Touch-friendly, high-contrast cards showing clear metrics, status pills, and direct action buttons without horizontal cut-off.
  - Desktop Table View (`hidden md:block`): Comprehensive multi-column data grid.
- Network Mobile Access: `api.client.ts` uses dynamic hostname fallback to `/api/v1` so Vite proxies requests seamlessly when accessing the web client from mobile phones over the local Wi-Fi network.

### 8. Currency & Financial Precision
- Server calculations: Dynamic totals and monetary fields must be rounded to 2 decimal places (`Math.round(val * 100) / 100`) in controllers.
- Client formatting: All currency formatters (`formatCurrency`, `fmt`) must specify `minimumFractionDigits: 2, maximumFractionDigits: 2` to guarantee exact alignment to the paisa across summary cards, table rows, and receipt vouchers.

### 9. Automated API Testing
- All endpoints must pass `npm run test:api` before deployment.

