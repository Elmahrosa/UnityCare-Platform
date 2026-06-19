# UnityCare Platform — Deployment Guide

## Architecture

```
┌─────────────────────┐       ┌──────────────────────┐
│  frontend (Next.js) │──────▶│  backend (FastAPI)   │
│  :3000              │       │  :8000               │
└─────────────────────┘       └──────┬───────────────┘
                                     │
                            ┌────────▼────────┐
                            │  PostgreSQL 16   │
                            │  :5432           │
                            └─────────────────┘
```

## Local Development

```bash
# Start all services
docker-compose up --build -d

# Verify
curl http://localhost:8000/health
curl http://localhost:3000/health
```

## Railway Deployment (Production)

### 1. Create Project
```bash
railway login
railway init --name "UnityCare Platform"
```

### 2. Add Services

**Backend:**
```bash
railway add --service backend
# Set root directory: ./backend
# Build: Dockerfile
# Start: ./start.sh
```

**Frontend:**
```bash
railway add --service frontend
# Set root directory: ./frontend
# Build: Dockerfile
# Start: node server.js
```

### 3. Add PostgreSQL
```bash
railway add --plugin postgresql
# Railway provides DATABASE_URL automatically
```

### 4. Configure Environment Variables

**Backend Service:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://` (Railway auto-provided) |
| `JWT_SECRET` | Generate via: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Generate via: `openssl rand -hex 16` |
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `["https://<frontend>.railway.app"]` |

**Frontend Service:**
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<backend>.railway.app/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://<frontend>.railway.app` |

### 5. Deploy
```bash
railway up --service backend
railway up --service frontend
```

### 6. Verify Health
```bash
curl https://<backend>.railway.app/health
curl https://<frontend>.railway.app/health
```

### 7. Run Migrations (if needed)
```bash
railway run --service backend alembic upgrade head
```

## Health Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Backend | `/health` | Primary + DB connectivity |
| Backend | `/status` | Detailed service status |
| Backend | `/version` | Version info |
| Frontend | `/health` | Frontend health |
| Frontend | `/status` | Frontend status |
| Frontend | `/version` | Frontend version |

## Production Checklist

- [ ] JWT_SECRET generated (48+ chars)
- [ ] ENCRYPTION_KEY generated (32 bytes)
- [ ] CORS_ORIGINS set to production domain
- [ ] ENVIRONMENT=production
- [ ] DEBUG=false
- [ ] Railway PostgreSQL plugin added
- [ ] Health checks return healthy
- [ ] Backups configured (Railway auto-backups enabled)
- [ ] Monitoring set up (see MONITORING.md)
