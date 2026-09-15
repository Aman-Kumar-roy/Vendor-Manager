# Vasudha Polymer — Vendor & Transaction Management System (VTMS)

> **Web & Server REST API Platform**: Express + TypeScript + MongoDB Backend (`server/`) and React + Vite + Tailwind Admin Dashboard (`client/`). Provides unified, high-performance REST APIs for the web dashboard and external Mobile APK applications.

---

## 🏗️ System Architecture

The repository contains the core platform powering vendor onboarding, delivery management, payment settlements, and official financial vouchers:

```
                            ┌───────────────────────────────────┐
                            │         MongoDB Database          │
                            │    (uri: MONGODB_URI in .env)     │
                            └─────────────────┬─────────────────┘
                                              │ Mongoose
                                              ▼
                            ┌───────────────────────────────────┐
                            │    Express REST API Backend       │
                            │    (server/src — Port 5000)       │
                            └─────────────────┬─────────────────┘
                                              │ HTTP REST (/api/v1)
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
            ┌─────────────────────────┐               ┌─────────────────────────┐
            │   React Web Dashboard   │               │   Mobile APK & Clients  │
            │    (client/ — Vite)     │               │   (External REST API)   │
            └─────────────────────────┘               └─────────────────────────┘
```

### Core Architecture & Business Rules

1. **Unified Server & Single Source of Truth**: The Express REST API (`http://localhost:5000/api/v1`) serves as the single source of truth for both the web dashboard and external mobile clients.
2. **Dynamic Financial Calculations**: `totalDeliveries`, `totalPaid`, and `totalDues` are calculated dynamically in server controllers from MongoDB transactions — never stored statically in documents.
3. **Selling Units Domain Model**: The business domain is selling polymer water storage tanks to vendors/sellers. All transaction records strictly reflect products and unit counts.
4. **Strict Tank Capacities & Flexible Line Items**: Strictly limited to standard tank capacities:
   - **`500L`** (`tank500`, 3-6 Layers)
   - **`1,000L`** (`tank1000`, 3-6 Layers, Foam: none/single/double)
   - Dynamic line items via `tankItems: [{ size: 500 | 1000, quantity, layers: 3-6, foam }]`
   *(2,000L tanks and sizes such as 300L, 750L, 1500L, 2000L are strictly disallowed and rejected with 400 Bad Request)*.
5. **Back Due Tracking**: Every transaction computes and records `previousDues` and `currentDues`.
6. **Server Database Performance & Pagination**:
   - True database-level pagination (`.skip()` & `.limit()`) on `/sellers/:id` and `/transactions` with a maximum limit cap of 100.
   - MongoDB `$group` aggregation pipelines for lifetime vendor statistics.
   - Compound B-tree indexes on `TransactionSchema` and search indexes on `SellerSchema`.
   - Safe regex sanitization (`escapeRegex`) with 100-character truncation to prevent ReDoS.
7. **Server-Generated Official Receipts**: Both the web dashboard and mobile apps use the identical server-generated receipt system (`receipt: ServerReceipt` attached to transaction creation responses and `GET /api/v1/transactions/:id/receipt`).
8. **Seller Toggle Parity**: Both web client and backend enforce the "Require additional fields" validation toggle:
   - **ON (Default)**: Validates that **Vendor Name**, **Email Address** (valid email format), and **GSTIN** (15 alphanumeric characters) are strictly mandatory before submission. Phone and address are optional.
   - **OFF**: Only **Vendor Name** is mandatory. Email (if provided, validated for format), GSTIN, Phone, and Address are optional.
9. **Role-Based Security**: Admin and Manager roles. Deletion of transactions and vendor records is strictly restricted to `admin` accounts.
10. **Currency & Financial Precision**: Dynamic totals and monetary balances are rounded to 2 decimal places (`Math.round(val * 100) / 100`) on the server.

---

## 📁 Repository Structure

