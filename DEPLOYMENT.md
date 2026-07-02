# UnityCare Platform — Deployment Guide

Sovereign healthcare infrastructure platform. Identity, consent, audit, and FHIR interoperability for regulated health environments.

---

## 1. Deployment Models

### Sovereign On-Premise
The platform can be deployed entirely within institutional data centres with no external dependency. All services run on internal infrastructure with PostgreSQL behind the institutional firewall. FHIR endpoints are bound to internal HIE networks. No telemetry or SaaS dependency is required — OpenTelemetry export is optional and can be disabled by omitting `OTEL_EXPORTER_OTLP_ENDPOINT`.

### Private Cloud (Railway / AWS / Azure / GCP)
Each service is containerised and cloud-agnostic. The reference production deployment targets Railway, but the same Docker images can run on ECS, AKS, GKE, or any container orchestrator. PostgreSQL is provisioned as a managed service (RDS, Cloud SQL, Railway Plugin). Redis is optional and used only for in-memory rate-limit state; the default sliding-window middleware degrades gracefully without Redis.

### Hybrid
The frontend (Next.js static export or Node server) can be served from a CDN or public cloud edge while the backend and database remain on-premise. CORS must be scoped to the frontend origin. Health check endpoints should not be exposed publicly — place them behind an internal reverse proxy or VPN.

### White-Label Institutional Deployment
Each tenant institution receives its own deployment. Environment variables control branding via `APP_NAME`. The database is isolated per instance. The seed script (`scripts/seed.py`) can be customised with institutional demo accounts and locally relevant ICD-10 codes. No multi-tenant isolation layer exists yet — each instance is fully isolated by deployment boundary.

---

## 2. Prerequisites

| Requirement      | Minimum Version | Notes                              |
| ---------------- | --------------- | ---------------------------------- |
| PostgreSQL       | 15+             | 16-alpine image used in Docker     |
| Python           | 3.12+           | 3.12-slim base image               |
| Node.js          | 22+             | 20-alpine for build, 22+ for runtime |
| npm              | 10+             | Ships with Node.js 22+             |
| Docker           | 24+             | Optional but recommended           |
| Railway CLI      | 3.x             | Only needed for Railway deployment |

---

## 3. Local Development Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env                                 # edit DATABASE_URL, JWT_SECRET, etc.
uvicorn app.main:app --reload --port 8000
```

The server starts on `http://localhost:8000`. Tables are auto-created on first startup via the `init_db()` lifespan handler. Health check at `GET /health`.

### Frontend

```bash
cd frontend
cp .env.example .env.local                           # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Opens at `http://localhost:3000`. Proxies API calls to the backend via `NEXT_PUBLIC_API_URL`.

### Seed Demo Data

```bash
# Backend must be running
cd backend
python scripts/seed.py
```

Creates 6 demo accounts (1 admin, 2 doctors, 3 patients), FHIR patient resources, consents, ICD-10 codes, vitals, appointments, and audit events. Idempotent — skips existing emails.

---

## 4. Docker Deployment

### Backend Multi-Stage

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["./start.sh"]
```

`start.sh` runs `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4`.

### Docker Compose

The root `docker-compose.yml` provisions PostgreSQL 16, Redis 7, backend, and frontend with development defaults. Bring up everything:

```bash
docker compose up --build -d
```

Environment variable overrides are in the compose file under each service's `environment` block.

### Building Individual Images

```bash
docker build -t unitycare-backend ./backend
docker build -t unitycare-frontend ./frontend
```

### Railway Configuration

Each service has its own `railway.toml`:

**Backend** (`backend/railway.toml`):

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "./start.sh"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "always"

[service]
name = "backend"
```

**Frontend** (`frontend/railway.toml`):

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 10

[service]
name = "frontend"
```

---

## 5. Production Hardening

### Environment Variables for Secrets

Never hardcode secrets. Always use environment variables or a secrets manager:

```bash
export JWT_SECRET=$(openssl rand -hex 48)
export ENCRYPTION_KEY=$(openssl rand -hex 16)
```

Rotate secrets on a schedule. The platform reads `JWT_SECRET` and `ENCRYPTION_KEY` from `Settings` (pydantic-settings) which resolves from env vars and `.env`.

### CORS Configuration

The `cors_origins` setting in `config.py` defaults to `["http://localhost:3000", "https://health.elmahrosa.org"]`. In production, set it to the exact frontend origin(s):

```
CORS_ORIGINS=["https://health.unitycare.gov.sa"]
```

Wildcard origins are not permitted when `allow_credentials=True`.

### Rate Limiting

A sliding-window in-memory rate limiter is applied via `RateLimitMiddleware`. Default: 60 requests/minute per IP+path. Health endpoints are exempt. Configure via:

```
RATE_LIMIT_PER_MINUTE=120
```

For distributed rate limiting, wire Redis-backed counters into the middleware. The current implementation uses an in-process dict — scale to multiple workers requires either Redis or sticking a single worker per instance.

### Security Headers

The `SecurityHeadersMiddleware` sets the following on every response:

| Header                          | Value                                    |
| ------------------------------- | ---------------------------------------- |
| `X-Content-Type-Options`        | `nosniff`                                |
| `X-Frame-Options`               | `DENY`                                   |
| `Strict-Transport-Security`     | `max-age=31536000; includeSubDomains`    |
| `Content-Security-Policy`       | `default-src 'self'`                     |
| `Cache-Control`                 | `no-store`                               |
| `Pragma`                        | `no-cache`                               |
| `Referrer-Policy`               | `strict-origin-when-cross-origin`        |
| `Permissions-Policy`            | `geolocation=(), microphone=(), camera()`|

The `nginx.conf` in the repo root mirrors these headers at the reverse-proxy layer for defense in depth.

### Database Connection Pooling

The async engine is created with:

```python
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
)
```

Tune `pool_size` and `max_overflow` based on expected concurrency. For Railway's default 256 MB PostgreSQL, `pool_size=10` is safer. Connection strings use `postgresql+asyncpg://`.

