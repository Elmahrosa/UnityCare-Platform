# Architecture Overview
**UnityCare Platform — Technical Brief**
*Elmahrosa International*

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Python 3.12 |
| Framework | FastAPI |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Frontend | Next.js 15 (React 19) |
| Auth | JWT (python-jose, bcrypt) |
| Cache | Redis |
| Monitoring | OpenTelemetry, health endpoints |
| Containerization | Docker |
| Hosting | Railway |

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              Railway Cloud                   │
│                                              │
│  ┌──────────┐    ┌──────────────────────┐   │
│  │ Frontend │───▶│   FastAPI Backend    │   │
│  │ Next.js  │    │   Python 3.12        │   │
│  │ :3000    │    │   Port 8000          │   │
│  └──────────┘    └──────────┬───────────┘   │
│                             │               │
│                  ┌──────────▼───────────┐   │
│                  │   PostgreSQL 16      │   │
│                  │   7 tables           │   │
│                  └──────────────────────┘   │
│                                              │
│  Health Endpoints:                           │
│  /health  /status  /version                  │
└─────────────────────────────────────────────┘
```

## Database Schema (7 tables)

| Table | Purpose |
|-------|---------|
| users | User accounts, roles, MFA |
| roles | RBAC permissions |
| patients | FHIR R4 patient records |
| sessions | JWT refresh tokens |
| consents | Consent lifecycle with versioning |
| consent_versions | Immutable consent history |
| audit_events | Hash-chained audit log |
