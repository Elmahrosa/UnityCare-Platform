# UnityCare Platform — Session Context

## Current Session (Jun 18, 2026)

### Completed — Frontend Migration & Audit Fixes

#### Architecture
- Audited dual architecture (Next.js `app/` + SPA `src/`)
- Chose **Next.js App Router** as canonical frontend
- Migrated business-critical SPA logic to Next.js structure
- Archived `src/` → `legacy-src-backup/`

#### Migrated Files (SPA → Next.js)
| From | To | Notes |
|------|----|-------|
| `src/services/apiService.js` | `lib/api.js` | Rewrote with `fetch()` instead of Axios |
| `src/_core/hooks/useAuth.ts` | `hooks/useAuth.ts` | Rewrote to use `lib/api.js` |
| `src/components/ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | Simplified, removed lucide-react dep |
| `src/pages/doctor/Dashboard.tsx` | `app/[locale]/doctor/page.tsx` | Rewritten with plain Tailwind HTML |
| `src/pages/patient/Dashboard.tsx` | Enhanced `app/[locale]/patient/page.tsx` | Added IoT vitals section |

#### Removed / Cleaned
- `webpack.config.js` (SPA build, conflicted with Next.js)
- `public/index.html` (SPA entry point)
- `public/locales/` (duplicate i18n JSON; `i18n/messages/` retained)
- `i18n/routing.ts`, `i18n/request.ts` (depended on uninstalled `next-intl`)
- `backend/node_modules/` (orphaned, no `package.json`)
- `backend/jest.config.js`, `backend/.eslintrc.json` (vestigial Node.js configs)
- `frontend/coverage/` (test artifact)
- Removed `next-intl`, `lucide-react`, `clsx` from `frontend/package.json` (not used by app/)
- Removed `psycopg2-binary` from `backend/requirements.txt` (unused sync driver)

#### Backend Fixes
- `alembic/env.py`: fixed async connection (was using sync `.connect()` on async engine)
- `nginx.conf`: fixed proxy_pass port mismatch (5000→8000) + service name (api→backend)
- Updated CSP `connect-src` in nginx.conf

#### CI Fixes
- Removed `|| true` suppression from `frontend-lint` (now fails on lint errors)
- Added `frontend-type-check` job running `npm run type-check`
- Updated deploy `needs:` to include type-check

### Current State
- **Frontend**: Single architecture (Next.js App Router). Pages: landing, login, register, patient dashboard, doctor dashboard, admin dashboard
- **Frontend lint**: ✅ 0 errors, 0 warnings
- **TypeScript**: ✅ 0 errors
- **Build**: ✅ Passes (Next.js 15.5.19 standalone)
- **Frontend tests**: 0 test files
- **Backend**: Python/FastAPI, PostgreSQL, Alembic corrected
- **Backend lint**: Cannot verify (Python not installed on this machine)

### Known Items for Next Time
1. Write frontend tests (Jest config exists but no test files, needs `ts-jest` and `@testing-library/jest-dom` in devDeps)
2. Backend lint: `pip install ruff && ruff check app/`
3. Backend README still references Node.js/Express — needs rewrite for Python/FastAPI
4. Add translation consumption from `i18n/messages/` (all text currently hardcoded English)
5. Migrate remaining pages from `legacy-src-backup/` as needed
