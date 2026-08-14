## Project Overview
Vasudha is a full-stack seller/vendor management admin panel for tracking goods deliveries and payment settlements. It is a monorepo with two packages: `client` (React SPA) and `server` (Express REST API).

> 🚨 **PRODUCTION NOTICE**: The system is currently live in production. All code changes and database migrations must be strictly non-destructive and backward-compatible.

---

## Repository Structure

```
d:\Vasudha_seller\
├── client/                        # React + Vite frontend
│   └── src/
│       ├── App.tsx                # Routes: /dashboard, /sellers, /sellers/:id, /reports, /receipts, /orders
│       ├── components/
│       │   ├── common/
│       │   │   ├── Modal.tsx      # PORTAL-BASED modal (ReactDOM.createPortal → document.body)
│       │   │   ├── ConfirmDialog.tsx  # PORTAL-BASED confirm/alert (replaces window.confirm)
│       │   │   ├── Badge.tsx
│       │   │   └── StatCard.tsx
│       │   └── layout/
│       │       ├── AdminLayout.tsx  # Root layout — NO overflow-x-hidden (traps fixed modals)
│       │       ├── Sidebar.tsx
│       │       └── Header.tsx     # Has Sun/Moon theme toggle (replaces old Search icon)
│       ├── config/
│       │   └── navigation.config.ts  # Nav items: Dashboard, Sellers, Reports, Orders, Receipts
│       ├── context/
│       │   ├── AuthContext.tsx    # JWT auth via React Context
│       │   └── ThemeContext.tsx   # Dark/Light theme toggle; persisted to localStorage
│       └── modules/
│           ├── seller/
│           │   ├── api.ts         # Axios calls to Express API
│           │   ├── types.ts       # Seller (incl. gstNumber), Transaction, CreateSellerDto
│           │   ├── pages/
│           │   │   ├── SellerListPage.tsx   # List + paginate + search all sellers
│           │   │   └── SellerDetailPage.tsx # Single seller ledger + transactions (ID shown as #LAST6)
│           │   └── components/
│           │       ├── AddSellerModal.tsx       # Includes GST field + required-fields toggle
│           │       ├── AddTransactionModal.tsx  # Includes 500L/1000L/2000L tank size selector
│           │       ├── TransactionTable.tsx     # PAYMENT rows show inline parent delivery badge
│           │       ├── TransactionReceipt.tsx   # Printable receipt (portal-based)
│           │       ├── SellerTable.tsx
│           │       └── OrderDetailsModal.tsx
│           ├── reports/
│           │   └── ReportsPage.tsx  # /reports — monthly tank orders per seller, sortable
│           ├── receipts/
│           │   └── ReceiptsPage.tsx  # /receipts — all transactions, print receipts
│           ├── auth/
│           │   └── pages/LoginPage.tsx
│           └── placeholders/
│               ├── DashboardPage.tsx
│               └── OrdersPage.tsx
│
└── server/                        # Express + TypeScript backend
    └── src/
        ├── config/env.ts          # All env vars from .env (DB connection, JWT, PORT)
        ├── utils/db.ts            # MySQL2 pool + typed query() helper; handles gstNumber migration
        ├── utils/prisma.ts        # STUB ONLY — project uses raw MySQL, not Prisma
        ├── routes/                # Express routers
        │   └── v1/
        │       ├── seller.routes.ts      # Includes gstNumber in SELECT/INSERT/GET
        │       ├── transaction.routes.ts
        │       ├── reports.routes.ts     # GET /reports/tank-summary?month=YYYY-MM
        │       └── index.ts
        ├── controllers/           # Business logic
        └── scripts/seed.ts       # DB seeding script
```

---

## Tech Stack (ACTUAL — do NOT use Prisma or SQLite)

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| HTTP client | Axios |
| Backend | Express.js + TypeScript |
| **Database** | **MySQL** (via `mysql2` driver, raw queries) |
| **ORM** | **None** — raw SQL through `db.ts` query helper |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Dev build | ts-node / nodemon |

> ⚠️ CRITICAL: The project uses MySQL with raw queries. There is NO Prisma ORM and NO SQLite. Never add Prisma or SQLite configs. Read `.env` for database credentials.

---

## Environment Variables (`.env` in `/server`)

```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME   ← MySQL connection
JWT_SECRET
PORT
```

All consumed via `server/src/config/env.ts`.

---

## Critical UI Patterns — Follow These Exactly

### 1. Modal System
All modals use `ReactDOM.createPortal(content, document.body)` to render directly on `<body>`, escaping ancestor CSS traps.

```tsx
// CORRECT — always portal-based
import ReactDOM from 'react-dom';
return ReactDOM.createPortal(<div className="fixed inset-0 z-[9999]">...</div>, document.body);
```

