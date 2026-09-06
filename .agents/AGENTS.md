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
- **`app/`**: (Independent external repository) Cross-platform mobile app built with **React Native (Expo SDK 50)** + **TypeScript**.
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

### 8. Server-Generated Official Receipts & Canonical PDF Architecture (Web & Mobile Parity)
- **Single Source of Truth**: The Express REST API backend (`server/src/services/pdfReceiptService.ts`) is the **sole authoritative generator** of official PDF receipts for both Web and Mobile. Neither client may generate, lay out, or render receipts independently.
- **REST Endpoints**:
  - `POST /api/v1/transactions` returns `201 Created` with `{ success: true, message: "Transaction created successfully.", transaction, receipt, data: { ...transaction, transaction, receipt } }`.
  - `GET /api/v1/transactions/:id/receipt` provides receipt JSON metadata including `pdfUrl: "/api/v1/transactions/:id/receipt/pdf"`.
  - `GET /api/v1/transactions/:id/receipt/pdf` streams the canonical vector PDF (`Content-Type: application/pdf`, `Content-Disposition: inline; filename="Receipt-RCP-XXXXXXXX.pdf"`).
- **Authentication & Query Param Fallback**:
  - In addition to standard `Authorization: Bearer <token>` headers, `authMiddleware.ts` allows extracting JWT tokens from `req.query.token` to enable direct browser PDF tab previews and native mobile file downloads.
- **Strict Vector Sizing & Formatting (No Blown-Up Assets)**:
  - Logo is strictly bound to a `44x44pt` container with `fit: [44, 44]` and rounded frame, completely preventing image stretching or blowup.
  - All icons (Building, Droplets, CheckCircle) are vector-bounded with exact point dimensions (`12-14pt`) avoiding SVG intrinsic 100% width expansion.
  - Tanks delivered are strictly limited to `500L`, `1000L`, and `2000L` (`tank500`, `tank1000`, `tank2000`).
  - Dynamic currency formatting is locked to exact paisa precision (`Rs. XX,XXX.00`).
- **Cloud & Container-Safe Caching**:
  - Utilizes an in-memory buffer cache keyed by `transactionId + updatedAt` with automatic invalidation on updates/deletes, delivering sub-millisecond response on repeated downloads with zero disk dependencies (100% safe for ephemeral cloud/Railway containers).
- **Client Consumption**:
  - **Web (`TransactionReceipt.tsx`)**: "Download PDF" and "Print / PDF" buttons directly open or download the server-generated PDF.
  - **Mobile (`ReceiptModal.tsx`)**: Completely removed client-side HTML templates. Calls `downloadReceiptPdfApi` to fetch the server PDF, then uses `expo-print` (`Print.printAsync({ uri })`) and `expo-sharing` (`Sharing.shareAsync(uri)`). Web Receipt = Mobile Receipt = Same Server PDF.

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

### 13. Real-Time Data, TanStack Query Caching & Shimmer Skeleton Loading
- **Single Source of Truth**: The Express REST API backend remains the authoritative source of truth. Dynamic ledger calculations (`totalDeliveries`, `totalPaid`, `totalDues`) are never client-computed.
- **TanStack React Query Cache Architecture (`@tanstack/react-query`)**:
  - Global `QueryClient` configured in `app/src/query/queryClient.ts` with `staleTime: 2min` (5min for vendor lists), `gcTime: 15min`, and automatic deduplication.
  - **Stale-While-Revalidate (SWR)**: Cached queries render immediately on screen navigation for a seamless, flicker-free experience while fresh data revalidates in the background.
  - **Targeted Cache Invalidation**: All mutations (vendor creation, delivery recording, payment settlements) must invoke targeted invalidators (`invalidateTransactions`, `invalidateSellers`, `invalidateDashboard`, `invalidateReports`, `invalidateReceipts`) to immediately refresh backend data across screens.
  - **Session Cache Cleanup**: Session logout in `AuthContext.tsx` invokes `clearAllQueryCache()` to scrub cached user state.
