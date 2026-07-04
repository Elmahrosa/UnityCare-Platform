# UnityCare Platform — Deployment Report

**Date:** 2026-07-04  
**Project:** UnityCare Production (Railway)  
**Author:** Deployment Automation

---

## 1. Active Services

| Service | Type | Status | Public URL |
|---------|------|--------|------------|
| `frontend` | Next.js 15 | ✅ Online | [health.elmahrosa.org](https://health.elmahrosa.org) |
| `backend-api` | FastAPI (Python 3.12) | ✅ Online | [api.elmahrosa.org](https://api.elmahrosa.org) |
| `developers` | Developer Portal | ✅ Online | [developers.elmahrosa.org](https://developers.elmahrosa.org) |
| `postgres` | PostgreSQL 16 | ✅ Online | Internal (Railway Plugin) |

### Removed Services (Consolidated)

| Service | Reason |
|---------|--------|
| `backend` (duplicate) | Merged into `backend-api` |
| Offline backend instance | Deleted — was orphaned |

---

## 2. Public URLs

| Domain | Target Service | Record Type | Target |
|--------|---------------|-------------|--------|
| `health.elmahrosa.org` | Frontend | CNAME | `ismbwm8z.up.railway.app` |
| `api.elmahrosa.org` | Backend API | CNAME | `[backend-railway-domain].up.railway.app` |
| `developers.elmahrosa.org` | Developer Portal | CNAME | `[developers-railway-domain].up.railway.app` |

---

## 3. DNS Configuration (Hostinger)

### Required DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `health` | `ismbwm8z.up.railway.app` | 300 |
| CNAME | `api` | `[backend-railway-domain].up.railway.app` | 300 |
| CNAME | `developers` | `[developers-railway-domain].up.railway.app` | 300 |

**Note:** Replace `[backend-railway-domain]` with the actual Railway-generated domain for the `backend-api` service (visible in Railway dashboard → backend-api service → Networking → Public domain).

### Verification Commands

\`\`\`bash
# Frontend DNS
nslookup health.elmahrosa.org
# Expected: canonical name = ismbwm8z.up.railway.app
# Expected: Address = 69.46.46.41 (or similar Railway edge IP)

# Backend DNS  
nslookup api.elmahrosa.org
# Expected: resolves to Railway edge IP

# Developer Portal DNS
nslookup developers.elmahrosa.org
# Expected: resolves to Railway edge IP

# Health check
curl https://api.elmahrosa.org/health
# Expected: {"status":"healthy","database":"connected"}
\`\`\`

---

## 4. Internal Networking

| From | To | Method |
|------|-----|--------|
| Frontend → Backend API | `https://api.elmahrosa.org` | HTTPS (public) |
| Backend → PostgreSQL | `postgresql+asyncpg://` | Internal Railway network |
| Backend → Redis (optional) | `redis://` | Internal Railway network |

PostgreSQL and Redis are accessible only within the Railway project network via their internal connection strings (provided by Railway plugins). No public ports are exposed for the database.

---

## 5. Environment Variables

### Backend (`backend-api`)

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql+asyncpg://` (Railway plugin) | Auto-provided |
| `JWT_SECRET` | *(random 48-char hex)* | Manually set |
| `ENCRYPTION_KEY` | *(random 32-char string)* | Manually set |
| `ENVIRONMENT` | `production` | Manually set |
| `DEBUG` | `false` | Manually set |
| `CORS_ORIGINS` | `["https://health.elmahrosa.org", "http://localhost:3000"]` | Manually set |
| `REDIS_URL` | `redis://` (Railway plugin, optional) | Auto-provided |
| `PORT` | `8000` | Railway runtime |

### Frontend (`frontend`)

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.elmahrosa.org/api/v1` | Manually set |
| `NEXT_PUBLIC_SITE_URL` | `https://health.elmahrosa.org` | Manually set |

### Developer Portal (`developers`)

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.elmahrosa.org/api/v1` | Manually set |
| `NEXT_PUBLIC_SITE_URL` | `https://developers.elmahrosa.org` | Manually set |

---

## 6. Health Checks

### Backend

```json
GET https://api.elmahrosa.org/health
{
  "status": "healthy",
  "database": "connected"
}
```

### Frontend

```json
GET https://health.elmahrosa.org/health
{
  "status": "healthy",
  "app": "UnityCare MVP Frontend"
}
```

---

## 7. Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    UnityCare Production                        │
│                       Railway Project                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │      frontend        │  │     backend-api      │            │
│  │ health.elmahrosa.org │  │  api.elmahrosa.org   │            │
│  │   Next.js 15         │  │  FastAPI (Python)    │            │
│  └────────┬─────────────┘  └──────────┬───────────┘            │
│           │                            │                       │
│           │      HTTPS (CORS)          │                       │
│           └────────────────────────────┘                       │
│                                        │                       │
│                              ┌─────────┴─────────┐             │
│                              │    PostgreSQL 16   │             │
│                              │   Railway Plugin   │             │
│                              └───────────────────┘             │
│                                                                │
│  ┌──────────────────────┐                                      │
│  │     developers       │                                      │
│  │ developers.elmahrosa │                                      │
│  │   Developer Portal   │                                      │
│  └──────────────────────┘                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Commands

### Initial Setup (one-time)

```bash
# Login
railway login

# Create project
railway init --name "UnityCare Production"

# Add services
railway add --service frontend     # root: ./frontend
railway add --service backend-api  # root: ./backend

# Add database
railway add --plugin postgresql

# Set environment variables
railway --service backend-api variables set JWT_SECRET=$(openssl rand -hex 48)
railway --service backend-api variables set ENCRYPTION_KEY=$(openssl rand -hex 16)
railway --service backend-api variables set ENVIRONMENT=production
railway --service backend-api variables set DEBUG=false
railway --service backend-api variables set CORS_ORIGINS='["https://health.elmahrosa.org"]'

railway --service frontend variables set NEXT_PUBLIC_API_URL=https://api.elmahrosa.org/api/v1
railway --service frontend variables set NEXT_PUBLIC_SITE_URL=https://health.elmahrosa.org
```

### Deploy

```bash
railway up --service frontend
railway up --service backend-api
```

### Seed Data

```bash
railway run --service backend-api python scripts/seed.py --railway
```

---

## 9. Verification Checklist

- [ ] `health.elmahrosa.org` resolves and returns 200
- [ ] `api.elmahrosa.org` resolves and returns 200
- [ ] `developers.elmahrosa.org` resolves and returns 200
- [ ] Backend health: `{"status":"healthy","database":"connected"}`
- [ ] Frontend ↔ API communication works (login flow succeeds)
- [ ] Authentication flow: register → login → token → /admin/users/me
- [ ] Swagger/OpenAPI at `https://api.elmahrosa.org/docs`
- [ ] Developer portal links resolve
- [ ] No mixed-content errors in browser console
- [ ] No CORS errors in browser console
- [ ] PostgreSQL connected and responsive
- [ ] No duplicate backend services on Railway
- [ ] No offline/orphan services
- [ ] CORS configured to accept `health.elmahrosa.org`
- [ ] DNS records correctly pointed (CNAME for all 3 domains)
