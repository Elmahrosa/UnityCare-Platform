# UnityCare Platform — Session Context

## Current Session (Jul 4, 2026)

### Completed — Production Custom Domains + Documentation Update

1. **Hardcoded Railway URLs replaced** — 5 occurrences in `index.html` changed from `backend-production-9705.up.railway.app` to `api.elmahrosa.org`. Also updated `.github/workflows/deploy.yml`, `frontend/nginx.conf`, and `frontend/.env.example`.
2. **Developer portal documented** — Added `developers.elmahrosa.org` to `DEPLOYMENT_REPORT.md` (architecture diagram, DNS records, env vars, verification checklist), `DEPLOYMENT.md` (CNAME record, custom domain setup), `README.md`, and `AGENTS.md`.
3. **Frontend build** ✅ 0 errors — verified after all changes.

### Completed — Backend Tests, MFA Frontend, CSP, Railway Consolidation

1. **Backend tests (admin + research)** — Created `test_admin.py` (11 tests: me, list, get, update, RBAC) and `test_research.py` (14 tests: studies, cohorts, IRB, access, logs, compliance evaluation). 54+ total tests across 8 modules.
2. **CSP extended** — Added `health.elmahrosa.org` to CSP directives (script-src, style-src, img-src, connect-src) in `security_headers.py:15`. Added `ws://localhost:*` for dev HMR.
3. **MFA frontend** — Created `mfa-setup/page.tsx` (3-step flow: setup→verify QR code→done with disable option). Login page redirects admin/provider without MFA to `/mfa-setup`. Admin dashboard has new MFA tab showing per-user status.
4. **Railway config consolidated** — New `backend/railway.toml` names service `backend-api`. Root `railway.json` simplified (NIXPACKS). `frontend/railway.toml` updated with `restartPolicyType`. Legacy `railpack.json` files removed. CORS defaults updated in `config.py`.
5. **DNS documentation** — `DEPLOYMENT.md` updated with CNAME records (health→ismbwm8z.up.railway.app, api→backend Railway domain). `DEPLOYMENT_REPORT.md` created with full architecture diagram, env vars, DNS records, verification checklist.
6. **README updated** — URLs point to `health.elmahrosa.org`/`api.elmahrosa.org`. Architecture diagram added. Test count updated (54+).
7. **Frontend build** ✅ 0 errors (Next.js standalone). MFA setup page at 5.05 kB.

### Completed — Audit Remediation (22 items, prior session)

#### Technical Implementation
1. **ICD-10-CM coding** — Added `icd_code`/`icd_description` to MedicalRecord model; created `IcdCode` reference table with lookup/search API (`GET/POST /icd-codes`); seed script populates 10 codes
2. **Security headers middleware** — Created `SecurityHeadersMiddleware` (9 headers: HSTS, CSP, XFO, X-Content-Type-Options, Permissions-Policy, Referrer-Policy, Cache-Control, Pragma, X-XSS-Protection) registered in `main.py`
3. **FHIR expansion** — MedicalRecord now supports ICD-10, appointment endpoints fully implemented
4. **Frontend tests** — Expanded from 5→15 tests across 5 suites (added `admin.test.tsx`, `doctor.test.tsx`, `register.test.tsx`). 15/15 passing
5. **`authApi.me()` fix** — Changed from `GET /users/me` to `GET /admin/users/me` (was broken without mock data)
6. **Mock data alignment** — `mockVitals` uses snake_case (`heart_rate`, `oxygen_saturation`, etc.) matching backend VitalSigns model; patient dashboard renders correctly
7. **HSTS typo fix** — `max-gfe` → `max-age` in `security_headers.py:12`
8. **Horizontal access control** — Created `get_patient_scope` dependency; PATIENT role scoped to own resources on 8 endpoints
9. **Redis-backed rate limiting** — INCR+EXPIRE fixed-window with graceful in-memory fallback; distributed across instances

#### Procurement Documentation (9 new files in project root)
7. **ARCHITECTURE.md** — System architecture with mermaid diagrams, 13 sections
8. **SECURITY.md** — Security policy, OWASP Top 10 mapping, vulnerability disclosure
9. **COMPLIANCE.md** — HIPAA/GDPR/Egypt Law 151/Saudi PDPL/EHDS mapping tables
10. **DEPLOYMENT.md** — Deployment guide (on-premise, cloud, Docker, Railway, env reference)
11. **CHANGELOG.md** — Release history (5 releases in keepachangelog format)
12. **GOVERNMENT_BRIEF.md** — 20-page executive procurement brief (4,300 words, 11 sections + appendices)
13. **DATA_GOVERNANCE.md** — Data governance whitepaper (classification, retention, patient rights, AI governance)
14. **SECURITY_WHITEPAPER.md** — Security whitepaper (auth, RBAC, audit chain, rate limiting, SDLC, pentest readiness)
15. **CONTRIBUTING.md** + **CODE_OF_CONDUCT.md** — Open source governance

