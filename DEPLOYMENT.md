# UnityCare Platform — Production Deployment Guide

## Architecture (Docker Compose)

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  nginx:80   │────▶│  api:5000    │────▶│ mongo:27017│
│  (landing)  │     │  (Express)   │     │  (MongoDB) │
└─────────────┘     └──────────────┘     └───────────┘
┌─────────────┐
│ frontend:80 │
│  (React SPA)│
└─────────────┘
```

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+ (for local dev only)
- Git

## Quick Start

```bash
# Clone
git clone https://github.com/Elmahrosa/UnityCare-Platform.git
cd UnityCare-Platform

# 1. Configure environment
cp .env.example backend/.env
# Edit backend/.env with real secrets

# 2. Start all services
docker-compose up --build -d

# 3. Verify
curl http://localhost/health
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Landing Page | http://localhost/ | Marketing site |
| Frontend SPA | http://localhost:3000/ | React dashboard |
| API | http://localhost:5000/ | Backend API |
| MongoDB | localhost:27017 | Database (127.0.0.1 only) |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/refresh | No | Refresh token |
| POST | /api/auth/logout | JWT | Logout (invalidates token) |
| POST | /api/users/register | No | Register |
| GET | /api/users/me | JWT | Current user |
| PUT | /api/users/update | JWT | Update profile |
| GET | /api/users | JWT+Admin | List users |
| POST | /api/appointments | JWT | Create appointment |
| GET | /api/appointments/patient/:id | JWT | Patient's appointments |
| GET | /api/appointments/doctor/:id | JWT | Doctor's appointments |
| PATCH | /api/appointments/:id | JWT | Update appointment |
| DELETE | /api/appointments/:id | JWT | Delete appointment |
| POST | /api/records | JWT+Doctor | Create medical record |
| GET | /api/records/patient/:id | JWT | Patient's records |
| GET | /api/records/:id | JWT | Single record |
| PATCH | /api/records/:id | JWT+Doctor | Update record |
| DELETE | /api/records/:id | JWT+Admin | Soft-delete record |
| GET | /api/records/patient/:id/export | JWT | GDPR export |
| GET | /api/analytics/trends | JWT+Admin | Health trends |
| GET | /api/analytics/stats | JWT+Admin | Appointment stats |

## Environment Variables (backend/.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | Yes | 5000 | API port |
| NODE_ENV | Yes | development | Environment |
| MONGODB_URI | Yes | mongodb://mongo:27017/unity_care_hospital | MongoDB connection |
| JWT_SECRET | Yes | — | 32+ char random string |
| JWT_REFRESH_SECRET | Recommended | JWT_SECRET + _refresh | Separate refresh secret |
| JWT_EXPIRES_IN | No | 1h | Access token expiry |
| CORS_ORIGIN | No | * | Allowed CORS origin |
| MONGO_USER | Yes | uch_admin | MongoDB user |
| MONGO_PASS | Yes | — | MongoDB password |

## Production Hardening Checklist

- [ ] Generate 48+ char JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN to specific domain
- [ ] Change MONGO_PASS from default
- [ ] Enable HTTPS via reverse proxy
- [ ] Uncomment HSTS header in nginx.conf
- [ ] Run `docker-compose up --build -d`
- [ ] Health check: `curl http://localhost/health`
- [ ] Enable monitoring (see MONITORING.md)

## Docker Compose Commands

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```
