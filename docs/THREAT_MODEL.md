# UnityCare Platform — Threat Model

**Document owner:** Elmahrosa International — Security Engineering  
**Date:** 2026-06-20  
**Version:** 1.0  
**Methodology:** STRIDE per asset/interaction  

---

## 1. System Overview

UnityCare is a sovereign healthcare trust infrastructure platform providing identity, consent management, and FHIR R4 interoperability for national/regional health systems.

| Layer | Technology | Key Components |
|-------|-----------|----------------|
| Frontend | Next.js 15 (React 19), Tailwind CSS, TypeScript 5.7 | `frontend/` — App Router, i18n (en/ar), mock data fallback |
| Backend API | Python 3.12, FastAPI, Pydantic V2 | `backend/app/` — 6 route modules, 5 service classes |
| Database | PostgreSQL via SQLAlchemy async + asyncpg | 7 models: `User`, `Patient`, `Consent`, `ConsentVersion`, `AuditEvent`, `MedicalRecord`, `IcdCode` |
| Auth | JWT (python-jose HS256), bcrypt, RBAC | `AuthService` in `services/auth.py`, 4 roles |
| Security | Rate limiting, 9 security headers, CORS, Pydantic validation | `middleware/rate_limit.py`, `middleware/security_headers.py` |
| Audit | SHA-256 hash chain | `AuditService` in `services/audit.py`, `AuditEvent` model |

**Users:** Patient, Provider (doctor), Admin, Auditor — each with distinct RBAC scoped via `require_role()`.

**Deployment:** Docker containers on Railway or on-premise; PostgreSQL managed separately.

---

## 2. Scope

**In scope:** All `backend/app/` Python code, `frontend/lib/api.ts` (API client + demo mode), JWT auth flow, consent lifecycle, audit chain, FHIR Patient CRUD, ICD-10-CM lookup, rate limiter, security headers.

**Out of scope:** Physical data center security, third-party OIDC providers, network-layer DDoS protection, browser extension threats, legacy `modules/hospital-core/`.

---

## 3. Architecture Diagram

```
┌──────────────┐     HTTPS      ┌──────────────────┐     TCP/5432     ┌────────────┐
│   Browser    │ ─────────────> │  FastAPI Server  │ ──────────────> │ PostgreSQL │
│ (Next.js 15) │ <───────────── │  (Uvicorn)       │ <────────────── │            │
└──────────────┘    JSON/HTTP   │                  │                 └────────────┘
       │                        │  Middleware:      │
       │                        │  ├─ CORSMiddleware│
       │  localStorage          │  ├─ RateLimit     │
       │  (JWT token)           │  ├─ SecurityHdrs  │
       │                        │  └─ Auth/JWT      │
       │                        │                   │
       └─── Demo Mode ──────────> mock-data.ts      │
            (on fetch fail)     │  (client-side)    │
                                └──────────────────┘
```

**Trust boundaries:**
1. **Browser ↔ API** — TLS terminates at reverse proxy; tokens exposed to JS via `localStorage`
2. **Between roles** — RBAC enforced at route level via `require_role()` decorator
3. **API ↔ Database** — All within Docker network (single trust domain)
4. **Demo mode** — Client-side mock data replaces backend; no server validation

---

## 4. Assets

| Asset | Description | Classification | Storage |
|-------|-------------|----------------|---------|
| Patient medical records | Diagnoses, labs, vitals, ICD-10 codes | **High** | `medical_records` table, `vitals` table |
| FHIR R4 resources | JSONB patient data | **High** | `patients.fhir_resource` |
| Consent records | Purpose-based consent with version history | **High** | `consents` + `consent_versions` tables |
| Audit chain | SHA-256 hash-linked immutable events | **High** | `audit_events` table |
| Credentials | bcrypt password hashes, JWT secrets | **Critical** | `users.password_hash`, `config.jwt_secret` |
| ICD-10 codes | Reference diagnostic codes | **Low** | `icd_codes` table |
| Session tokens | Refresh token hashes | **High** | `sessions` table |

---