#### Technical Documentation (5 new files in docs/)
16. **THREAT_MODEL.md** — 17 STRIDE threats (S1–S3, T1–T3, R1–R2, I1–I5, D1–D3, E1–E4) mapped to code components; 4-sprint mitigation roadmap
17. **FHIR_CONFORMANCE.md** — FHIR R4 conformance statement; 8 resources, REST API reference, search params, missing capabilities table, interoperability roadmap
18. **INCIDENT_RESPONSE.md** — 11 sections; severity classification, response phases (detection→post-mortem), healthcare-specific regulatory timelines (HIPAA/GDPR/Egypt/Saudi)
19. **PENTEST_READINESS.md** — OWASP Top 10 self-assessment with controls/residual risk; RBAC matrix, pentest scope, API endpoint registry, honest gaps list with remediation SLAs
20. **MONITORING.md** — Expanded from health endpoints to 6 new sections: alerting, logging strategy, DB monitoring, incident response integration, Railway-specific, KPI targets
21. **PILOT_DEPLOYMENT_STRUCTURE.md** — Updated title/branding (UCH → UnityCare)

### Current State
- **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS, TypeScript 5.7
- **Frontend build**: ✅ 0 errors (Next.js standalone)
- **Frontend tests**: ✅ 15/15 passing (5 suites: login, patient, register, admin, doctor)
- **Backend**: Python 3.12, FastAPI, SQLAlchemy async, asyncpg, PostgreSQL
- **Backend tests**: ✅ 54+ tests across 8 modules (auth, medical, fhir, consent, audit, middleware, admin, research)
- **Security**: Rate limiting (Redis + in-memory fallback) + 9 security headers + JWT/RBAC + SHA-256 audit chain
- **Compliance**: ICD-10-CM, consent management (versioned, jurisdiction-aware), FHIR R4 Patient
- **Documentation**: 9 procurement-grade documents in project root + 5 technical docs in docs/ + AUDIT_REPORT_v1.md + DEPLOYMENT_REPORT.md
- **Pentest gaps (all 3 resolved)**: HSTS typo fixed; horizontal access control implemented; distributed rate limiting deployed

### Known Items for Next Time
1. Seed script deployment to Railway PostgreSQL (`railway run --service backend-api python scripts/seed.py --railway`)
2. Independent security audit/pentest (external)
3. 8 legacy Dependabot alerts in `modules/hospital-core/` — not active code, can ignore
4. Backend lint: `pip install ruff && ruff check app/`
5. Railway production domains: verify `api.elmahrosa.org` CNAME points to backend Railway domain
6. Configure custom domains in Railway dashboard (Networking → Domains) and DNS in Hostinger (health ✅, api, developers)

## Key Decisions
- All procurement docs written to project root for visibility (not nested in docs/)
- Used task agents to create 9 documentation files in parallel — consistent formatting
- ICD-10 codes stored in dedicated lookup table (`icd_codes`) for reference integrity
- Security headers use restrictive CSP (`default-src 'self'`) and deny framing/XSS
- Mock data now exactly matches backend API response shapes (snake_case fields)
- Test setup clears localStorage + fetch mocks between suites to prevent cross-contamination
- Railway CLI must be run from service subdirectory with `--path-as-root` flag
- DB tables auto-created via `init_db()` lifespan handler; Alembic used as fallback
- Horizontal access control uses a `get_patient_scope` FastAPI dependency rather than inline checks — reusable, testable, auditable
- Rate limiting uses Redis INCR+EXPIRE fixed-window (simple, atomic) over sorted-set sliding window (more precise but higher Redis ops)
- AUDIT_REPORT_v1.md written to project root (not docs/) as an evidence package artifact for procurement/government review

## Relevant Files
- `frontend/lib/api.ts`: authApi.me() fixed to `/admin/users/me`; ICD-10 and records mock fallback.
- `frontend/lib/mock-data.ts`: mockIcdCodes (10), mockMedicalRecords (2), snake_case vitals.
- `frontend/app/[locale]/patient/page.tsx`: VitalSigns interface uses snake_case; BP rendered as `{systolic}/{diastolic}`.
- `frontend/__tests__/register.test.tsx`: 3 tests (render, error, navigation).
- `frontend/__tests__/admin.test.tsx`: 3 tests (user list, audit tab, user roles).
- `frontend/__tests__/doctor.test.tsx`: 4 tests (name/specialization, stat cards, patient queue, quick actions).
- `backend/app/middleware/security_headers.py`: Fixed HSTS `max-gfe` → `max-age`.
- `backend/app/middleware/rate_limit.py`: Redis-backed fixed-window + in-memory fallback.
- `backend/app/middleware/access_control.py`: `get_patient_scope` dependency for horizontal access control.
- `backend/app/services/fhir.py`: `search_patients` accepts optional `user_id` filter.
- `backend/app/api/v1/patients.py`: Horizontal access control on `GET /fhir/Patient` (search + get).
- `backend/app/api/v1/medical.py`: Horizontal access control on vitals, appointments, records (6 endpoints).
- `AUDIT_REPORT_v1.md`: 7-section audit evidence package; 3 findings closed, compliance mapping, recommendation tracker.
- `docs/PENTEST_READINESS.md`: Updated to reflect 3 resolved gaps; rate limiting, HSTS, horizontal access control all marked ✅ Fixed.
