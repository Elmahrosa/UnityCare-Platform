# Migration Notes — UnityCare Platform Consolidation

**Date**: 2026-05-12
**Consolidated repo**: UnityCare-Platform

## Repositories Merged

| # | Repository | Commits | Strategy |
|---|-----------|---------|----------|
| 1 | Unity-Care-Hospital-Sovereign | Base | Frontend + backend core + database + docs + CI/CD |
| 2 | UCH-Backend | Extracted | Replaced backend with cleaner API structure |
| 3 | UCH-Buyer-Kit | → `/infra` | Deployment kit, buyer docs, screenshots |
| 4 | salma-unity-care-hospital | Archived | Legacy assets extracted → `/archive/salma-legacy` |
| 5 | U_C_H2 | Archived | TS components merged → frontend; core archived → `/archive/uch2-legacy` |

## File Mapping

### Frontend (`/frontend`)
| Source | Destination |
|--------|------------|
| Unity-Care-Hospital-Sovereign/frontend/ | Base structure (App.js, components, pages, services, styles, hooks, utils) |
| U_C_H2/frontend/src/components/ui/ | `/frontend/src/components/ui/` (shadcn/ui component library) |
| U_C_H2/frontend/src/pages/admin/ | `/frontend/src/pages/admin/` (Analytics, Dashboard, Users) |
| U_C_H2/frontend/src/pages/doctor/ | `/frontend/src/pages/doctor/` (Consultations, Dashboard, PatientQueue, Prescriptions) |
| U_C_H2/frontend/src/pages/patient/ | `/frontend/src/pages/patient/` (Appointments, Dashboard, MedicalRecords, Prescriptions, Profile, TelehealthConsultation) |
| U_C_H2/frontend/src/pages/pharmacy/ | `/frontend/src/pages/pharmacy/` (Dashboard, Inventory, Prescriptions) |
| U_C_H2/frontend/src/pages/emergency/ | `/frontend/src/pages/emergency/` (Dispatch) |
| U_C_H2/frontend/src/_core/ | `/frontend/src/_core/` (hooks, types, utils) |
| U_C_H2/frontend/src/components/*.tsx | Various (AIChatBox, DashboardLayout, ErrorBoundary, ManusDialog, Map, Markdown) |
| U_C_H2/frontend/tsconfig.json | TypeScript config |
| U_C_H2/frontend/tailwind.config.js | Tailwind config |
| U_C_H2/frontend/postcss.config.js | PostCSS config |
| U_C_H2/frontend/.eslintrc.json | ESLint config (TypeScript) |
| U_C_H2/frontend/jest.config.js | Jest test config |
| U_C_H2/frontend/Dockerfile | Frontend Dockerfile |
| U_C_H2/frontend/nginx.conf | Nginx config |
| U_C_H2/frontend/package.json | Frontend package.json (TypeScript deps) |

### Backend (`/backend`)
| Source | Destination |
|--------|------------|
| UCH-Backend/ | Base backend (controllers, routes, services, models, middleware, config, utils) |
| U_C_H2/backend/pi/ | `/backend/pi/` (Pi Network integration) |
| U_C_H2/backend/web3-compat.test.ts | `/backend/tests/` |
| U_C_H2/backend/auth.logout.test.ts | `/backend/tests/` |

### Infra (`/infra`)
| Source | Destination |
|--------|------------|
| UCH-Buyer-Kit/ | Full contents (docs, assets, LICENSE) |

### Docs (`/docs`)
| Source | Destination |
|--------|------------|
| Unity-Care-Hospital-Sovereign/docs/ | Base docs structure |
| UCH-Buyer-Kit/docs/ | `/docs/institutional/` |
| salma-unity-care-hospital/docs/API/ | `/docs/api/` |
| salma-unity-care-hospital/docs/design/ | `/docs/design/` |
| U_C_H2/docs/ | Merged into `/docs/` |

### Archive (`/archive`)
| Source | Destination |
|--------|------------|
| salma-unity-care-hospital/ (selected) | `/archive/salma-legacy/` (pi-app, scripts, legacy JS modules) |
| U_C_H2/ (selected) | `/archive/uch2-legacy/` (_core, backend-core, branding-config, types) |

### Root Level
| Source | File |
|--------|------|
| Unity-Care-Hospital-Sovereign | `docker-compose.yml`, `Dockerfile`, `nginx.conf`, `vercel.json`, `package.json` |

## Config Alignment

| Config | Value |
|--------|-------|
| Frontend framework | React + TypeScript |
| Backend runtime | Node.js + Express |
| Database | MongoDB (primary) / PostgreSQL (secondary) |
| Auth | JWT (access + refresh tokens) |
| Styling | Tailwind CSS |
| Testing | Jest |
| CI/CD | GitHub Actions + Jenkins |
| Containerization | Docker / docker-compose |

## Env Vars Added

- `PI_API_KEY`, `PI_WALLET_ADDRESS` — Pi Network (from U_C_H2)
- `BLOCKCHAIN_PROVIDER_URL`, `SMART_CONTRACT_ADDRESS` — Blockchain (from U_C_H2/salma)
- `VIDEO_SDK_KEY`, `VIDEO_SDK_SECRET` — Telehealth (from salma)
- `MONGO_USER`, `MONGO_PASS` — MongoDB auth (from Sovereign)

## Post-Merge Steps

1. Run `npm install` in both `/frontend` and `/backend`
2. Copy `.env.example` → `backend/.env` and fill in values
3. Run database migrations: `cd database && npm run migrate`
4. Verify build: `cd frontend && npm run build`
5. Archive original repos on GitHub (salma-unity-care-hospital, U_C_H2 done)
6. Update Elmahrosa org README to point to this repo