## 5. Trust Boundaries

| Boundary | Description | Risk |
|----------|-------------|------|
| **B1: Client → API** | JWT in `Authorization` header; token stored in `localStorage` (XSS-vulnerable) | **High** — no httpOnly cookie option |
| **B2: Patient ↔ Provider** | Provider can read any patient's records; no patient-scoped row-level filter | **Medium** |
| **B3: Admin ↔ All data** | Admin role has unrestricted read/write across all resources | **High** |
| **B4: API ↔ DB** | Single connection string with full DDL/DML privileges; no least-privilege DB user | **Medium** |
| **B5: Demo mode** | Client-side fallback silently replaces real API responses on any network error | **Medium** — can mask real failures |

---

## 6. STRIDE Threat Table

### Spoofing

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| S1 | `POST /auth/login` (`auth.py:31`) | JWT key (`jwt_secret`) default `"change-me-in-production"` allows forged tokens | **High** | bcrypt password verification | Enforce non-default secret via startup validation; rotate quarterly |
| S2 | `AuthService.verify_token()` (`auth.py:65`) | No token revocation or blacklist — stolen JWT valid until expiry (15 min access, 7 day refresh) | **High** | — | Add token blacklist (Redis or DB); implement refresh token rotation |
| S3 | `POST /auth/register` (`auth.py:13`) | No email verification — attacker can register arbitrary accounts | **Medium** | — | Require email verification link before activation |

### Tampering

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| T1 | `PATCH /admin/users/{id}` (`admin.py:43`) | Admin can elevate own or other users' roles (no `role` field guard shown in `UserUpdate`) | **High** | RBAC on endpoint | Explicitly forbid `role` changes in `UserUpdate` schema; log role changes to audit |
| T2 | `PatientCreate.fhir_resource` stored as JSONB (`fhir.py:14`) | Arbitrary FHIR JSON accepted — no schema validation against FHIR R4 spec | **Medium** | Pydantic type check | Add FHIR R4 resource validation (e.g., `fhir.resources` library or custom validator) |
| T3 | `AuditEvent.details` (`audit.py:19`) is free-form JSONB | Audit trail can be polluted with garbage data by any authenticated actor hitting audited endpoints | **Low** | Audit is append-only | Schema-validate `details` per action type |

### Repudiation

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| R1 | `AuditService.log_event()` (`audit.py:13`) | SHA-256 chain relies on DB integrity — a DB admin with `UPDATE` privileges could rewrite history | **High** | Hash chain links events; `verify_chain()` detects breaks | DB user must have `INSERT ONLY` on `audit_events`; periodic external anchor (e.g., OpenTimestamps) |
| R2 | `AuditEvent.ip_address` (`audit.py:20`) | IP logged but not verified — actor can forge via `X-Forwarded-For` | **Medium** | — | Extract remote IP from `request.client.host` (not header); trust proxy chain |

### Information Disclosure

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| I1 | `GET /fhir/Patient` (`patients.py:13`) | Any authenticated user (including PATIENT) can list **all** patients with no row-level filter | **High** | RBAC on endpoint | Restrict `search_patients` to ADMIN/PROVIDER only; add patient-scoped filter for PATIENT role |
| I2 | `GET /records/patient/{id}` (`medical.py:177`) | Patient A can enumerate patient B's records by UUID if authenticated | **High** | RBAC on endpoint | Add ownership check: patient may only view own records |
| I3 | `/health`, `/status`, `/version` (`main.py:62-102`) | No auth on info endpoints — exposes DB connection status, environment, framework version | **Low** | — | Rate-limit; remove `environment` field from unauthenticated responses |
| I4 | `RateLimitMiddleware` (`rate_limit.py:6`) | In-memory dictionary per process — horizontal scaling loses rate state; IP-based key can leak user activity patterns | **Medium** | Sliding window per IP+path | Replace with Redis-backed rate limiter for distributed deployments |
| I5 | `localStorage` token storage (`api.ts:19-22`) | JWT accessible to any JavaScript running on the same origin — XSS yields full session hijack | **High** | CSP `default-src 'self'` | Migrate to `httpOnly` secure cookies with CSRF token for API auth |

