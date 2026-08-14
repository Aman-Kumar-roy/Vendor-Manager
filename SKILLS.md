# Vasudha Admin Panel — Actual Tech Stack

## Frontend
- **React 18** — functional components, hooks (useState, useEffect, useContext, useMemo)
- **React Router v6** — routing, nested routes, `useNavigate`, `useParams`
- **TypeScript** — strict type safety throughout
- **Axios** — HTTP client for API calls (`client/src/services/api.client.ts`)
- **Tailwind CSS v3** — utility-first styling, dark theme
- **ReactDOM.createPortal** — all modals and dialogs render into `document.body`
- **Context API** — JWT auth state management (`AuthContext.tsx`)
- **Vite** — frontend build tooling and dev server

## Backend
- **Express.js** — route handling, middleware, error handling
- **TypeScript** — strongly typed backend
- **mysql2** — MySQL driver, raw SQL queries (NO ORM)
- **JWT (`jsonwebtoken`)** — token issuing and verification
- **bcrypt** — password hashing
- **REST API design** — CRUD endpoints, proper HTTP status codes, JSON responses
- **ts-node / nodemon** — development server

## Database
- **MySQL** — production database (NOT SQLite, NOT Prisma)
- Raw SQL via the `query()` helper in `server/src/utils/db.ts`
- Connection config read from `.env` via `server/src/config/env.ts`

> ⚠️ DO NOT add Prisma, SQLite, or any ORM. The project uses raw MySQL queries only.

## Development Tools
- **Git** — version control
- **npm** — package management (workspace root + `/client` + `/server`)
- **Vite** — frontend bundler
- **ts-node / nodemon** — backend hot reload

## Deployment State
- **Currently in Production**: System is live. All database schema modifications must use non-destructive migration checks (`IF NOT EXISTS` / `SHOW COLUMNS LIKE`), preserve existing records, and avoid breaking production data.

## Key Established Patterns (All Agents Must Follow)
1. **Modals are portal-based** — always use `ReactDOM.createPortal(content, document.body)`
2. **No `window.confirm` / `window.alert`** — use `<ConfirmDialog>` component
3. **No `overflow-x-hidden` on AdminLayout root** — it traps fixed modal portals
4. **Footer uses `sticky bottom-0`** — inside `overflow-y-auto` scroll container for always-visible Save button
5. **DB = MySQL raw queries** — never Prisma, never SQLite