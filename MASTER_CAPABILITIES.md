# UnityCare Platform — Master Capabilities Registry

> Single source of truth for all product claims.
> Every capability below maps to source code, documentation, or a roadmap item.
> No marketing claim should appear on any external surface without matching this registry.

**Owner:** Elmahrosa International  
**Updated:** 2026-06-18  
**Repos:** `Elmahrosa/UnityCare-Platform` (active), `Elmahrosa/U_C_H2` (archived)  
**Deployment:** `health.elmahrosa.org` | `api.elmahrosa.org` | `developers.elmahrosa.org`

---

## Status Definitions

| Status         | Meaning                                                        |
|----------------|----------------------------------------------------------------|
| **Live**       | Running in production. Accessible via public URL.              |
| **Pilot**      | Working but limited to specific deployments / early users.     |
| **In Dev**     | Code exists. May be incomplete, stubbed, or not yet deployed.  |
| **Planned**    | Documented in roadmap. No implementation started.              |
| **Research**   | Future concept. Not on active roadmap.                         |

---

## 1. Identity & Access

| Capability | Status | Evidence |
|---|---|---|
| User Registration | **Live** | `backend/app/api/v1/auth.py` — `POST /auth/register` |
| User Login | **Live** | `backend/app/api/v1/auth.py` — `POST /auth/login` |
| JWT Access Tokens | **Live** | `backend/app/services/auth.py` — access/refresh token pair |
| JWT Refresh Tokens | **Live** | `backend/app/services/auth.py` — `POST /auth/refresh` |
| Token Blacklist (logout) | **Live** | `backend/app/services/auth.py` — `POST /auth/logout` |
| Role-Based Access Control | **Live** | `backend/app/middleware/auth.py` — role enums + middleware |
| Rate Limiting | **Live** | `backend/app/middleware/rate_limit.py` — per-minute configurable |
| bcrypt Password Hashing | **Live** | `backend/app/utils/security.py` — `hash_password`, `verify_password` |
| MFA Scaffold | **In Dev** | `backend/app/utils/security.py` — `verify_totp` exists, no UI |
| OAuth (Google/GitHub) | **Research** | Not implemented. No code found. |

## 2. Patient Records & FHIR

| Capability | Status | Evidence |
|---|---|---|
| FHIR R4 Patient Create | **Live** | `backend/app/services/fhir.py` — `create_patient()` |
| FHIR R4 Patient Read | **Live** | `backend/app/services/fhir.py` — `get_patient()`, `get_patient_by_uuid()` |
| FHIR R4 Patient Update | **Live** | `backend/app/services/fhir.py` — `update_patient()` with version tracking |
| FHIR R4 Patient Delete (soft) | **Live** | `backend/app/services/fhir.py` — `delete_patient()` sets `is_active=False` |
| FHIR R4 Patient Search | **Live** | `backend/app/services/fhir.py` — `search_patients()` |
| Patient API Routes | **Live** | `backend/app/api/v1/patients.py` — CRUD endpoints |
| FHIR JSONB Storage | **Live** | `backend/app/models/patient.py` — `fhir_resource` column as JSONB |
| Patient Version History | **In Dev** | Version ID tracked. No dedicated version query endpoint |
| FHIR Resource Validation | **In Dev** | Schema loaded. Validation logic exists but minimal |

## 3. Consent Engine

| Capability | Status | Evidence |
|---|---|---|
| Consent Create | **Live** | `backend/app/services/consent.py` — `create_consent()` with purpose, jurisdiction, expiry |
| Consent Versioning | **Live** | `backend/app/services/consent.py` — auto-creates version on every change |
| Consent Revoke | **Live** | `backend/app/services/consent.py` — `revoke_consent()` with audit trail |
| Consent Query (by patient) | **Live** | `backend/app/services/consent.py` — `get_patient_consents()` |
| Consent Query (by ID) | **Live** | `backend/app/services/consent.py` — `get_consent()` |
| Version History | **Live** | `backend/app/services/consent.py` — `get_consent_versions()` |
| Hash-Chained Signatures | **Live** | `backend/app/utils/hashing.py` — `compute_consent_hash()` |
| Consent API Routes | **Live** | `backend/app/api/v1/consents.py` — full CRUD + revoke |
| Consent Policy Reference | **In Dev** | Policy ID field exists. No policy engine |
| Automated Consent Enforcement | **Planned** | Roadmap. No runtime enforcement code |