### OpenTelemetry Monitoring

When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, the lifespan handler initialises a `TracerProvider` with a `BatchSpanProcessor` exporting to the OTLP endpoint. FastAPI routes are auto-instrumented via `FastAPIInstrumentor.instrument_app(app)`. Telemetry is on by default when the env var is present — no code changes needed. To disable, leave the variable unset.

---

## 6. Database Setup

### Automatic Table Creation

The preferred method. The `init_db()` async function runs `Base.metadata.create_all` on every startup inside the lifespan handler. If tables already exist, the operation is a no-op. This is safe for both development and production, though schema migrations (renames, column type changes) require Alembic.

### Alembic Migrations (Fallback)

Alembic is configured in `backend/alembic.ini` with a `postgresql+asyncpg://` URL string. Existing migration scripts live in `backend/alembic/versions/`. To run:

```bash
cd backend
alembic upgrade head
```

For Railway deployments:

```bash
railway run --service backend alembic upgrade head
```

### Seed Script

```bash
cd backend
python scripts/seed.py                         # default localhost:8000
python scripts/seed.py --base-url https://api.production.com/api/v1
python scripts/seed.py --dry-run               # no-op preview
```

All seed operations are idempotent. The script registers users, logs in, creates FHIR Patient resources, consents, ICD-10 codes, vitals, appointments, and audit log entries. See `scripts/seed.py` for the full account list.

---

## 7. Railway Deployment

### Service Configuration

| Property     | Backend (FastAPI)                 | Frontend (Next.js)               |
| ------------ | --------------------------------- | -------------------------------- |
| Build        | `backend/Dockerfile`              | `frontend/Dockerfile`            |
| Start cmd    | `./start.sh`                      | `node server.js`                 |
| Healthcheck  | `/health` (30s timeout)           | `/health` (10s timeout)          |
| Restart      | `always`                          | `always`                         |
| Root dir     | `./backend`                       | `./frontend`                     |

### Steps

```bash
# 1. Login and create project
railway login
railway init --name "UnityCare Platform"

# 2. Add services
railway add --service backend     # set root dir to backend/
railway add --service frontend    # set root dir to frontend/

# 3. Add PostgreSQL plugin
railway add --plugin postgresql

# 4. Set backend env vars
railway --service backend variables set JWT_SECRET=$(openssl rand -hex 48)
railway --service backend variables set ENCRYPTION_KEY=$(openssl rand -hex 16)
railway --service backend variables set ENVIRONMENT=production
railway --service backend variables set DEBUG=false
railway --service backend variables set CORS_ORIGINS='["https://frontend.railway.app"]'

# 5. Set frontend env vars
railway --service frontend variables set NEXT_PUBLIC_API_URL=https://backend.railway.app/api/v1
railway --service frontend variables set NEXT_PUBLIC_SITE_URL=https://frontend.railway.app

# 6. Deploy
railway up --service backend
railway up --service frontend

# 7. Verify
curl https://backend.railway.app/health
curl https://frontend.railway.app/health
```

---

## 8. Backup and Disaster Recovery

### PostgreSQL Backup

Railway provides automated daily backups with 7-day retention by default. For additional safety:

```bash
# Manual backup
railway connect
pg_dump --no-owner --no-privileges -d "$DATABASE_URL" > unitycare-$(date +%Y%m%d-%H%M).sql

# Restore
psql -d "$DATABASE_URL" < unitycare-20260620-1200.sql
```

For on-premise deployments, schedule `pg_dump` via cron:

```bash
0 3 * * * pg_dump -Fc unitycare -f /backups/unitycare-$(date +\%Y\%m\%d).dump
```

### Audit Log Importance

Audit logs are stored in the `audit_logs` database table and are immutable by design (no UPDATE/DELETE paths exist in the API). Backups of this table are critical for compliance with Saudi NCA, HIPAA, and GDPR requirements. Consider exporting audit logs to a separate append-only storage (e.g., AWS S3 Object Lock or an immutable write-ahead log) for long-term retention beyond the database backup window.

