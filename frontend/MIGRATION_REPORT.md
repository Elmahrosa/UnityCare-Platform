# UnityCare Frontend Migration Report — Jun 18, 2026

## Summary

Removed dual-architecture conflict by deleting the CRA/Webpack SPA (`src/`) and consolidating on **Next.js App Router** (`app/`). Business-critical logic was migrated; UI scaffolding and stubs were archived.

---

## Architecture Decision

**Kept**: Next.js App Router (`app/`, `components/`)
**Removed**: CRA/Webpack SPA (`src/`, `webpack.config.js`)

Rationale: `package.json` scripts already targeted Next.js. The SPA was a parallel, competing implementation from the U_C_H2 repository consolidation.

---

## Files Migrated (SPA → Next.js)

| Source (removed) | Destination (kept) | What Changed |
|---|---|---|
| `src/services/apiService.js` | `lib/api.js` | Rewrote from Axios to native `fetch()` with JWT interceptor |
| `src/_core/hooks/useAuth.ts` | `hooks/useAuth.ts` | Rewrote to use `lib/api.js` instead of Axios |
| `src/components/ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | Replaced `lucide-react` icons with inline SVGs |
| `src/pages/doctor/Dashboard.tsx` | `app/[locale]/doctor/page.tsx` | Rewritten with plain Tailwind HTML (was shadcn/ui) |
| `src/pages/patient/Dashboard.tsx` | Enhanced `app/[locale]/patient/page.tsx` | Added IoT vital signs grid to existing consent page |

## Files Created

| File | Purpose |
|---|---|
| `lib/api.js` | Fetch-based API client with JWT auth, 401 redirect, typed endpoints |
| `hooks/useAuth.ts` | Auth hook using `lib/api.js` (token lifecycle, user fetch, logout) |
| `components/ErrorBoundary.tsx` | Class-based error boundary with stack display + reload |
| `app/[locale]/doctor/page.tsx` | Full doctor dashboard with stats, patient queue, quick actions |
| Enhanced `app/[locale]/patient/page.tsx` | Added vitals (heart rate, O2, BP, temp) to consent dashboard |

## Files / Directories Deleted

| Path | Reason |
|---|---|
| `frontend/src/` | Entire SPA (archived to `legacy-src-backup/`) |
| `frontend/webpack.config.js` | SPA build config (conflicts with Next.js) |
| `frontend/public/index.html` | SPA HTML entry point (not used by Next.js) |
| `frontend/public/locales/` | Duplicate i18n JSON (data exists in `i18n/messages/`) |
| `frontend/i18n/routing.ts` | Depended on uninstalled `next-intl` |
| `frontend/i18n/request.ts` | Depended on uninstalled `next-intl` |
| `frontend/coverage/` | Stale test artifact |
| `backend/node_modules/` | Orphaned (no `package.json` exists) |
| `backend/jest.config.js` | Vestigial Node.js config (backend is Python) |
| `backend/.eslintrc.json` | Vestigial Node.js config (backend is Python) |

## package.json Changes

| Change | Details |
|---|---|
| Removed `next-intl` | Not installed in `node_modules`; no code imported from it |
| Removed `lucide-react` | Not used by any remaining component |
| Removed `clsx` | Not used by any remaining component |
| Added `"type-check"` script | `tsc --noEmit` for CI type checking |

## Backend Fixes

| Issue | Fix |
|---|---|
| `alembic/env.py` async connection broken | Replaced sync `.connect()` with `asyncio.run()` + `async with` |
| `nginx.conf` proxy_pass port wrong | Changed `http://api:5000` → `http://backend:8000` (matches Dockerfile EXPOSE) |
| `requirements.txt` has unused driver | Removed `psycopg2-binary` (only `asyncpg` is used) |
| CI frontend lint errors suppressed | Removed `|| true` from lint command |
| Missing frontend type-check in CI | Added `frontend-type-check` job |

## CI Changes

- Frontend lint now **fails on errors** (removed `|| true` suppression)
- Added `npm run type-check` job in CI
- Deploy job now depends on `frontend-type-check`

---

## Archived Content

The complete SPA was moved to `frontend/legacy-src-backup/` and includes:

- **53 shadcn/ui components** (Radix-based) — available for future re-integration
- **5 dashboards** (admin, patient, doctor, pharmacy, emergency) — some with business logic
- **5 hooks** (useAuth, useFileUpload, useMobile, usePersistFn, useComposition)
- **Contexts** (ThemeContext — dark/light mode)
- **Components** (AIChatBox, DashboardLayout, Map, Markdown, ManusDialog)
- **7 placeholder pages** with single `<h1>` stubs
- **ComponentShowcase** dev page cataloging all UI components

To restore any component, copy from `legacy-src-backup/` and ensure its dependencies are listed in `package.json`.
