# Vasudha Polymer — Web Admin Dashboard (`client/`)

> Production React + Vite + Tailwind web dashboard for vendor onboarding, tank deliveries dispatching, payment settlements, and official receipt generation.

---

## 🏗️ Architecture & Modules

The client is structured modularly under `src/modules/`:

- **`src/modules/auth/`**:
  - `LoginPage.tsx`: Clean SaaS authentication (Demo section removed). Interacts with `/api/v1/auth/login`.
- **`src/components/common/Toast.tsx`**: Floating in-place notification toast component with auto-dismiss.
- **`src/modules/seller/`**:
  - `pages/SellerListPage.tsx`: Vendor directory and command center with in-place toast notifications.
  - `pages/SellerDetailPage.tsx`: Vendor ledger and transactions overview with in-place toast notifications.
  - `components/SellerTable.tsx`: Dual-layout (Mobile Card View `md:hidden` + Desktop Table `hidden md:block`).
  - `components/AddSellerModal.tsx`: Vendor onboarding with the **"Require additional fields"** switch toggle:
    - **Toggle ON (Default)**: Validates that **Name**, **Email** (valid format), and **GST Number** (15 chars) are strictly mandatory before submit. Phone and Address are optional.
    - **Toggle OFF**: Only **Name** is mandatory; Email, GST, Phone, and Address are optional.
    - Sends `requireAdditional` in API payload to `/api/v1/sellers`.
  - `components/AddTransactionModal.tsx`: Transaction entry for **DELIVERY** (with strict tank unit sizes `500L`, `1000L`, `2000L`) and **PAYMENT** (CASH, UPI, CHEQUE, BANK_TRANSFER).
  - `components/TransactionReceipt.tsx`: Printable receipt voucher component displaying server-generated transaction data with company logo, credentials, and digital seal.
  - `components/OrderDetailsModal.tsx`: Full distribution inspection modal when clicking seller rows.
- **`src/modules/receipts/`**:
  - `ReceiptsPage.tsx`: Transaction voucher ledger.
- **`src/modules/reports/`**:
  - `ReportsPage.tsx`: High-level business metrics, top vendor ranking, and tank unit distributions.

---

## 📐 Business Logic & Rules for Future Web Dev

1. **Strict Tank Sizes**: In all forms, tables, and charts, only `500`, `1000`, and `2000` (`tank500`, `tank1000`, `tank2000`) are supported.
2. **Selling Units**: The business domain is selling water storage tank units to sellers. Never use "Volume" or "Report" in transaction screens.
3. **Receipt Consistency**: Receipts must use the server-generated data returned from `/api/v1/transactions` or `/api/v1/transactions/:id/receipt`.
4. **Forms & Pickers**:
   - All forms must have `noValidate`.
   - Never use native browser OS date pickers. Use `CustomDatePicker` and `CustomMonthPicker` with `openUpward` detection.
   - Always display field-level error messages in red below inputs.
5. **Dual-Layout Pattern**: All tables must support touch-friendly Mobile Card View (`md:hidden`) and Desktop Grid (`hidden md:block`).

---

## 🚀 Running & Building

```bash
# Start Vite development server
npm run dev

# Build production bundle
npm run build
```