### Recovery Objectives

| Objective  | Target | Notes                                   |
| ---------- | ------ | --------------------------------------- |
| RPO        | ≤ 24 h | Daily backup + point-in-time recovery   |
| RTO        | ≤ 1 h  | Restore from latest dump + run migrations |

Railway PostgreSQL supports point-in-time recovery (PITR) at the infrastructure level. For self-managed PostgreSQL, ensure `wal_level=replica` and archive WAL segments.

---

## 9. Monitoring

### Health Check Endpoints

| Service  | Endpoint    | Response Summary                              | Purpose                  |
| -------- | ----------- | --------------------------------------------- | ------------------------ |
| Backend  | `GET /health` | `{"status":"healthy","database":"connected"}` | Primary health + DB      |
| Backend  | `GET /status` | `{"app","version","environment","database"}`  | Detailed status          |
| Backend  | `GET /version` | `{"app","version":"1.0.0","framework":"FastAPI"}` | Version info        |
| Frontend | `GET /health` | `{"status":"healthy","app":"UnityCare MVP Frontend"}` | Frontend health    |
| Frontend | `GET /status` | `{"app","version":"1.0.0","framework":"Next.js"}` | Frontend status     |
| Frontend | `GET /version` | `{"app","version":"1.0.0","framework":"Next.js"}` | Frontend version    |

### OpenTelemetry Integration

Enable by setting:

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.uptrace.dev:4318
```

The platform exports traces for all FastAPI routes automatically. OTLP-compatible backends include Uptrace, Grafana Tempo, Jaeger, and Datadog.

### Logging

The logger name is `unitycare`. Log level is controlled by the `ENVIRONMENT` var (DEBUG when `development`, INFO otherwise). Output is plain text to stdout by default — redirect to a log aggregator (e.g., Logtail, Grafana Loki) in production.

### Uptime Monitoring

Recommended: Better Stack or UptimeRobot checking `GET /health` on both services every 5 minutes. Alert on 3 consecutive failures. See `MONITORING.md` for the full runbook.

---

## 10. Environment Variables Reference

### Backend

| Variable                     | Required | Default                          | Description                                    |
| ---------------------------- | -------- | -------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`               | Yes      | —                                | Full asyncpg connection string                 |
| `JWT_SECRET`                 | Yes      | —                                | HS256 signing key (min 48 hex chars)           |
| `ENCRYPTION_KEY`             | Yes      | —                                | Symmetric key for sensitive fields (32 bytes)  |
| `ENVIRONMENT`                | No       | `development`                    | Controls debug mode, log level, CORS           |
| `DEBUG`                      | No       | `true`                           | SQLAlchemy echo flag                           |
| `REDIS_URL`                  | No       | `redis://localhost:6379/0`       | Redis connection (optional)                    |
| `CORS_ORIGINS`               | No       | `["http://localhost:3000"]`      | JSON array of allowed origins                  |
| `JWT_ALGORITHM`              | No       | `HS256`                          | JWT signing algorithm                          |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No       | `15`                             | Short-lived token TTL                          |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | No       | `7`                              | Refresh token TTL                              |
| `RATE_LIMIT_PER_MINUTE`      | No       | `60`                             | Requests per IP+path per sliding window        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`| No       | —                                | OpenTelemetry OTLP gRPC/HTTP endpoint          |
| `OTEL_SERVICE_NAME`          | No       | `unitycare-mvp`                  | OpenTelemetry service name                     |
| `OIDC_CLIENT_ID`             | No       | —                                | OIDC client ID (optional SSO)                  |
| `OIDC_CLIENT_SECRET`         | No       | —                                | OIDC client secret (optional SSO)              |
| `FHIR_BASE_URL`              | No       | `http://localhost:8000/fhir`     | FHIR R4 base URL                               |
| `APP_NAME`                   | No       | `UnityCare MVP`                  | Branding name in status/version responses      |
| `PORT`                       | No       | `8000`                           | HTTP listen port (used by start.sh)            |

### Frontend

| Variable                | Required | Default                      | Description                        |
| ----------------------- | -------- | ---------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`   | Yes      | —                            | Backend API base URL               |
| `NEXT_PUBLIC_SITE_URL`  | Yes      | —                            | Frontend's own public URL          |
| `NEXT_TELEMETRY_DISABLED` | No    | `1` (set in Dockerfile)      | Disable Next.js telemetry          |

### Railway Plugin (Auto-Provided)

| Variable        | Source                        |
| --------------- | ----------------------------- |
| `DATABASE_URL`  | PostgreSQL plugin             |
| `RAILWAY_PUBLIC_DOMAIN` | Railway environment     |
| `PORT`          | Railway runtime (frontend)    |

---

*See also: `MONITORING.md` for the runbook, alert thresholds, and rollback procedures, and `docs/architecture-diagram.md` for the system context diagram.*
