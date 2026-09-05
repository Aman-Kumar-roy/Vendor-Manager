# Vasudha Polymer — Vendor & Transaction Management System (VTMS)

> **Enterprise Full-Stack Monorepo**: Unified **MongoDB + Express REST API (`server/`)** serving both the **React + Vite Admin Dashboard (`client/`)** and the **React Native / Expo Mobile App (`app/`)**.

---

## 🏗️ Monorepo Architecture

The system is built on a single, shared backend server that acts as the single source of truth for both web and mobile platforms:

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
            │   React Web Dashboard   │               │   React Native App      │
            │    (client/ — Vite)     │               │     (app/ — Expo)       │
            └─────────────────────────┘               └─────────────────────────┘
```

### Core Architecture & Business Rules

1. **Unified Server & Single Source of Truth**: The Web dashboard and Mobile app communicate with the exact same Express REST API (`http://localhost:5000/api/v1`).
2. **Dynamic Financial Calculations**: `totalDeliveries`, `totalPaid`, and `totalDues` are calculated dynamically in server controllers from MongoDB transactions — never stored statically in documents.
3. **Selling Units Domain Model**: The application represents selling polymer water storage tanks to vendors/sellers. All transaction interfaces strictly reflect products and unit counts.
4. **Strict Tank Capacities**: Strictly limited to standard tank capacities:
   - **`500L`** (`tank500`)
   - **`1,000L`** (`tank1000`)
   - **`2,000L`** (`tank2000`)
   *(Tank sizes such as 300L, 750L, 1500L, etc. are strictly disallowed)*.
5. **Server-Generated Receipts**: Both web and mobile applications share the identical server-generated receipt system (`receipt: ServerReceipt` attached to transaction creation responses and `GET /api/v1/transactions/:id/receipt`).
6. **In-Context Transaction Flow**: On both platforms, transaction creation opens dedicated modals (`AddTransactionModal.tsx`), shows a floating success toast (`"Transaction created successfully."`), and retains user context without automatic redirect to unrelated screens. Users are presented with in-place success confirmation and direct actions: *View Official Receipt*, *+ Record Another*, or *Done*.
7. **Seller Toggle Parity**: Both web and mobile feature the "Require additional fields" switch toggle and backend enforcement:
   - **ON (Default)**: Validates that **Vendor Name**, **Email Address** (valid email format), and **GSTIN** (15 alphanumeric characters) are strictly mandatory before submission. Phone and address are optional.
   - **OFF**: Only **Vendor Name** is mandatory. Email (if provided, validated for format), GSTIN, Phone, and Address are optional.
   - **Feedback**: Displays floating success toast (`"Seller created successfully."`) and immediately refreshes the active vendor list in-place.

---

## 📁 Workspace Directory Structure

```
vasudha-polymer/
├── .agents/                 # AI Agent rule definitions
│   └── AGENTS.md            # Mandatory AI Agent instructions
├── AGENTS.md                # Master workspace AI rules
├── README.md                # Master system documentation
├── .env                     # Project-wide environment configuration
├── package.json             # Root npm workspaces configuration
├── server/                  # Express + TypeScript + MongoDB Backend
│   ├── src/
│   │   ├── app.ts           # Express app, CORS & route configuration
│   │   ├── index.ts         # Server bootstrap & MongoDB connection
│   │   ├── controllers/     # Controller handlers (Auth, Seller, Transaction, Report)
│   │   ├── middleware/      # JWT authentication & error handling
│   │   ├── models/          # Mongoose Schemas (User, Seller, Transaction)
│   │   ├── routes/          # REST API route definitions
│   │   └── scripts/         # Automated API test suite (`npm run test:api`)
│   └── package.json
├── client/                  # React + Vite + Tailwind Web Admin Dashboard
│   ├── src/
│   │   ├── components/      # Modals, custom date pickers, table grids
│   │   ├── context/         # AuthContext & ThemeContext
│   │   ├── modules/
│   │   │   ├── auth/        # Login page & authentication
│   │   │   ├── seller/      # Seller tables, modals, and transaction receipts
│   │   │   ├── reports/     # Monthly tank order analytics & ranking
│   │   │   └── receipts/    # Transaction receipt generator & PDF printer
│   │   └── services/        # Axios API client
│   └── README.md            # Web client documentation
└── app/                     # React Native (Expo SDK 50) Cross-Platform Mobile App
    ├── src/
    │   ├── api/             # Typed API services with dynamic host IP resolution
    │   ├── components/      # NavbarHeader, TankSelector, ReceiptModal, DrawerSidebar
    │   ├── context/         # AuthContext & ThemeContext
    │   ├── screens/         # Dashboard, Sellers, DeliveryForm, PaymentForm, etc.
    │   └── types/           # Core TypeScript data contracts
    ├── README.md            # Mobile app documentation
    ├── SKILLS.md            # Mobile agent skills & conventions
    └── API_DOCUMENTATION.md # Complete REST API specification
```

---

## 🚀 Running the Project

### 1. Start Server & Web Dashboard (Root)
```bash
npm run dev
```
- Backend API runs on: `http://localhost:5000/api/v1`
- Web Dashboard runs on: `http://localhost:5173`

### 2. Run API Automated Tests
```bash
npm run test:api
```
*(Runs comprehensive 18-step automated verification suite against MongoDB)*

### 3. Start Mobile App
```bash
cd app
npx expo start
```
- Web preview mode: `npx expo start --web`
- Type-check mobile code: `npx tsc --noEmit`