### Denial of Service

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| D1 | `GET /icd-codes?q=` (`medical.py:192`) | No query length limit on `q` parameter — `LIKE` search on unindexed `description` column | **Medium** | Pydantic `min_length=1` | Add `max_length` constraint; add GIN/trigram index on `icd_codes.description` |
| D2 | `POST /auth/login` (`auth.py:31`) | Account lockout after 5 failures only locks for 15 min — no exponential backoff | **Medium** | `locked_until` field | Implement exponential backoff; add CAPTCHA after 3 failures |
| D3 | `GET /fhir/Patient` without pagination limits | `patients.py:13` uses `skip`/`limit` but no maximum for unscoped queries | **Low** | Default limit 20 | Enforce hard cap at DB query level (le=100 already present) |

### Elevation of Privilege

| # | Component | Threat | Impact | Controls | Mitigation |
|---|-----------|--------|--------|----------|------------|
| E1 | `require_role()` (`auth.py:28`) | PATIENT role can access consent endpoints including creating/modifying other patients' consents (`consents.py:13`) | **High** | Role check on endpoint | Add ownership guard: patient may only create/get/revoke their own consents |
| E2 | `PUT /fhir/Patient/{id}` (`patients.py:50`) | No consent check — provider can update a patient's FHIR resource even if patient revoked `treatment` consent | **High** | — | Check active `treatment` consent before allowing provider write operations |
| E3 | `POST /consent/{id}/revoke` (`consents.py:54`) | PATIENT role can revoke consent for **any** patient ID by passing consent_id in URL | **High** | RBAC on endpoint | Verify `consent.patient_id == current_user.id` for PATIENT role |
| E4 | Demo mode: `mockFallback()` (`api.ts:67`) | Any network error (CORS, timeout, DNS failure) silently returns mock data including admin-level responses | **Medium** | DEMO_MODE flag | Require explicit `?demo=true` query parameter; log demo mode usage to console |

---

## 7. Risk Ranking

| Rank | ID | Threat | Risk | Priority |
|------|----|--------|------|----------|
| 1 | E3 | Patient can revoke others' consents | **High** | **Critical** — fix immediately |
| 2 | I1/I2 | No row-level access control on patient/record queries | **High** | **Critical** — fix immediately |
| 3 | S1 | Hardcoded default JWT secret | **High** | **Critical** — fix before production |
| 4 | E2 | No consent check on provider write operations | **High** | **High** — next sprint |
| 5 | S2 | No token revocation mechanism | **High** | **High** — next sprint |

---

## 8. Mitigation Roadmap

| ID | Mitigation | Effort | Timeline | Owner |
|----|-----------|--------|----------|-------|
| E3, I1, I2 | Add ownership guard checks in all patient-scoped endpoints (`patients.py`, `medical.py`, `consents.py`) | 2 days | Sprint 1 | Backend |
| S1 | Start-up validation rejecting `"change-me-in-production"` JWT secret | 1 day | Sprint 1 | Backend |
| E2 | Check active `treatment` consent before FHIR writes by provider | 1 day | Sprint 2 | Backend |
| S2 | Redis-backed token blacklist + refresh token rotation | 3 days | Sprint 2 | Backend |
| I5 | Migrate token storage from `localStorage` to `httpOnly` secure cookies | 3 days | Sprint 3 | Fullstack |
| T2 | Add FHIR R4 schema validation for `fhir_resource` JSONB payloads | 2 days | Sprint 3 | Backend |
| R1 | DB user least-privilege (`INSERT ONLY` on `audit_events`); OpenTimestamps anchoring | 2 days | Sprint 4 | DevOps |
| I4 | Redis-backed distributed rate limiter | 2 days | Sprint 4 | Backend |
| T1 | Forbid role changes in `UserUpdate` Pydantic schema | 0.5 day | Backlog | Backend |
| S3 | Email verification flow for registration | 3 days | Backlog | Fullstack |
