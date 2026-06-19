# System Architecture

## High-Level Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │◄──►│   FastAPI        │◄──►│   PostgreSQL    │
│  (React/TS)     │    │  (Python 3.12)   │    │                  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Redis Cache    │    │   Alembic       │
│   /health       │    │   Rate Limiting  │    │   Migrations    │
│   /status       │    │   Sessions       │    │   (7 tables)    │
│   /version      │    └──────────────────┘    └─────────────────┘
└─────────────────┘
```

## Deployment (Railway)
```
UnityCare Production:
├── Backend  →  FastAPI :8000  →  PostgreSQL
├── Frontend →  Next.js :3000
└── Monitoring → /health, /status, /version
```
