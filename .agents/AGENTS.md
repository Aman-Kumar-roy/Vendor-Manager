# Vasudha Admin Panel — Agent Rules (AGENTS.md)

> These rules apply to ALL AI agents working in this workspace. Read INSTRUCTIONS.md for full context.

---

## 🔴 Critical Rules — Never Break These

### 0. System State: Live in Production
- The system is **currently live in production**.
- All schema changes must be safe and non-destructive (`IF NOT EXISTS`, `SHOW COLUMNS LIKE` migration checks).
- Never reset or drop existing production tables or records.

### 1. Database: MySQL Only
- Use **MySQL** via the `mysql2` driver and the `query()` helper in `server/src/utils/db.ts`
- **Never** use Prisma, Sequelize, TypeORM, or any ORM
- **Never** use SQLite
- All DB credentials come from `.env` via `server/src/config/env.ts`
- `server/src/utils/prisma.ts` is a **stub/comment file only** — do not restore Prisma functionality

### 2. Modal & Dialog System
- **All modals MUST use `ReactDOM.createPortal(content, document.body)`** — renders outside the React component tree to avoid CSS containment issues
- `Modal.tsx` — the base modal component (already portal-based, `z-[9999]`)
- `ConfirmDialog.tsx` — the base confirm/alert dialog (already portal-based, `z-[10001]`)
- **Never use `window.confirm()` or `window.alert()`** — always use `<ConfirmDialog>`

### 3. AdminLayout — No overflow-x-hidden
- `AdminLayout.tsx` root `<div>` must NOT have `overflow-x-hidden`
- This property creates a scroll/stacking context that clips `position: fixed` children (modals go invisible)

### 4. ConfirmDialog Pattern (Copy This Exactly)
When any component needs a delete confirmation or error alert:

```tsx
// 1. Import
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

// 2. State
const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean; title: string; message: string; onConfirm: () => void;
}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' });

// 3. Trigger
const handleDelete = (id: string, label: string) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete Item',
    message: `Delete "${label}"? This cannot be undone.`,
    onConfirm: async () => {
      setConfirmDialog(p => ({ ...p, isOpen: false }));
      try { await api.delete(id); await refresh(); }
      catch (err: any) { setAlertDialog({ isOpen: true, message: err.message }); }
    },
  });
};

// 4. JSX (at bottom of return)
<ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title}
  message={confirmDialog.message} confirmLabel="Delete" cancelLabel="Cancel" variant="danger"
  onConfirm={confirmDialog.onConfirm}
  onCancel={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} />

<ConfirmDialog isOpen={alertDialog.isOpen} title="Action Failed"
  message={alertDialog.message} confirmLabel="OK" cancelLabel="" variant="warning"
  onConfirm={() => setAlertDialog({ isOpen: false, message: '' })}
  onCancel={() => setAlertDialog({ isOpen: false, message: '' })} />
```

---

## 🟡 Design System Rules

### Colors & Theme
- **Background**: `bg-slate-950` (pages), `bg-slate-900` (panels/modals)
- **Borders**: `border-slate-800`
- **Text**: `text-white` (headings), `text-slate-300` (body), `text-slate-400` (secondary)
- **Accent**: `brand-*` (configured in Tailwind) — use for primary actions and highlights
- **Status colors**: `emerald` (paid/success), `amber` (partial/warning), `rose` (danger/overdue), `indigo` (delivery)

### Component Conventions
- **Buttons**: `rounded-xl`, `text-xs font-semibold`, hover states always present
- **Inputs**: `bg-slate-950/80 border border-slate-800 rounded-xl`, focus `border-brand-500`
- **Cards**: `glass-panel rounded-2xl border border-slate-800`
- **Loading**: spinner `w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin`
- **Animations**: `animate-fade-in` on page-level wrappers and modal panels

### Navigation
- Driven by `client/src/config/navigation.config.ts`
- Current items: **Dashboard, Sellers (Core), Reports (New), Orders (Soon), Receipts**
- `Products` page has been replaced with `Reports` → `/reports`
- `Settings` page has been replaced with `Receipts`

---

## 🟢 Feature Conventions

### Transactions
- Types: `DELIVERY` | `PAYMENT`
- DELIVERY transactions track `tank500`, `tank1000`, `tank2000` (count of each tank size delivered)
- PAYMENT transactions can link to a parent DELIVERY via `parentId`
- Every transaction has a printable receipt via `TransactionReceipt.tsx`
- PAYMENT rows show inline parent delivery badge (ID last-6, date, amount) in `TransactionTable.tsx`

### Sellers
- `gstNumber` field added (VARCHAR 20, optional) — safe migration in `db.ts`
- `AddSellerModal` has a **"Require additional fields" toggle** (ON = phone, address, gstNumber required)
- Seller ID displayed as `#LAST6` (truncated, muted) in `SellerDetailPage.tsx`

### Reports
- `/reports` route renders `ReportsPage.tsx` (module: `client/src/modules/reports/`)
- API: `GET /api/v1/reports/tank-summary?month=YYYY-MM` (see `reports.routes.ts`)
- Table: per-seller 500L/1000L/2000L tank counts for selected month, sorted by total orders desc
- Month picker defaults to current month; rows are clickable → SellerDetailPage

### Receipts
- `/receipts` route renders `ReceiptsPage.tsx` — all transactions across all sellers
- Per-transaction print button (Printer icon) in `TransactionTable.tsx`
- Receipt modal: `TransactionReceipt.tsx` — portal-based, has `window.print()` button

### Theme System
- `ThemeContext.tsx` at `client/src/context/ThemeContext.tsx` — `useTheme()` hook
- Toggle persisted in `localStorage` under key `vasudha-theme`
- `data-theme="light"` attribute set on `<html>` element; light mode CSS in `index.css`
- Sun/Moon toggle button in `Header.tsx` replaces the former non-functional Search icon

### Seller Status Badges
- `totalDues === 0` → `Account Settled` (emerald)
- `totalDues > 5000` → `Dues Outstanding` (rose)
- `totalDues > 0` → `Dues Outstanding` (amber)
- `totalDues < 0` → `Credit Balance` (brand)

---

## 🔵 Tech Stack Summary

| | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| HTTP | Axios |
| Backend | Express.js + TypeScript |
| **Database** | **MySQL via mysql2 (raw SQL)** |
| Auth | JWT + bcrypt |

---

## Before Starting Any Task

1. Read `INSTRUCTIONS.md` in the workspace root for full file structure
2. Check if the change involves a **modal or dialog** → use portal pattern
3. Check if the change involves **deletion** → use ConfirmDialog, not window.confirm
4. Check if the change involves **database** → MySQL raw queries only, read .env; always add `SHOW COLUMNS LIKE` migration checks
5. Check if the change involves **navigation** → update `navigation.config.ts` + `Sidebar.tsx` + `App.tsx`
6. Check if the change involves **theme** → use `useTheme()` from `ThemeContext.tsx`; do NOT add `overflow-x-hidden` to AdminLayout
