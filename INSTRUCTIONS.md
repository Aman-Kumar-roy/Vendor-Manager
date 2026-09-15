# Vasudha Polymer VTMS — Flexible Tank Line Items, Removal of 2000L & Back Dues

## Overview
This document outlines the architecture, data schemas, validation rules, and client integrations for:
1. **Removal of 2000L Tank Support** (500L and 1000L only)
2. **Flexible Tank Line Items** (`tankItems`)
3. **Back Due Functionality** (`previousDues` and `currentDues`)

---

## 1. Supported Specifications

### Strict Tank Capacities
Only two capacities are allowed:
- `500L` (`tank500`)
- `1000L` (`tank1000`)
- `2000L` (`tank2000`) is **strictly removed and prohibited**. Any request with 2000L tank quantity > 0 is rejected with `400 Bad Request`.

### Flexible Tank Line Items (`tankItems`)
Deliveries support dynamic line items allowing multiple configurations for the same litre capacity:
- Each item schema:
  - `size`: `500` or `1000` (Number)
  - `quantity`: integer > 0 (Number)
  - `layers`: integer between 3 and 6 (Number)
  - `foam`: `'none' | 'single' | 'double'` (only for 1000L; prohibited on 500L)
- Aggregated counts (`tank500` and `tank1000`) are computed dynamically as the sum of matching items.

### Back Due Functionality
Every transaction computes and returns:
- `previousDues`: Outstanding balance strictly before this transaction.
- `currentDues`: Outstanding balance immediately after this transaction:
  - `DELIVERY`: `currentDues = previousDues + amount`
  - `PAYMENT`: `currentDues = previousDues - amount`

---

## 2. API Validation Rules

### POST /api/v1/transactions & PUT /api/v1/transactions/:id
1. **DELIVERY Transactions**:
   - `tankItems`: Array of line items. Each item must have `size` (500 or 1000), `quantity > 0`, `layers` between 3 and 6. `foam` allowed only on size 1000.
   - Any `tank2000 > 0` returns `400 Bad Request`.
   - Any `size === 500` with foam returns `400 Bad Request`.
2. **PAYMENT Transactions**:
   - All tank quantities, line items, layer counts, and foam types are ignored/cleared.
   - `previousDues` and `currentDues` are calculated based on previous balance minus payment amount.
3. **Backward Compatibility**:
   - Existing delivery records without `tankItems` or with legacy `tank500`/`tank1000` remain fully supported.

---

## 3. Canonical PDF Receipts & In-Context Previews
- The server PDF generator (`PdfReceiptService`) formats tank lines from `tankItems`:
  - `500L: 5 (2×3L, 3×4L)`
  - `1000L: 3 (1×5L, 2×6L, double foam)`
- Receipts include Previous Dues and Closing Dues in the financial breakdown table.
- **Transaction Table & Breakdown Views**:
  - Displays formatted tank strings: `500L: 2 (4 layers) • 1000L: 1 (5 layers, double foam)`.
  - Gracefully handles older records with a fallback placeholder.
