# Vendor Manager VTMS — Skills & Capabilities Guide (`SKILLS.md`)

## 🔴 Critical Architectural Constraints

### 1. Tank Capacities, Flexible Line Items, Layers & Foam Constraint
- Strictly allowed tank capacities: `500` and `1000` (`tank500`, `tank1000`). `2000L` has been removed and is strictly rejected (400 Bad Request).
- Do NOT add `tank300`, `tank750`, `tank1500`, `tank2000`, or any other tank capacity.
- **Flexible Line Items**: Dynamic line items via `tankItems: [{ size: 500 | 1000, quantity, layers: 3-6, foam?: 'none' | 'single' | 'double' }]`.
- **Tank Layers**: Integer from 3 to 6 mandatory per tank line item.
- **Foam Type (1000L only)**: Allowed values: `none`, `single`, `double` (`tank1000_foam`). Applicable only when 1000L quantity > 0. Prohibited on 500L.
- **Back Due Tracking**: Every transaction computes and tracks `previousDues` and `currentDues`.
- Payment transactions do not include tank fields.
- Backward compatibility: Legacy records without layer/foam/tankItems fields remain functional.

### 2. Database & Data Store
- MongoDB via `mongoose` models (`server/src/models/Transaction.ts`, `Seller.ts`, `User.ts`).
- Server computes dynamic ledger balances (`totalDeliveries`, `totalPaid`, `totalDues`).

### 3. Canonical Vector Receipts
- Single authoritative generator: Express REST API backend (`server/src/services/pdfReceiptService.ts`).
- Endpoints:
  - `POST /api/v1/transactions`
  - `GET /api/v1/transactions/:id/receipt`
  - `GET /api/v1/transactions/:id/receipt/pdf`
- Renders itemized tank delivery lines with layer counts and foam types.
