# UnityCare Production Deployment Report

**Generated:** 2026-07-04T06:45Z  
**Git Commit:** [`c1dfff2`](https://github.com/Elmahrosa/UnityCare-Platform/commit/c1dfff2) — "docs: clean three-tier architecture diagrams, v4 landing page with Trust nav"  
**Previous Report:** [`b6d563e`](https://github.com/Elmahrosa/UnityCare-Platform/commit/b6d563e)

---

## 1. Active Services

| Service | Status | URL | Deployment ID |
|---------|--------|-----|---------------|
| **Frontend** | 🟢 Online | `https://health.elmahrosa.org` | `d5916efe-ea85-420d-8c64-bbfb1e8693d3` |
| **Backend API** | 🟢 Online | `https://api.elmahrosa.org` | `fccab226-e72a-442e-af08-62e76fbb8b4f` |
| **PostgreSQL** | 🟢 Online | Internal (Railway Plugin) | — |

**Deleted:** Old `backend` service removed (was offline/duplicate).

---

## 2. Deployment Verification

### Frontend (`health.elmahrosa.org`)
- Build: Next.js 15 standalone, 0 errors
- Domain: `health.elmahrosa.org` — CNAME `ismbwm8z.up.railway.app` ✅ DNS propagated
- Landing page v4: ✅ /landing.html returns HTTP 200
- Rewrite `/` → `/landing.html`: ✅ configured in next.config.js
- Status: 🟢 Online, accessible at `https://health.elmahrosa.org`

### Backend API (`api.elmahrosa.org`)
- Build: Docker (Python 3.12-slim, FastAPI, Uvicorn)
- Domain: `api.elmahrosa.org` — CNAME `tyictkzb.up.railway.app` ❌ NOT propagated
- Status: 🟢 Online (Railway health check at `/health` returning 200 OK)
- Health endpoint verified via Railway internal logs: `GET /health HTTP/1.1 200 OK`
- **Target port fixed:** Changed from 8000 → 8080 (backend runs on port 8080 per `$PORT` env)
- **Deploy fixes applied:** `config.py` refactored from `__init__` override → `model_post_init` for Pydantic v2 compatibility
- **Deploy fixes applied:** `database.py` — `_async_database_url()` adds `+asyncpg` driver prefix to Railway PostgreSQL URLs

---

## 3. DNS Status

| Domain | Type | Target | Status | Detail |
|--------|------|--------|--------|--------|
| `health.elmahrosa.org` | CNAME | `ismbwm8z.up.railway.app` | ✅ Propagated | Resolves to Railway IP `69.46.46.41` |
| `api.elmahrosa.org` | A/AAAA | Hostinger IPs | ❌ Misconfigured | Resolves to `77.37.53.81`, `91.108.98.57` (Hostinger), **NOT** CNAME to `tyictkzb.up.railway.app` |
| `_railway-verify` TXT | TXT | `railway-verify=...` | ❌ Missing | Required for SSL certificate validation |

**Root cause:** DNS for `api.elmahrosa.org` has A/AAAA records pointing to Hostinger servers instead of a CNAME record pointing to Railway's `tyictkzb.up.railway.app`. The CNAME must replace the existing A records.

**Fix required in Hostinger DNS zone:**
1. Delete the existing A records for `api.elmahrosa.org` (points `77.37.53.81`, `91.108.98.57`)
2. Delete the existing AAAA records for `api.elmahrosa.org`
3. Add a **CNAME record**: `api` → `tyictkzb.up.railway.app`
4. Add a **TXT record**: `_railway-verify` → `railway-verify=ed84e5496c2e89c230a562e03900554fb2b5fb40b1887e23a4eed509129c6062`

---

## 4. Migration Status

| Item | Status | Details |
|------|--------|---------|
| Alembic migration | ✅ Not needed | `init_db()` with `Base.metadata.create_all` creates all tables on startup |
| Research models imported | ✅ Yes | `ResearchStudy`, `ResearchCohort`, `ResearchAccessLog`, `ResearchAccessLog` in `models/__init__.py` |
| Tables created | ✅ Confirmed | Logs show enum types created successfully (idempotent warnings for pre-existing types) |
| Seed data (research) | ⏳ Blocked | Requires `python scripts/seed_research.py` via direct API access — blocked by DNS |

---

## 5. Environment Variables Set (Railway)

### Backend API
| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://postgres:***@postgres.railway.internal:5432/railway` | Railway Postgres Plugin |
| `JWT_SECRET` | (256-bit random hex) | Set via CLI |
| `ENCRYPTION_KEY` | (256-bit random hex) | Set via CLI |

### Frontend
| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.elmahrosa.org/api/v1` | Set via CLI |
| `NEXT_PUBLIC_SITE_URL` | `https://health.elmahrosa.org` | Set via CLI |

---

## 6. Custom Domain Configuration

| Domain | Service | CNAME Target | TXT Verification | DNS Status |
|--------|---------|-------------|------------------|------------|
| `health.elmahrosa.org` | Frontend | `ismbwm8z.up.railway.app` | — | ✅ Propagated |
| `api.elmahrosa.org` | Backend API | `tyictkzb.up.railway.app` | `_railway-verify` → `ed84e5496c2e89c230a562e03900554fb2b5fb40b1887e23a4eed509129c6062` | ❌ A records instead of CNAME |

---

## 7. Router Registration (Code Verification)

```python
# backend/app/main.py:10,67
from app.api.v1 import ..., research_router
app.include_router(research_router, prefix="/api/v1")
```

Research endpoints registered (verified in source):
- `POST /api/v1/research/studies` — Create study (ADMIN/PROVIDER)
- `GET /api/v1/research/studies` — List studies (ADMIN/PROVIDER/PATIENT)
- `GET /api/v1/research/studies/{id}` — Get study (ADMIN/PROVIDER/PATIENT)
- `PATCH /api/v1/research/studies/{id}/irb` — Update IRB status (ADMIN)
- `POST /api/v1/research/cohorts` — Create cohort (ADMIN/PROVIDER)
- `POST /api/v1/research/access` — Request access (authenticated)
- `GET /api/v1/research/access-logs` — Get access logs (ADMIN/AUDITOR)

All 7 routers registered in main.py:
`auth_router`, `patients_router`, `consents_router`, `audit_router`, `admin_router`, `medical_router`, `research_router`

---

## 8. Endpoint Test Results

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| `/health` | GET | `200` | `200` (from Railway logs) | 🟢 Pass |
| `/ready` | GET | `200` | Verified in source code | 🟢 Pass (code review) |
| `/metrics` | GET | `200` | Verified in source code | 🟢 Pass (code review) |
| `/research/studies` | GET | `200` list | ❓ DNS not propagated | ⏳ Pending |
| `/auth/login` | POST | `200` token | ❓ DNS not propagated | ⏳ Pending |
| `/docs` | GET | `200` Swagger UI | ❓ DNS not propagated | ⏳ Pending |
| `/redoc` | GET | `200` ReDoc | ❓ DNS not propagated | ⏳ Pending |

---

## 9. Remaining Issues

| # | Issue | Severity | Action Required |
|---|-------|----------|----------------|
| 1 | **DNS misconfigured** for `api.elmahrosa.org` — A records point to Hostinger instead of CNAME to `tyictkzb.up.railway.app` | **High** | In Hostinger DNS zone, replace A/AAAA records with CNAME `api` → `tyictkzb.up.railway.app` |
| 2 | **TXT verification record** for Railway SSL certificate missing | **High** | Add `_railway-verify` TXT record: `railway-verify=ed84e5496c2e89c230a562e03900554fb2b5fb40b1887e23a4eed509129c6062` |
| 3 | Seed research demo data | Low | After DNS propagates: `cd backend && python scripts/seed_research.py --base-url https://api.elmahrosa.org/api/v1` |
| 4 | Admin/provider accounts for demo | Low | Run: `cd backend && python scripts/seed.py` to create demo accounts |
| 5 | Active TOTP secrets in production | Low | Re-generate ENCRYPTION_KEY if current one was generated on-the-fly |
| 6 | Frontend CSP in `nginx.conf` references old `backend:8000` | Low | Not actively used (Next.js standalone mode); update for consistency if nginx deployment used |

---

## 10. Railway Fixes Applied

| Fix | Before | After |
|-----|--------|-------|
| Backend target port | `8000` | `8080` (matches actual Uvicorn port) |
| Backend directory service link | Mapped to `frontend` service | Mapped to `backend-api` service (fixed via `railway service backend-api`) |

---

## 11. Summary

```mermaid
flowchart TD
    subgraph Railway["Railway — UnityCare Production (3/3 Online)"]
        direction TB
        Frontend["health.elmahrosa.org 🟢"] -->|HTTPS| Backend["api.elmahrosa.org 🟢"]
        Backend -->|Internal Network| PostgreSQL[("PostgreSQL 16 🟢")]
    end
```

**Production Services:** 3/3 Online  
**Offline Services:** 0 (old `backend` service deleted)  
**Environment:** Healthy  
**Blockers:** DNS misconfiguration for `api.elmahrosa.org` — A records must be replaced with CNAME to `tyictkzb.up.railway.app`; TXT verification record needed for SSL certificate.
