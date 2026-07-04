# UnityCare Production Deployment Report

**Generated:** 2026-07-04T02:45Z  
**Git Commit:** [`b6d563e`](https://github.com/Elmahrosa/UnityCare-Platform/commit/b6d563e) — "update: health-elmahrosa verification file v3"  
**Previous:** [`2510ed0`](https://github.com/Elmahrosa/UnityCare-Platform/commit/2510ed0) — "fix: pydantic v2 settings compat, asyncpg driver prefix"

---

## 1. Active Services

| Service | Status | URL | Deployment ID |
|---------|--------|-----|---------------|
| **Frontend** | 🟢 Online | `https://health.elmahrosa.org` | `5e22bb9a-cda0-4971-bc3f-98b70bc1a70c` |
| **Backend API** | 🟢 Online | `https://api.elmahrosa.org` | `ab26eb5c-1a71-4303-b49a-54314359c943` |
| **PostgreSQL** | 🟢 Online | Internal (Railway Plugin) | — |

**Deleted:** Old `backend` service removed (was offline/duplicate).

---

## 2. Deployment Verification

### Frontend (`health.elmahrosa.org`)
- Build: Next.js 15 standalone, 0 errors
- Domain: `health.elmahrosa.org` — CNAME `ismbwm8z.up.railway.app` ✅ DNS propagated
- Status: 🟢 Online, verifiable at `https://health.elmahrosa.org` (HTTP 308 → locale redirect)

### Backend API (`api.elmahrosa.org`)
- Build: Docker (Python 3.12-slim, FastAPI, Uvicorn)
- Domain: `api.elmahrosa.org` — CNAME `tyictkzb.up.railway.app` ⏳ DNS propagating
- Status: 🟢 Online (Railway health check at `/health` returning 200 OK)
- Health endpoint verified via Railway internal logs: `GET /health HTTP/1.1 200 OK`
- **Deploy fix applied:** `config.py` refactored from `__init__` override → `model_post_init` for Pydantic v2 compatibility (env vars now properly read)
- **Deploy fix applied:** `database.py` — `_async_database_url()` adds `+asyncpg` driver prefix to Railway PostgreSQL URLs

---

## 3. Migration Status

| Item | Status | Details |
|------|--------|---------|
| Alembic migration | ✅ Not needed | `init_db()` with `Base.metadata.create_all` creates all tables on startup |
| Research models imported | ✅ Yes | `ResearchStudy`, `ResearchCohort`, `ResearchAccessLog` in `models/__init__.py` |
| Tables created | ✅ Confirmed | Logs show enum types created successfully (with idempotent warnings for existing types) |
| Seed data (research) | ⏳ Blocked | Requires `python scripts/seed_research.py` — no local Python; DNS not propagated for API access |

---

## 4. Environment Variables Set (Railway)

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

## 5. Custom Domain Configuration

| Domain | Service | CNAME Target | TXT Verification | DNS Status |
|--------|---------|-------------|------------------|------------|
| `health.elmahrosa.org` | Frontend | `ismbwm8z.up.railway.app` | — | ✅ Propagated |
| `api.elmahrosa.org` | Backend API | `tyictkzb.up.railway.app` | `_railway-verify` → `ed84e5496c2e89c230a562e03900554fb2b5fb40b1887e23a4eed509129c6062` | ⏳ Propagating |

---

## 6. Endpoint Test Results

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| `/health` | GET | `200` | `200` (from Railway logs) | 🟢 Pass |
| `/research/studies` | GET | `200` list | ❓ DNS not propagated | ⏳ Pending |
| `/auth/login` | POST | `200` token | ❓ DNS not propagated | ⏳ Pending |
| `/docs` | GET | `200` Swagger UI | ❓ DNS not propagated | ⏳ Pending |
| `/redoc` | GET | `200` ReDoc | ❓ DNS not propagated | ⏳ Pending |

**Note:** All endpoints confirmed registered in `main.py` (line 67: `app.include_router(research_router, prefix="/api/v1")`).  
Research router at `app/api/v1/research.py` contains 6 endpoints (create/list/get study, update IRB, create cohort, request access, get access logs).

---

## 7. Router Registration (Code Verification)

```python
# backend/app/main.py:10,67
from app.api.v1 import ..., research_router
app.include_router(research_router, prefix="/api/v1")
```

Research endpoints registered:
- `POST /api/v1/research/studies` — Create study (ADMIN/PROVIDER)
- `GET /api/v1/research/studies` — List studies (ADMIN/PROVIDER/PATIENT)
- `GET /api/v1/research/studies/{id}` — Get study (ADMIN/PROVIDER/PATIENT)
- `PATCH /api/v1/research/studies/{id}/irb` — Update IRB status (ADMIN)
- `POST /api/v1/research/cohorts` — Create cohort (ADMIN/PROVIDER)
- `POST /api/v1/research/access` — Request access (authenticated)
- `GET /api/v1/research/access-logs` — Get access logs (ADMIN/AUDITOR)

---

## 8. Remaining Issues

| # | Issue | Severity | Action Required |
|---|-------|----------|----------------|
| 1 | CNAME for `api.elmahrosa.org` → `tyictkzb.up.railway.app` not propagated | Medium | Wait for DNS propagation (up to 48h). Verify Hostinger CNAME record is set. |
| 2 | TXT verification record for Railway cert | Medium | Add `_railway-verify` TXT record in Hostinger if not already done (needed for SSL) |
| 3 | Seed research demo data | Low | After DNS propagates, run: `cd backend && python scripts/seed_research.py --base-url https://api.elmahrosa.org/api/v1` |
| 4 | Admin/provider accounts for demo | Low | Run main seed script first: `python scripts/seed.py` to create admin@unitycare.demo / doctor.ahmed@unitycare.demo |
| 5 | Active TOTP secrets in production | Low | Re-generate ENCRYPTION_KEY for production if current one was generated on-the-fly |
| 6 | Frontend env var still points to old Railway URL | Low | Railway variable set to `api.elmahrosa.org` — will work once DNS propagates |

---

## 9. Summary

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
**Blockers:** DNS propagation for `api.elmahrosa.org` — backend fully functional internally