## 4. Audit Ledger

| Capability | Status | Evidence |
|---|---|---|
| Immutable Hash-Chained Audit | **Live** | `backend/app/services/audit.py` — SHA-256 hash chain with previous_hash linking |
| Event Logging | **Live** | `backend/app/services/audit.py` — `log_event()` with action, resource, actor, IP |
| Chain Verification | **Live** | `backend/app/services/audit.py` — `verify_chain()` validates full chain integrity |
| Event Query / Filter | **Live** | `backend/app/services/audit.py` — `get_events()` with actor/action/resource filters |
| Audit API Routes | **Live** | `backend/app/api/v1/audit.py` — paginated query + chain verification |
| HMAC Event Signing | **Live** | `backend/app/utils/hashing.py` — `compute_event_hash()` with HMAC |

## 5. API & Infrastructure

| Capability | Status | Evidence |
|---|---|---|
| REST API (FastAPI) | **Live** | `backend/app/main.py` — FastAPI app with CORS, rate limiting, health |
| API Versioning (v1) | **Live** | `backend/app/api/v1/` — namespaced routes |
| OpenAPI / Swagger Docs | **Live** | FastAPI auto-generates at `/docs` |
| Health Check | **Live** | `backend/app/main.py` — `GET /health` returns `{"status":"healthy"}` |
| PostgreSQL 16 | **Live** | `docker-compose.yml` — production database |
| Redis 7 Cache | **Live** | `docker-compose.yml` — session + rate-limit cache |
| Docker Compose | **Live** | `docker-compose.yml` — full stack orchestration |
| Dockerfile (backend) | **Live** | `backend/Dockerfile` — python:3.12-slim multi-stage |
| Dockerfile (frontend) | **Live** | `frontend/Dockerfile` — node:20-alpine standalone |
| Railway Deployment | **Live** | `backend/railway.toml`, `frontend/railway.toml` |
| Rate Limiting Middleware | **Live** | `backend/app/middleware/rate_limit.py` |
| CORS with Origin Whitelist | **Live** | `backend/app/main.py` — configurable via `settings.cors_origins` |
| OpenTelemetry | **Live** | `backend/app/main.py` — conditional OTLP export on startup |

## 6. Frontend

| Capability | Status | Evidence |
|---|---|---|
| Landing Page | **Live** | `index.html` — hosted at `health.elmahrosa.org` |
| Next.js 15 App Shell | **In Dev** | `frontend/` — app directory structure, routing |
| shadcn/ui Component Library | **Live** | 65+ components in `frontend/src/components/ui/` |
| Theme (light/dark mode) | **Live** | `frontend/src/contexts/ThemeContext.tsx` |
| Dashboard Layout | **Live** | `frontend/src/components/DashboardLayout.tsx` — sidebar + header |
| Login Page | **In Dev** | `frontend/src/pages/LoginPage.tsx` — role selection shell |
| Register Page | **In Dev** | `frontend/app/[locale]/register/page.tsx` |
| Admin Dashboard | **In Dev** | `frontend/src/pages/admin/Dashboard.tsx` — stub |
| Patient Dashboard | **In Dev** | `frontend/src/pages/patient/Dashboard.tsx` — partial |
| Doctor Dashboard | **In Dev** | `frontend/src/pages/doctor/Dashboard.tsx` — partial |
| i18n (English) | **Live** | `frontend/i18n/messages/en.ts` — full translation set |
| i18n (Arabic) | **Live** | `frontend/i18n/messages/ar.ts` — full translation set |
| i18n (next-intl) | **In Dev** | `frontend/package.json` — dependency installed, routes configured |