```
vasudha-polymer/
├── .agents/                 # AI Agent rule definitions
│   └── AGENTS.md            # Mandatory AI Agent instructions
├── AGENTS.md                # Master workspace AI rules
├── README.md                # Master system documentation
├── .env                     # Project-wide environment configuration
├── package.json             # Root npm workspaces configuration (client, server)
├── server/                  # Express + TypeScript + MongoDB Backend
│   ├── src/
│   │   ├── app.ts           # Express app, CORS & route configuration
│   │   ├── index.ts         # Server bootstrap & MongoDB connection
│   │   ├── config/          # MongoDB connection (db.ts)
│   │   ├── controllers/     # Controller handlers (Auth, Seller, Transaction, Report)
│   │   ├── middleware/      # JWT authentication & role-based authorization
│   │   ├── models/          # Mongoose Schemas (User, Seller, Transaction)
│   │   ├── routes/          # REST API route definitions (/api/v1)
│   │   └── scripts/         # Automated API test suite (`npm run test:api`)
│   ├── package.json
│   └── tsconfig.json
└── client/                  # React + Vite + Tailwind Web Admin Dashboard
    ├── src/
    │   ├── components/      # Modals, custom date pickers, table grids, Toast
    │   ├── context/         # AuthContext (User Authentication & Session)
    │   ├── modules/
    │   │   ├── auth/        # Login page & authentication
    │   │   ├── seller/      # Seller tables, modals, and transaction receipts
    │   │   ├── reports/     # Monthly tank order analytics & ranking
    │   │   └── receipts/    # Transaction receipt generator & PDF printer
    │   └── services/        # Axios API client
    ├── package.json
    └── README.md            # Web client documentation
```

---

## 📡 REST API Implementation (Serving Web & Mobile APK)

The backend provides a complete RESTful API at `/api/v1` used by both the Web Dashboard and external Mobile APK applications:

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Authenticate user credentials & receive JWT token
- `GET /api/v1/auth/me` — Verify active token and retrieve user profile & role (`admin` | `manager`)
- `POST /api/v1/auth/users` — Create new system user (Admin only)
- `GET /api/v1/auth/users` — List all authorized system users (Admin only)
- `DELETE /api/v1/auth/users/:id` — Delete user account (Admin only)

### 2. Vendors / Sellers (`/api/v1/sellers`)
- `GET /api/v1/sellers` — List all sellers with calculated balances (`totalDeliveries`, `totalPaid`, `totalDues`, `tank500`, `tank1000`)
- `POST /api/v1/sellers` — Register new vendor with `requireAdditional` toggle support
- `GET /api/v1/sellers/:id` — Retrieve seller profile, complete transaction ledger & linked deliveries
- `PUT /api/v1/sellers/:id` — Update seller information (Admin only)
- `DELETE /api/v1/sellers/:id` — Delete seller and cascade cleanup (Admin only)

### 3. Transactions & Official Receipts (`/api/v1/transactions`)
- `GET /api/v1/transactions` — Paginated transaction ledger with filtering (`page`, `limit`, `type`, `sellerId`)
- `POST /api/v1/transactions` — Record new `DELIVERY` or `PAYMENT` transaction; returns both transaction and official `receipt` voucher
- `GET /api/v1/transactions/:id/receipt` — Retrieve official server-generated receipt voucher (`RCP-XXXXXXXX`) with company credentials and digital seal
- `GET /api/v1/transactions/:id/receipt/pdf` — Stream canonical server-generated vector PDF receipt (`Content-Type: application/pdf`), shared identically by both Web and Mobile
- `PUT /api/v1/transactions/:id` — Update transaction (Admin only)
- `DELETE /api/v1/transactions/:id` — Delete transaction (Admin only)

### 4. Reports & Analytics (`/api/v1/reports`)
- `GET /api/v1/reports/summary` — High-level financial totals, payment recovery rate & top performing vendors
- `GET /api/v1/reports/tank-summary` — Monthly unit breakdowns for polymer water storage tanks (`500L`, `1000L`)

---

## 🚀 Running the Project

### 1. Setup Environment
Ensure the root `.env` file exists with the necessary configuration:
```bash
npm run setup:env
```

### 2. Start Server & Web Dashboard
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000/api/v1`
- **Web Dashboard**: `http://localhost:5173`

### 3. Build for Production
```bash
# Build both web client and server
npm run build

# Start production server
npm run start
```

### 4. Run Automated API Tests
```bash
npm run test:api
```
*(Executes complete 25-step automated verification suite against MongoDB)*