- **Shimmer / Skeleton Experience**:
  - Render dark-themed Shimmer Skeletons (`src/components/Shimmer.tsx`) matching screen structure (`SellerCardSkeleton`, `TransactionCardSkeleton`, `ReceiptCardSkeleton`, `DashboardSkeleton`, `ReportsSkeleton`, `SellerDetailSkeleton`) **ONLY on cold cache loads** (`isLoading && !data`).
  - Warm cache visits render data instantly without layout shift, using `isFetching` exclusively for pull-to-refresh indicators.
 - **Dark Window OS Background**: `app.json` enforces `"userInterfaceStyle": "dark"` and `"backgroundColor": "#080d1a"` for Android and iOS native window containers to prevent white edge flashing during slide transitions.

### 14. Live Environment Hot-Reloading & Clean Base URL Resolution
- **Dynamic Live `.env` Watching**: `server/src/config/env.ts` watches root `.env` `mtimeMs` via `reloadEnvIfNeeded()`. All environment variables (`COMPANY_NAME`, `COMPANY_GST`, `COMPANY_PHONE`, `COMPANY_ADDRESS`, `PORT`, `JWT_SECRET`, etc.) are exposed as dynamic getters so changes to `.env` reflect immediately without requiring a server restart.
- **No Hardcoded Domain Overrides**: Never write domain-sniffing or environment-intercepting hacks (e.g. `!envUrl.includes('railway.app')`) in client or mobile code. Web directly uses `import.meta.env.VITE_API_URL` and mobile directly uses `process.env.EXPO_PUBLIC_API_URL`.
- **Company Branding PDF Invalidation**: `pdfReceiptService.ts` incorporates `companyName` and `companyGst` into the cache key (`${txId}_${updateTime}_${companyName}_${companyGst}`). Modifying company credentials in `.env` immediately invalidates cached receipt PDFs and generates fresh branded documents.
- **Web Receipt Live Parity**: Web receipt modal (`TransactionReceipt.tsx`) queries the authoritative `/api/v1/transactions/:id/receipt` endpoint on open, ensuring web preview, mobile preview, and downloaded vector PDFs all render the live server company branding in 100% parity.

### 15. Transaction Date Picker & Form Calendar Parity
- All transaction creation forms and modals (`AddTransactionModal.tsx`, `DeliveryFormScreen.tsx`, `PaymentFormScreen.tsx`) MUST utilize the dedicated `DatePickerField` component (`app/src/components/ui/DatePickerField.tsx`) for date input, never a raw text input.
- `DatePickerField` supports `presentationStyle="overFullScreen"`, transparent backdrop, year/month navigation, today / yesterday presets, and custom `inputBackground` to cleanly stack within both modal and screen contexts without modal nesting conflicts.

### 16. Top Progress Bar Animation & Report Date Filtering
- **Top Fetching Indicator**: All data revalidation across mobile screens must trigger TanStack Query (`queryClient.fetchQuery` / `useQuery`) so `useIsFetching() > 0` smoothly displays the top laser beam animation (`NavigationProgressBar.tsx`).
- **No Disruptive Inline Spinners**: Inline activity indicator spinners must not be displayed inside card headers or report period banners (e.g. next to "All Time History").
- **Decoupled Pull-to-Refresh**: Native `RefreshControl` spinners must strictly be tied to manual user gestures via `isPullRefreshing`, never to background cache revalidations.
- **UTC Report Date Boundaries**: `reportController.ts` standardizes date filter inputs to full-day UTC boundaries (`${sStr}T00:00:00.000Z` to `${eStr}T23:59:59.999Z`) to eliminate timezone date-shifting artifacts. Aggregation pipelines must match dates across both BSON Date and string types and perform robust seller `$lookup` matching both ObjectId and string formats.
