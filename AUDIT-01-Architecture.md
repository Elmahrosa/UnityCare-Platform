# AUDIT-01: Architecture & Repository Discovery

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User / Browser                        │
└───────────────┬──────────────────────────┬──────────────┘
                │                          │
                ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Root index.html         │   │  Frontend SPA            │
│  (Landing/Marketing)     │   │  (React + TypeScript)    │
│  Static HTML/CSS         │   │  Port 3000 (dev)         │
│  Port 80 (via Nginx)     │   │  /api/* → backend        │
└──────────────┬───────────┘   └──────────┬───────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────────────────────────────────┐
│                    Nginx (reverse proxy)                  │
│              Port 80 → /api/* → backend:5000             │
│              Security headers, gzip, caching              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)              │
│                    Port 5000                              │
│  ┌──────────┬──────────┬──────────┬──────────────────┐   │
│  │ Auth     │ Patients │ Appt     │ Telemedicine     │   │
│  │ JWT/RBAC │ CRUD     │ Schedule │ (placeholder)    │   │
│  ├──────────┼──────────┼──────────┼──────────────────┤   │
│  │ Pharmacy │Emergency │Blockchain│ Analytics/IoT    │   │
│  │ (stub)   │ (stub)   │ (stub)   │ (partial)        │   │
│  └──────────┴──────────┴──────────┴──────────────────┘   │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              MongoDB (primary database)                   │
│              Port 27017                                   │
│              Auth: MONGO_USER / MONGO_PASS                │
│              Databases: unity_care_hospital               │
└──────────────────────────────────────────────────────────┘
```

## Dependency Map

### Backend Dependencies
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| express | ^4.19.2 | Web framework | ✅ |
| mongoose | ^8.5.1 | MongoDB ODM | ✅ |
| bcrypt | ^5.1.1 | Password hashing | ✅ |
| jsonwebtoken | ^9.0.2 | JWT auth | ✅ |
| helmet | ^7.1.0 | Security headers | ✅ |
| cors | ^2.8.5 | CORS | ✅ |
| express-rate-limit | ^7.4.1 | Rate limiting | ✅ |
| express-validator | ^7.2.0 | Input validation | ✅ |
| morgan | ^1.10.0 | HTTP logging | ✅ |
| dotenv | ^16.4.5 | Env vars | ✅ |

### Backend Dev Dependencies
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| jest | ^29.7.0 | Testing | ✅ |
| nodemon | ^3.1.4 | Dev server | ✅ |
| supertest | ^7.0.0 | HTTP testing | ✅ |

### Frontend Dependencies
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| react | ^18.2.0 | UI framework | ✅ |
| react-dom | ^18.2.0 | DOM rendering | ✅ |
| react-router-dom | ^6.22.0 | Routing | ✅ |
| axios | ^1.6.7 | HTTP client | ✅ |
| tailwindcss | ^3.4.1 | CSS framework | ✅ |
| autoprefixer | ^10.4.16 | CSS vendor prefixes | ✅ |

### MISSING Frontend Dependencies (used in source, not in package.json)
| Package | Used In | Impact |
|---------|---------|--------|
| @tanstack/react-query | main.tsx, useAuth.ts | CRITICAL — app won't render |
| @trpc/react-query, @trpc/client | trpc.ts, useAuth.ts | CRITICAL — auth/RPC broken |
| lucide-react | 20+ components | HIGH — icons missing |
| @radix-ui/* (15+ packages) | All shadcn/ui components | HIGH — UI broken |
| clsx, tailwind-merge | utils.ts | HIGH — classnames broken |
| class-variance-authority | 10+ ui components | HIGH — variants broken |
| wouter | DashboardLayout.tsx | HIGH — routing broken |
| date-fns | ComponentShowcase.tsx | MEDIUM |
| recharts | chart.tsx | MEDIUM |
| embla-carousel-react | carousel.tsx | MEDIUM |
| react-day-picker | calendar.tsx | MEDIUM |
| react-hook-form | form.tsx | MEDIUM |
| sonner | sonner.tsx, ComponentShowcase.tsx | MEDIUM |
| vaul | drawer.tsx | MEDIUM |
| cmdk | command.tsx | MEDIUM |
| input-otp | input-otp.tsx | LOW |
| react-resizable-panels | resizable.tsx | LOW |
| next-themes | sonner.tsx | LOW |
| ai, @ai-sdk/react | AIChatBox.tsx | MEDIUM |
| streamdown, @streamdown/* | Markdown.tsx | LOW |
| vitest | main.test.ts | LOW |

## Service Inventory

| # | Service | Type | Lines | Status |
|---|---------|------|-------|--------|
| 1 | Backend API | Express REST | ~1,200 | Partial — runs but has issues |
| 2 | Frontend SPA | React + TypeScript | ~8,000 | BROKEN — won't compile |
| 3 | MongoDB | Database | N/A | Ready |
| 4 | Nginx | Reverse proxy | ~70 lines (2 configs) | Ready |
| 5 | Landing Page | Static HTML | index.html | ✅ |

## Infrastructure Requirements

| Component | Requirement | Source |
|-----------|------------|--------|
| Node.js | >= 20.0.0 | backend/package.json |
| MongoDB | 7+ | docker-compose.yml |
| Memory | 2GB+ | Docker default |
| Storage | 10GB+ (data volume) | MongoDB |
| Network | Bridge network (uch-network) | docker-compose.yml |

## Known Risks (Architectural)

| Risk ID | Description | Severity | Status |
|---------|-------------|----------|--------|
| ARCH-01 | website/ dir referenced in docker-compose & nginx.conf does NOT exist | BLOCKER | UNFIXED |
| ARCH-02 | No webpack.config.js or vite.config.js — frontend has no build config | BLOCKER | UNFIXED |
| ARCH-03 | frontend/src/App.js is a BACKEND auth controller, not a React component | CRITICAL | UNFIXED |
| ARCH-04 | database/schema.sql is actually a JS AppointmentService class | CRITICAL | UNFIXED |
| ARCH-05 | 53 shadcn/ui components missing 30+ NPM packages from package.json | CRITICAL | UNFIXED |
| ARCH-06 | frontend/src/const.ts imports @shared/const — path doesn't exist | CRITICAL | UNFIXED |
| ARCH-07 | frontend/src/lib/trpc.ts imports ../../../server/routers — doesn't exist | CRITICAL | UNFIXED |
| ARCH-08 | frontend/src/services/apiService.js is actually a README/license text file | CRITICAL | UNFIXED |
| ARCH-09 | 5 route modules are placeholders (status stubs) | HIGH | UNFIXED |
| ARCH-10 | Duplicate auth logic in controllers vs services | MEDIUM | UNFIXED |
| ARCH-11 | Root package.json has mismatched versions (Express ^5.2.1, React ^18.3.1) vs sub-projects | HIGH | UNFIXED |
| ARCH-12 | Root package.json lists 'next' ^16.2.1 as dependency — not used anywhere | SUSPICIOUS | UNFIXED |
| ARCH-13 | Root Dockerfile only copies server.js, ignores frontend entirely | MEDIUM | UNFIXED |
| ARCH-14 | Root nginx.conf references ./website dir that doesn't exist | BLOCKER | UNFIXED |
| ARCH-15 | Backend jest config matches tests/backend/**/* but tests are in tests/*.test.ts | BROKEN | UNFIXED |
| ARCH-16 | 2 test files use 'vitest' (import) but only jest is installed | BROKEN | UNFIXED |
