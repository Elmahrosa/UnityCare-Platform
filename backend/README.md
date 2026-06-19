# UnityCare Backend

![Python](https://img.shields.io/badge/python-3.12-blue)
![FastAPI](https://img.shields.io/badge/framework-FastAPI-green)
![License](https://img.shields.io/badge/license-TESL%20v2.0-blue)

Backend API for the UnityCare healthcare trust platform.

Built with Python 3.12 + FastAPI, async PostgreSQL (SQLAlchemy + asyncpg), Redis, and OpenTelemetry.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Python 3.12 |
| Framework | FastAPI |
| Database | PostgreSQL 16 (async via asyncpg) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) |
| Cache | Redis |
| Monitoring | OpenTelemetry |

---

## API Modules

| Module | Route Prefix | Description |
|--------|-------------|-------------|
| Auth | `/api/v1/auth` | Login, Register, Refresh |
| Patients | `/api/v1/fhir/Patient` | FHIR R4 Patient CRUD |
| Consents | `/api/v1/consent` | Consent lifecycle with hash chaining |
| Audit | `/api/v1/audit` | Immutable audit log |
| Admin | `/api/v1/admin` | User management |

---

## Local Development

```bash
# Start dependencies
docker compose up -d postgres redis

# Install dependencies
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload --port 8000
```

---

## Docker Deployment

```bash
docker build -t unitycare-backend .
docker run -p 8000:8000 unitycare-backend
```

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | — | PostgreSQL connection (asyncpg) |
| JWT_SECRET | Yes | — | 64-char hex string |
| ENCRYPTION_KEY | Yes | — | 32-char hex string |
| ENVIRONMENT | No | development | production/development |
| REDIS_URL | No | redis://localhost:6379/0 | Redis connection |

---

## Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Service + database health |
| `/status` | Detailed status |
| `/version` | Version info |