## 7. Admin & Operations

| Capability | Status | Evidence |
|---|---|---|
| User Management API | **Live** | `backend/app/api/v1/admin.py` — list users, assign roles |
| Get Current User | **Live** | `backend/app/api/v1/admin.py` — `GET /users/me` |
| Audit Log Viewer API | **Live** | `backend/app/api/v1/audit.py` — paginated query |
| Alembic Migrations | **Live** | `backend/alembic/versions/001_initial_schema.py` — all tables |
| Prometheus Metrics | **In Dev** | `infra/prometheus.yml` — config only |
| Grafana Dashboards | **In Dev** | `infra/grafana/datasources/prometheus.yml` — config only |

## 8. Compliance & Security

| Capability | Status | Evidence |
|---|---|---|
| JWT with Refresh Rotation | **Live** | `backend/app/services/auth.py` — rotation on refresh |
| bcrypt (12 rounds) | **Live** | `backend/app/utils/security.py` |
| HTTPS Enforcement | **Live** | Railway edge — TLS termination |
| Hash-Chained Audit Integrity | **Live** | Tamper-evident chain with SHA-256 + HMAC |
| GDPR Soft-Delete | **Live** | `backend/app/models/patient.py` — `is_active` flag |
| HIPAA-Aligned Architecture | **Documented** | `docs/COMPLIANCE.md` — no formal audit performed |
| GDPR-Aligned Architecture | **Documented** | `docs/COMPLIANCE.md` — controls documented |
| EHDS Compliance | **Planned** | `README.md` — roadmap item |
| SMART-on-FHIR | **Planned** | `README.md` — roadmap item |
| SOC 2 / ISO 27001 / HITRUST | **Planned** | `docs/COMPLIANCE.md` — certification roadmap |
| Penetration Testing | **Planned** | Not yet performed. |
| CPN Membership | **Live** | Elmahrosa International is a registered CPN member |

## 9. Clinical Modules

| Capability | Status | Evidence |
|---|---|---|
| Appointment Scheduling | **In Dev** | `modules/hospital-core/backend/src/routes/appointments.js` — Express-based |
| Telehealth / Video Consultation | **Research** | Archive references only. No production code. |
| Pharmacy Operations | **Research** | Archive references only. No production code. |
| Emergency Dispatch | **Research** | Archive references only. |
| IoT / Wearable Integration | **Research** | Archive references only. |
| Bed / Room Management | **Research** | Archive references only. |

## 10. Planned / Roadmap

| Capability | Status | Evidence |
|---|---|---|
| NPHIES Integration | **Planned** | `README.md` |
| Malaffi / NABIDH Integration | **Planned** | `README.md` |
| CDS Hooks | **Planned** | `README.md` |
| Knowledge Graph | **Planned** | `README.md` |
| Digital Twin | **Planned** | `README.md` |
| AI Governance Layer | **Planned** | `README.md` |
| Marketplace | **Planned** | `README.md` |
| Terminology Service | **Planned** | `README.md` |
| EMPI | **Planned** | `README.md` |
| HL7v2 / DICOM | **Planned** | `README.md` |

---

## Cross-Reference: External Surfaces

| Surface | Aligned? | Notes |
|---------|----------|-------|
| `health.elmahrosa.org` landing page | Yes | This registry is the source for all copy |
| `README.md` | Needs audit | README references planned items as if close |
| `docs/` directory | Needs audit | Many docs reference legacy/archived features |
| `Elmahrosa/U_C_H2` (archived) | N/A | Archived. Not used for current claims. |

## Usage Rules

1. Every public claim must trace to a row in this registry.
2. Website, README, docs, investor deck, and marketing materials must cross-reference this file.
3. When a status changes, update this file first, then propagate to all surfaces.
4. Adding a new capability requires a code or doc reference before listing it publicly.