**Modal layout pattern (overflow-y-auto scroll container):**
```tsx
{/* Outer: fixed, full viewport, overflow-y-auto = scroll container */}
<div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
  {/* Centering: min-h-full makes items-center work for short modals */}
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="w-full bg-slate-900 rounded-2xl" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      {/* Body */}
      {/* Footer: sticky bottom-0 keeps Save button ALWAYS visible */}
      <div className="sticky bottom-0 z-10 ...">Footer / Save button</div>
    </div>
  </div>
</div>
```

### 2. Delete / Alert Confirmations — NEVER use window.confirm or window.alert
Always use the `ConfirmDialog` component from `client/src/components/common/ConfirmDialog.tsx`.

```tsx
// In component state:
const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean; title: string; message: string; onConfirm: () => void;
}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' });

// Trigger delete:
const handleDelete = (id: string) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete X',
    message: 'Are you sure? This cannot be undone.',
    onConfirm: async () => {
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      try { await api.delete(id); }
      catch (err: any) { setAlertDialog({ isOpen: true, message: err.message }); }
    },
  });
};

// In JSX:
<ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title}
  message={confirmDialog.message} confirmLabel="Delete" cancelLabel="Cancel" variant="danger"
  onConfirm={confirmDialog.onConfirm}
  onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />

<ConfirmDialog isOpen={alertDialog.isOpen} title="Action Failed"
  message={alertDialog.message} confirmLabel="OK" cancelLabel="" variant="warning"
  onConfirm={() => setAlertDialog({ isOpen: false, message: '' })}
  onCancel={() => setAlertDialog({ isOpen: false, message: '' })} />
```

### 3. AdminLayout — Do NOT add overflow-x-hidden
The root layout div in `AdminLayout.tsx` must NOT have `overflow-x-hidden`. It creates a scroll/stacking context that clips `position: fixed` portal elements (modals, dialogs).

```tsx
// CORRECT
<div className="min-h-screen bg-slate-950 text-slate-100 flex">

// WRONG — traps fixed children, modals won't show
<div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-x-hidden">
```

### 4. Navigation Config
Navigation is driven by `client/src/config/navigation.config.ts`. Current items: Dashboard, Sellers (Core), Products (Soon), Orders (Soon), Receipts.

---

## Transaction Features

- **Types**: `DELIVERY` (goods delivered) or `PAYMENT` (cash settlement)
- **Tank Counts**: Delivery transactions record `tank500`, `tank1000`, `tank2000` (integer counts per tank size)
- **Linking**: Payments can be linked to a parent Delivery via `parentId`
- **Receipts**: Every transaction has a printable receipt via `TransactionReceipt.tsx`. Accessible from TransactionTable (Printer icon) or the `/receipts` page.
- **Parent Badge**: PAYMENT rows in TransactionTable show an inline branded pill with the parent delivery's truncated ID, date, and amount.

---

## Seller Features

- **GST Number**: Optional `gstNumber VARCHAR(20)` field. Added to Seller table via safe migration in `db.ts`. Shown in `AddSellerModal` (with required toggle) and `SellerDetailPage` contact details.
- **Required Fields Toggle**: `AddSellerModal` has a toggle switch; when ON (default), `phone`, `address`, `gstNumber` become required fields.
- **ID Display**: `SellerDetailPage` shows seller ID as `#LAST6` (last 6 chars, muted monospace) — not the full UUID.

---

## Reports

- **Route**: `/reports` → `ReportsPage.tsx` (module: `client/src/modules/reports/`)
- **API**: `GET /api/v1/reports/tank-summary?month=YYYY-MM` → returns per-seller tank order counts
- **Features**: Month picker (default = current month), sortable table, clickable rows → SellerDetailPage

---

## Theme System

- `ThemeProvider` wraps `<App />` in `main.tsx`
- `useTheme()` hook from `client/src/context/ThemeContext.tsx`
- Persisted to `localStorage` key `vasudha-theme`
- `document.documentElement.setAttribute('data-theme', theme)` drives CSS overrides in `index.css`
- Sun icon = currently dark → click to go light; Moon icon = currently light → click to go dark
- Toggle button in `Header.tsx` (replaced old non-functional Search icon)

---

## Design System

- **Dark theme**: `bg-slate-900` panels, `bg-slate-950` page background
- **Accent color**: `brand-*` (configured in Tailwind)  
- **Modals**: Portal-based, `z-[9999]` (backdrop `z-[9998]`)
- **Confirm dialogs**: Portal-based, `z-[10001]` (backdrop `z-[10000]`)
- **Animations**: `animate-fade-in` CSS class for page transitions
- **Cards**: `glass-panel` utility class
- **Badges**: `<Badge variant="emerald|amber|rose|brand">` component
- **Typography**: System fonts via Tailwind, no Google Fonts added
