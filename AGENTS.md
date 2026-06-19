# UnityCare Platform — Session Context

## Current Session (Jun 19, 2026)

### Completed — Railway Separation & Repo Cleanup

#### Infrastructure
- Separated UnityCare from TEOS/Sentinel into own Railway project **"UnityCare Production"**
- Deployed backend (FastAPI/Python 3.12, Dockerfile, 1 replica)
- Deployed frontend (Next.js 15, Dockerfile, 1 replica)
- Provisioned dedicated PostgreSQL 16 with daily auto-backups
- All 7 DB tables created and verified via `/health`
- Backend domain: `https://backend-production-9705.up.railway.app`
- Frontend domain: `https://frontend-production-c053.up.railway.app`
- Health/status/version endpoints all returning 200
- Railway healthchecks: backend 30s timeout, frontend 10s timeout
- Railway CLI v5.15.0 installed (npm global)

#### Landing Page (`website/index.html`)
- Added `data-ar-eyebrow`, `data-ar-h1`, `data-ar-hero-p`, `data-ar-specs`, `data-ar-nav` attributes
- Added `#audit` link to navbar
- Added favicon (`<link rel="icon" href="/favicon.ico" />`)
- Added OG image meta tag (`og:image`)
- Updated JS arrays to 6-element nav (includes Audit)

#### Repo Cleanup
- Made repo **private** (settings → change visibility)
- Purged `backend/.env.railway` and `frontend/.env.railway` from git history (filter-branch)
- Added `*.env.railway` to `.gitignore`
- Removed stale MongoDB database files, outdated docs, vestigial Node.js configs
- Rewrote root `.env.example`, `backend/README.md`, updated `.gitignore`
- Updated architecture diagrams

### Current State
- **Frontend**: Next.js App Router (landing, login, register, patient/doctor/admin dashboards)
- **Frontend lint**: ✅ 0 errors, 0 warnings (CI enforces)
- **TypeScript**: ✅ 0 errors (CI enforces)
- **Build**: ✅ Passes (Next.js 15.5.19 standalone)
- **Frontend tests**: 0 test files
- **Backend**: Python/FastAPI, PostgreSQL, Alembic (auto-create via `init_db()`)
- **Backend lint**: Cannot verify (Python not installed)

### Known Items for Next Time
1. Write frontend tests (Jest config exists but no test files; needs `ts-jest` + `@testing-library/jest-dom` in devDeps)
2. Backend lint: `pip install ruff && ruff check app/`
3. Add translation consumption from `i18n/messages/` (all text currently hardcoded English)
4. Migrate remaining pages from `legacy-src-backup/` as needed
5. 3 Dependabot moderate alerts on GitHub — review

## Key Decisions
- Railway CLI must be run from service subdirectory with `--path-as-root` flag for correct `railway.toml` detection
- Railway uses Railpack auto-detection, but Dockerfile builds with explicit `railway.toml` are more reliable
- DB tables auto-created via `init_db()` lifespan handler; Alembic used as fallback
- `railway.toml` files in `backend/` and `frontend/` are correct and match deployed configs
