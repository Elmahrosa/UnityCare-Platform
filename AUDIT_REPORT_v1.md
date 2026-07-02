# UnityCare Platform — Audit Report v1.0

**Date:** 2026-06-20
**Auditor:** UnityCare Engineering (internal)
**Scope:** Full-stack audit — backend API, frontend, security controls, compliance alignment
**Status:** Remediated (3 findings closed)

---

## Executive Summary

UnityCare Platform underwent a comprehensive internal audit covering authentication, authorization, data isolation, rate limiting, security headers, FHIR conformance, consent management, audit integrity, and deployment security. Three high-priority findings were identified and remediated during the audit window.

---

## 1. Finding Summary

| ID | Finding | Severity | Status | Fix |
|----|---------|----------|--------|-----|
| S-01 | HSTS header: `max-gfe` typo renders HSTS inoperative | High | **Closed** | `max-gfe=31536000` → `max-age=31536000` |
| S-02 | Horizontal access control — PATIENT role can read any patient's data | Critical | **Closed** | `get_patient_scope` dependency + resource-level checks on 8 endpoints |
| S-03 | Rate limiter is in-memory only — lost on restart, not distributed | Medium | **Closed** | Redis-backed fixed-window with in-memory fallback |

---

## 2. Finding Details

### S-01 — HSTS Typo

**File:** `backend/app/middleware/security_headers.py:12`

**Issue:** The `Strict-Transport-Security` header value contained `max-gfe` instead of `max-age`. Browsers ignore the directive, disabling HSTS protection against SSL-stripping attacks.

**Fix:**
```
- response.headers["Strict-Transport-Security"] = "max-gfe=31536000; includeSubDomains"
+ response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
```

**Verification:** The response header now correctly reads `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

---

### S-02 — Horizontal Access Control

**Files:** `backend/app/api/v1/patients.py` (2 endpoints), `backend/app/api/v1/medical.py` (6 endpoints)

**Issue:** The `require_role` dependency only enforced **vertical** access control (which roles can access an endpoint). A PATIENT-authenticated user could call `GET /api/v1/fhir/Patient/{some-other-fhir-id}` or `GET /api/v1/appointments/patient/{another-patient-id}` and read any patient's data.

**New dependency:** `get_patient_scope` in `backend/app/middleware/access_control.py` returns the current user's ID if the role is PATIENT (or `None` for ADMIN/PROVIDER). Endpoints use it to filter:

| Endpoint | Check |
|----------|-------|
| `GET /fhir/Patient` | PATIENT sees only their own Patient record |
| `GET /fhir/Patient/{fhir_id}` | PATIENT can only access `patient.user_id == own id` |
| `GET /iot/{user_id}/vitals` | PATIENT can only access `user_id == own id` |
| `GET /iot/{user_id}/vitals/history` | Same |
| `GET /appointments/{id}` | PATIENT can only access `apt.patient_id == own id` |
| `GET /appointments/patient/{patient_id}` | PATIENT can only access own `patient_id` |
| `GET /records/{record_id}` | PATIENT can only access `record.patient_id == own id` |
| `GET /records/patient/{patient_id}` | PATIENT can only access own `patient_id` |

**Verification:** Patients receive HTTP 403 when attempting to access resources owned by a different user. ADMIN and PROVIDER roles remain unrestricted.

---

### S-03 — Distributed Rate Limiting

**File:** `backend/app/middleware/rate_limit.py` (rewritten)

**Issue:** Previous implementation used an in-memory dictionary (`self.requests = {}`). In a multi-process or multi-instance deployment (e.g., Railway with multiple replicas), each instance maintains its own counter — a user could exceed the global limit by distributing requests across instances.

**Fix:** Added Redis-backed fixed-window rate limiting with graceful fallback:

1. **Primary:** Redis `INCR` + `EXPIRE` with 60s fixed windows, keyed by `rl:{client_ip}:{path}:{window}`
2. **Fallback:** Previous in-memory sliding window — activates if Redis is unavailable

Redis URL is configured via `settings.redis_url` (default: `redis://localhost:6379/0`) and passed to the middleware in `main.py:51`.

**Verification:** When Redis is available, rate limit state survives restarts and is shared across instances. When Redis is down, falls back to per-instance in-memory limiting (graceful degradation).

---

## 3. Security Headers Audit

| Header | Value | Status |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | ✅ Fixed |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `X-XSS-Protection` | `0` | ✅ |
| `Content-Security-Policy` | `default-src 'self'` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | ✅ |
| `Cache-Control` | `no-store` | ✅ |
| `Pragma` | `no-cache` | ✅ |

---

## 4. Remaining Gaps (Accepted Risk)

| Gap | Severity | Rationale |
|-----|----------|-----------|
| CSP not extended for frontend assets (no `script-src`, `style-src`) | Low | Frontend is server-rendered; CSP harden pending static asset CDN deployment |
| No strict MFA enforcement | Medium | MFA model fields exist (`mfa_enabled`, `mfa_secret`) — enforcement deferred to pilot feedback |
| No rate limit on `/health` | Low | Health endpoints exempted to prevent monitoring lockout |
| No per-user rate limit (currently per-IP+path) | Low | Per-user limiting adds DB overhead; acceptable for pilot scale |

---

## 5. Recommendation Tracker

| Rec ID | Recommendation | Target | Status |
|--------|---------------|--------|--------|
| R-01 | Implement horizontal access control | v1.1.0 | ✅ Closed |
| R-02 | Fix HSTS header | v1.1.0 | ✅ Closed |
| R-03 | Add Redis-backed rate limiting | v1.1.0 | ✅ Closed |
| R-04 | Distribute rate limiting (multi-instance) | v1.1.0 | ✅ Closed |
| R-05 | Extend CSP for frontend assets | v1.2.0 | ⏳ Open |
| R-06 | Enforce MFA for provider/admin roles | v1.3.0 | ⏳ Open |
| R-07 | Backend unit test suite (pytest + httpx) | v1.2.0 | ⏳ Open |

---

## 6. Compliance Alignment

| Framework | Audit Coverage | Notes |
|-----------|---------------|-------|
| HIPAA Security Rule §164.312(a)(1) | ✅ Access control (RBAC + horizontal) | S-02 closed |
| HIPAA Security Rule §164.312(e)(1) | ✅ Transmission security | HSTS + enforced HTTPS |
| HIPAA Security Rule §164.312(b) | ✅ Audit controls | Audit chain with SHA-256 |
| GDPR Art. 32 | ✅ Security of processing | Rate limiting + input validation |
| Egypt Law 151 Art. 9 | ✅ Data access controls | Patient-scoped isolation |
| Saudi PDPL Art. 23 | ✅ Access restrictions | RBAC + horizontal enforcement |

---

## 7. Audit Trail

The audit chain (`SHA-256(hash + previous_hash)`) verifies the integrity of all:
- Patient record mutations
- Consent changes
- Appointment modifications
- Medical record updates
- ICD-10 code management

Chain verification endpoint: `POST /api/v1/audit/verify-chain`

---

*End of Audit Report v1.0*
