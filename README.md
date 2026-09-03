# Vasudha Polymer — Vendor & Transaction Management System (VTMS)

> **Enterprise Full-Stack Monorepo**: Unified **MongoDB + Express REST API (`server/`)** serving both the **React + Vite Admin Dashboard (`client/`)** and the **React Native / Expo Mobile App (`vtms-app/`)**.

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
            │    (client/ — Vite)     │               │   (vtms-app/ — Expo)    │
            └─────────────────────────┘               └─────────────────────────┘
```

### Key Principles
1. **Unified Server**: The Web dashboard and Mobile app communicate with the exact same Express REST API (`http://localhost:5000/api/v1`).
2. **Dynamic Financial Totals**: `totalDeliveries`, `totalPaid`, and `totalDues` are calculated dynamically on the server — never hardcoded or stored statically in database documents.
3. **Strict Tank Capacities**: In compliance with company manufacturing specifications, only the following tank sizes are permitted:
   - **`500L`** (`tank500`)
   - **`1000L`** (`tank1000`)
   - **`2000L`** (`tank2000`)
   - *(Tank sizes such as 300L, 750L, 1500L, etc. are strictly disallowed)*.

---

## 📁 Workspace Directory Structure

```
vasudha-polymer/
├── .agents/                 # AI Agent rule definitions
│   └── AGENTS.md            # Mandatory AI Agent instructions
├── AGENTS.md                # Master workspace AI rules
├── README.md                # System documentation
├── .env                     # Project-wide environment configuration
├── .env.example             # Environment template
├── package.json             # Root npm workspaces configuration
├── package-lock.json        # Unified root dependency lockfile
├── server/                  # Express + TypeScript + MongoDB Backend
│   ├── src/
│   │   ├── app.ts           # Express app, CORS & route configuration
│   │   ├── index.ts         # Server bootstrap & MongoDB connection
│   │   ├── config/          # Environment & database connection pool
│   │   ├── controllers/     # Modular controller handlers (Auth, Seller, Transaction, Report)
│   │   ├── middleware/      # JWT authentication & error handling
│   │   ├── models/          # Mongoose Schemas (User, Seller, Transaction)
│   │   ├── routes/          # REST API route definitions
│   │   └── scripts/         # Database seed & automated API test suite
│   ├── package.json
│   └── tsconfig.json
└── client/                  # React + Vite + Tailwind Admin Dashboard
    ├── src/
    │   ├── components/      # Common UI, Layout, Custom Date/Month Pickers
    │   ├── context/         # AuthContext & ThemeContext (Dark/Light)
    │   ├── modules/
    │   │   ├── auth/        # Login page & authentication
    │   │   ├── seller/      # Vendor list, detail ledger & transaction modals
    │   │   ├── reports/     # Monthly tank order analytics & ranking
    │   │   └── receipts/    # Transaction receipt generator & PDF printer
    │   └── services/        # Axios API client with automatic token attachment
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Environment Configuration (`.env`)

Configure a single `.env` file in the project root:

```env
# MongoDB Atlas or Local URI
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vasudha_seller?retryWrites=true&w=majority"

# Express Server Configuration
PORT=5000
JWT_SECRET="vasudha_polymer_secret_key_2026"
JWT_EXPIRES_IN="24h"

# Client Configuration
VITE_API_URL="http://localhost:5000/api/v1"

# Company Receipt & Invoice Configuration
VITE_COMPANY_NAME="Vasudha Polymer"
VITE_COMPANY_GST="07AAAAA0000A1Z5"
VITE_COMPANY_PHONE="+91 98765 43210"
VITE_COMPANY_ADDRESS="Plot 42, Industrial Zone, New Delhi - 110020"
```

---

## 🚀 Quick Start & Scripts

### 1. Initial Setup
```bash
# Setup environment file, install dependencies & seed database
npm run setup
```

### 2. Development Mode
```bash
# Starts both Express backend (:5000) and React client (:3000) concurrently
npm run dev
```

### 3. Production Build
```bash
# Compiles both client and server packages with strict TypeScript checks
npm run build
```

### 4. Automated API Verification Test Suite
```bash
# Runs comprehensive automated API tests against all server endpoints
npm run test:api
```

### 5. Seed Admin & Demo Data
```bash
npm run seed
```
- **Default Admin Account**: `admin@webkul.com` / `admin123`

---

## 📡 REST API Reference (`/api/v1`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server healthcheck |
| `POST` | `/api/v1/auth/login` | Public | Admin login & JWT token generation |
| `GET` | `/api/v1/auth/me` | Bearer | Current authenticated user profile |
| `GET` | `/api/v1/sellers` | Bearer | All sellers with aggregated summary metrics |
| `POST` | `/api/v1/sellers` | Bearer | Create new vendor |
| `GET` | `/api/v1/sellers/:id` | Bearer | Seller detail with ledger of transactions |
| `GET` | `/api/v1/transactions` | Bearer | All delivery & payment transactions |
| `POST` | `/api/v1/transactions` | Bearer | Log tank delivery (`DELIVERY`) or payment (`PAYMENT`) |
| `GET` | `/api/v1/reports/summary` | Bearer | High-level metrics, tank totals & top vendor leaderboard |
| `GET` | `/api/v1/reports/tank-summary` | Bearer | Monthly tank order analytics (`?month=YYYY-MM`) per vendor |
