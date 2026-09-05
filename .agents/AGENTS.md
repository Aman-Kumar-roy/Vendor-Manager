# Vendor Manager & VTMS — AI Agent Instructions (AGENTS.md)

> These rules apply to ALL AI agents working inside this project (`vasudha-polymer`).

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
- **`app/`**: Cross-platform mobile app built with **React Native (Expo SDK 50)** + **TypeScript**.
- **`api-tests/`**: Automated API test suite (`npm run test:api`).
- **`resume/`**: Master career documents, Markdown, HTML, PDF exports.

### 4. Environment Configuration: Single Root `.env`
- Use a **single `.env` file at the project root** (`.env`).
- Environment Variables: `MONGODB_URI`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `VITE_API_URL`.
- Company Invoice / Receipt Variables: `VITE_COMPANY_NAME`, `VITE_COMPANY_GST`, `VITE_COMPANY_PHONE`, `VITE_COMPANY_ADDRESS`.

### 5. Mobile Application (`app/`) Standards
- React Native (Expo SDK 50) with TypeScript.
- Uses the same Express backend REST API (`/api/v1`) as the web client.
- Dynamic baseURL resolution in `app/src/api/client.ts` auto-detects Metro host IP to ensure physical phones and emulators seamlessly connect to the backend over LAN Wi-Fi.
- Notch & Status Bar: Always wrap top headers with `useSafeAreaInsets()` from `react-native-safe-area-context` to prevent notch overlap.
- Header `< Back` Button: Root screens (`Dashboard`, `Sellers`, `Transactions`, `Orders`, `Receipts`, `Reports`) must NEVER display `< Back`. Sub-screens safely fall back to `Dashboard` if `navigation.canGoBack()` is false.

### 6. Transaction Creation Flow & In-Context Success Experience
- **In-Context Creation Modal**: Both web and mobile use dedicated in-context creation modals (`AddTransactionModal.tsx`) for `DELIVERY` and `PAYMENT` modes.
- **NO Automatic Redirects**: After successful delivery or payment creation, DO NOT navigate or redirect the user to an unrelated screen (`navigation.goBack()` or arbitrary screen switch).
- **In-Context Experience**: Keep the user in their active context, show a floating toast (`"Transaction created successfully."`), and present an in-place success confirmation card:
  - Checkmark status badge
  - Official Server Receipt Voucher Number (`RCP-XXXXXXXX`)
  - Three distinct action buttons:
    1. `View Official Receipt` — Opens `ReceiptModal` displaying the server-generated voucher
    2. `+ Record Another` — Resets form inputs while keeping screen ready for the next entry
    3. `Done` — Gracefully exits/closes modal and refreshes data in-place only when user deliberately chooses to do so
- **Pre-Submission Live Summary**: Display live vendor name, itemized unit counts (strictly `500L`, `1000L`, `2000L`), and total amount before submission.

### 7. Correct Business Logic & Terminology (Selling Units)
- **Core Concept**: We are selling polymer water storage tank units to sellers/vendors.
- **Terminology**: Never use "Volume" or "Report" in transaction forms. Use "Product / Item: Polymer Water Storage Tanks" and "Units / Quantity".
- **Strict Capacities**: Strictly limited to `500L`, `1,000L`, and `2,000L` tanks (`tank500`, `tank1000`, `tank2000`).

### 8. Server-Generated Official Receipts (Web & Mobile Parity)
- **Single Source of Truth**: The mobile application MUST use the same server-generated receipt format as the web application.
- `POST /api/v1/transactions` returns `201 Created` with `{ success: true, message: "Transaction created successfully.", transaction, receipt, data: { ...transaction, transaction, receipt } }`.
- `GET /api/v1/transactions/:id/receipt` provides the official receipt voucher by transaction ID.
- Receipts include: Receipt voucher number (`RCP-XXXXXXXX`), issue date, company credentials from `.env`, vendor details, itemized product breakdown, and digital verification seal.
- Mobile displays this via `ReceiptModal.tsx`—do NOT duplicate or create separate mobile-only receipt generation logic.

### 9. Seller Toggle Logic & In-Place Creation (Web & Mobile Parity)
- Both web (`AddSellerModal.tsx`) and mobile (`AddSellerModal.tsx` / `AddSellerScreen.tsx`) must implement the "Require additional fields" switch toggle:
  - **When ON (Default)**: Validates that **Vendor Name**, **Email Address** (valid email format), and **GSTIN** (15 alphanumeric characters) are strictly mandatory before submit. Phone and address are optional.
  - **When OFF**: Only **Vendor Name** is mandatory. Email (valid format if provided), GSTIN, Phone, and Address are optional.
  - **Visual Indicator**: Email Address displays a red asterisk (`*`) when ON, and `(Optional)` when OFF. Phone and Address are labeled `(Optional)`.
- **Server Enforcement (Single Source of Truth)**:
  - `POST /api/v1/sellers` accepts `requireAdditional: boolean` (defaults to `true` if omitted or null/undefined).
  - Backend enforces the same validation rules and returns `201 Created` with `{ success: true, message: "Seller created successfully.", seller, data: { ...seller, seller } }`.
  - When validation fails, server returns `400 Bad Request` with `{ success: false, error: "...", message: "..." }`.
- **In-Context Experience**: Vendor creation displays a floating success toast (`"Seller created successfully."`) and immediately updates/refreshes the vendor list in-place without page reload or redirection.

### 10. Clean Production Authentication (No Demo UI)
- The Admin Login screens on both Web and Mobile must be clean production authentication experiences.
- Demo boxes, auto-fill credentials buttons, and placeholder test credentials must NOT be present in production UI.

### 11. Currency & Financial Precision
- Server calculations: Dynamic totals and monetary fields must be rounded to 2 decimal places (`Math.round(val * 100) / 100`) in controllers.
- Client formatting: All currency formatters (`formatCurrency`, `fmtCurrency`, `fmt`) must specify `minimumFractionDigits: 2, maximumFractionDigits: 2` to guarantee exact alignment to the paisa.

### 12. Automated API Testing
- All endpoints must pass `npm run test:api` before deployment.

### 13. Real-Time Data & Shimmer Skeleton Loading (Zero Stale Caching)
- **Live Real-Time Data**: All screens in the mobile app must query and display live, real-time data from the Express REST API on focus (`useFocusEffect`) and pull-to-refresh.
- **NO Stale In-Memory Caching**: Do NOT use artificial in-memory caches that hide live database operations or delay monetary updates.
- **Shimmer / Skeleton Experience**: While data is loading:
  - Do NOT display blank white screens or unstyled spinners that collapse layout.
  - Render dark-themed Shimmer Skeletons (`src/components/Shimmer.tsx`) matching screen structure (`SellerCardSkeleton`, `TransactionCardSkeleton`, `ReceiptCardSkeleton`, `DashboardSkeleton`, `ReportsSkeleton`, `SellerDetailSkeleton`).
- **Dark Window OS Background**: `app.json` enforces `"userInterfaceStyle": "dark"` and `"backgroundColor": "#080d1a"` for Android and iOS native window containers to prevent white edge flashing during slide transitions.
