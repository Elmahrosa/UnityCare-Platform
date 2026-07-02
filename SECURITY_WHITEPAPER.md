# UnityCare Security Whitepaper

**Platform:** UnityCare — Sovereign Healthcare Trust Infrastructure  
**Version:** 1.0.0  
**Classification:** Confidential — Government Security Reviewer Use  
**Author:** Elmahrosa International Engineering  
**Last Updated:** June 2026

---

## 1. Security Architecture Overview

UnityCare employs a **defense-in-depth** strategy across four concentric layers: network perimeter, application gateway, service middleware, and data persistence. Every layer enforces independent controls such that compromise of any single layer does not grant unrestricted access.

### 1.1 Defense in Depth

- **Layer 1 — Network:** All production traffic terminates at an nginx reverse proxy. TLS 1.3 is enforced at the proxy layer; the upstream backend communicates over a private Docker network.
- **Layer 2 — Gateway:** FastAPI middleware chain inspects every request. CORS validation, rate limiting, and security header injection occur before any route handler executes.
- **Layer 3 — Application:** Pydantic V2 schemas validate all input at the route boundary. The `require_role` dependency gate enforces authorization before business logic runs. Every mutation passes through the audit service for chain-of-custody logging.
- **Layer 4 — Data:** SQLAlchemy ORM parameterized queries prevent SQL injection. Connection pooling (pool_size=20, max_overflow=10) with asyncpg prevents resource exhaustion.

### 1.2 Zero-Trust Principles

- **Verify explicitly:** Every request is authenticated via JWT bearer token, regardless of network origin. No trust is extended based on IP or VLAN.
- **Least-privilege access:** The four-role RBAC model (patient, provider, admin, auditor) grants only the minimum permissions required for each persona. No role inherits from another.
- **Assume breach:** All audit events are SHA-256 hash-chained to detect tampering. Failed login attempts increment a counter and trigger temporary lockout.

### 1.3 Data Encryption Strategy

| Scope | Mechanism | Key Management |
|-------|-----------|----------------|
| In transit (external) | TLS 1.3 via nginx reverse proxy | Managed by deployment orchestrator (Railway) |
| In transit (internal) | Private Docker network, no public exposure | N/A — network-isolated |
| At rest (database) | PostgreSQL native TDE / filesystem encryption | Platform-level (cloud provider) |
| Secrets | Environment variables via `pydantic-settings` | Not committed to repository; `.env.example` uses placeholder values |
| Password hashes | bcrypt with cost factor 12 | Application-layer, one-way only |

---

## 2. Authentication & Identity

### 2.1 JWT-Based Authentication

UnityCare uses the `python-jose` library (v3.4.0, patched for CVE-2024-33663 and CVE-2024-33664) to issue and verify JSON Web Tokens.

- **Algorithm:** `HS256` (configurable via `JWT_ALGORITHM` environment variable; `RS256` supported but not default).
- **Access token lifetime:** 15 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Refresh token lifetime:** 7 days (`REFRESH_TOKEN_EXPIRE_DAYS`).
- **Token payload:** `sub` (user UUID), `email`, `role`, `iat`, `exp`. Refresh tokens carry `"type": "refresh"` for explicit discrimination.
- **No server-side sessions:** The platform is entirely stateless with respect to session storage. Token validity is determined solely by cryptographic signature and expiry. The `Session` model exists for refresh token rotation auditing only.

### 2.2 Password Security

- **Hashing:** bcrypt via the `bcrypt` Python library (v4.2.1) with `gensalt(12)` — a cost factor of 12 rounds.
- **No plaintext storage:** Passwords are hashed immediately upon registration (`hash_password`). The `verify_password` function performs constant-time comparison via `bcrypt.checkpw`.
- **Minimum length:** Enforced at the application layer (≥8 characters in registration UI); the Pydantic schema currently accepts any non-empty string — a gap planned for the next iteration (see Section 8).
- **Credential validation:** On login, failed attempts increment `failed_login_attempts`. At 5 failures, `locked_until` is set to `now + 15 minutes`, and the account rejects authentication until the lockout expires.

### 2.3 MFA Readiness

The data model includes production-ready MFA fields:

- `mfa_enabled: bool` — flag indicating whether the user has enrolled
- `mfa_secret: str | None` — TOTP shared secret (encrypted at rest)

Pydantic schemas (`MFAEnableRequest`, `MFAVerifyRequest`) define the API contract. The MFA enrollment and verification endpoints are specified in the route design but not yet wired into the router — this is a documented roadmap item. When activated, MFA will operate as a second factor after primary password authentication, using Time-based One-Time Password (TOTP) per RFC 6238.

### 2.4 Session Management

- **Token-based:** No cookies or server-side session state. Clients store the access and refresh tokens and present the access token via the `Authorization: Bearer` header.
- **Refresh token rotation:** The `Session` model records `refresh_token_hash`, `device_info`, and `ip_address` for each issued refresh token, enabling revocation and abuse detection.
- **Account lifecycle:** `is_active` flag allows administrative deactivation without data loss. The `get_current_user` dependency rejects deactivated accounts with a `403 Forbidden`.

### 2.5 Account Lockout

| Property | Value |
|----------|-------|
| Max failed attempts before lockout | 5 |
| Lockout duration | 15 minutes |
| Lockout field | `locked_until` (timestamp with time zone) |
| Auto-unlock | On successful authentication (counter reset) |
| API response on locked account | `423 Locked` |

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control

Four roles are defined in `UserRole` (Python enum):

| Role | Identifier | Typical User |
|------|-----------|-------------|
| Patient | `patient` | Healthcare consumer |
| Provider | `provider` | Physician, nurse, care team |
| Admin | `admin` | System administrator |
| Auditor | `auditor` | Compliance officer, SOC analyst |

### 3.2 Hierarchical Permissions Model

Permissions are assigned per-role via the `require_role` dependency. There is no role inheritance — each endpoint explicitly lists the roles that may access it. This design follows the principle of least privilege and makes the permission matrix auditable by inspection.

### 3.3 `require_role` Dependency Injection Pattern

```python
def require_role(*roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker
```

This pattern ensures:
1. Authentication is verified first (via `get_current_user`).
2. Account status is checked (active, not locked).
3. Role membership is validated.
4. The authenticated user object is injected into the route handler for resource-level checks.

### 3.4 Resource-Level Access Control

Patient data access is scoped by FHIR resource ownership. The `FHIRService.get_patient()` and related methods accept query parameters that restrict results based on the authenticated user's identity. Providers may access patients under their care; patients may access only their own records. Admins have system-wide access for operational purposes; auditors have read-only access to audit events and user metadata but not clinical data.

### 3.5 API Endpoint Authorization Matrix

| Endpoint | Method | Patient | Provider | Admin | Auditor |
|----------|--------|---------|----------|-------|---------|
| `/auth/register` | POST | — | — | — | — |
| `/auth/login` | POST | — | — | — | — |
| `/admin/users/me` | GET | ✓ | ✓ | ✓ | ✓ |
| `/admin/users` | GET | — | — | ✓ | — |
| `/admin/users/{id}` | GET | — | — | ✓ | ✓ |
| `/admin/users/{id}` | PATCH | — | — | ✓ | — |
| `/fhir/Patient` | GET | ✓ | ✓ | ✓ | — |
| `/fhir/Patient` | POST | — | ✓ | ✓ | — |
| `/fhir/Patient/{id}` | GET | ✓ | ✓ | ✓ | — |
| `/fhir/Patient/{id}` | PUT | — | ✓ | ✓ | — |
| `/fhir/Patient/{id}` | DELETE | — | — | ✓ | — |
| `/consent` | POST | ✓ | ✓ | ✓ | — |
| `/consent/{id}` | GET | ✓ | ✓ | ✓ | — |
| `/consent/{id}/revoke` | POST | ✓ | ✓ | ✓ | — |
| `/consent/{id}/versions` | GET | — | — | ✓ | ✓ |
| `/audit/events` | GET | — | — | ✓ | ✓ |
| `/audit/verify` | GET | — | — | ✓ | ✓ |
| `/iot/{uid}/vitals` | GET | ✓ | ✓ | ✓ | — |
| `/iot/{uid}/vitals` | POST | — | ✓ | ✓ | — |
| `/appointments` | POST | — | ✓ | ✓ | — |
| `/appointments/{id}` | GET | ✓ | ✓ | ✓ | — |
| `/records` | POST | — | ✓ | ✓ | — |
| `/records/patient/{id}` | GET | ✓ | ✓ | ✓ | — |
| `/icd-codes` | GET | — | ✓ | ✓ | — |
| `/icd-codes/{code}` | GET | ✓ | ✓ | ✓ | — |

---

## 4. API Security

### 4.1 Rate Limiting

The `RateLimitMiddleware` implements a configurable in-memory sliding-window algorithm:

- **Key:** `{client_ip}:{path}` — each unique IP/path combination is tracked independently.
- **Default limit:** 60 requests per 60-second window (configurable via `RATE_LIMIT_PER_MINUTE`).
- **Exempt path:** `/health` is excluded from rate limiting.
- **Behavior:** Requests exceeding the limit receive `429 Too Many Requests` with no retry-after header (roadmap item).
- **Limitation:** This is a single-process in-memory store. In multi-replica deployments, Redis-backed rate limiting should be enabled (the `redis` dependency is already in `requirements.txt`).

### 4.2 CORS

Configured via FastAPI's `CORSMiddleware`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,   # ["http://localhost:3000", "https://health.elmahrosa.org"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Origins are explicitly whitelisted in configuration; wildcard origins are never used in production.

### 4.3 Security Headers

The `SecurityHeadersMiddleware` applies the following headers to every HTTP response:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (deprecated; CSP supersedes) |
| `Content-Security-Policy` | `default-src 'self'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `Cache-Control` | `no-store` |
| `Pragma` | `no-cache` |

The nginx reverse proxy adds additional headers for the static frontend, including a more permissive CSP tailored for browser assets.

### 4.4 Input Validation

All API inputs are validated against Pydantic V2 models before route handler execution:

- **Type coercion:** Strict type enforcement with automatic error responses for malformed input.
- **String constraints:** Fields like `email`, `full_name`, and `password` are validated for type and format.
- **Numeric constraints:** Query parameters use `ge`/`le` bounds (e.g., `skip >= 0`, `1 <= limit <= 200`).
- **Enum validation:** `role` and similar fields accept only defined enum values.

### 4.5 SQL Injection Prevention

The platform uses **zero raw SQL** in application code. All database interactions go through SQLAlchemy's async ORM with parameterized queries:

```python
result = await self.db.execute(select(User).where(User.email == email))
```

The single exception is the health-check endpoint which uses `sqlalchemy.text("SELECT 1")` — a static, non-parameterizable statement.

### 4.6 Global Exception Handler

A catch-all exception handler at FastAPI application level ensures that unhandled exceptions never leak stack traces or internal state:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

All errors are logged server-side via the `unitycare` logger (OpenTelemetry integrated) for debugging without exposing internals to clients.

---

## 5. Audit Trail Integrity

### 5.1 SHA-256 Hash Chaining

The audit system implements a blockchain-inspired hash chain for tamper-evident logging. Each `AuditEvent` record contains:

- `previous_hash: str | None` — the `event_hash` of the immediately preceding event (null for the genesis event).
- `event_hash: str` — `SHA-256(previous_hash || JSON(event_data))` where event_data is the canonical JSON representation of the event's core fields.

```python
def compute_event_hash(previous_hash, data):
    content = json.dumps(data, sort_keys=True, default=str)
    if previous_hash:
        content = previous_hash + content
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
```

### 5.2 Chain Properties

- **Genesis block:** The first audit event has `previous_hash = null`.
- **Immutability:** Modifying any field in any historical event breaks the hash chain for all subsequent events.
- **Verification:** The `verify_chain()` method iterates all events sequentially, recomputes expected hashes, and returns `false` at the first mismatch.

### 5.3 Audit Coverage

Every mutation across all services generates an audit event:

| Service | Events |
|---------|--------|
| Auth | `user.registered`, `user.login` |
| Patient (FHIR) | `patient.created`, `patient.updated`, `patient.deleted` |
| Consent | `consent.created`, `consent.revoked` (via service layer) |
| Medical | `vitals.recorded`, `appointment.created`, `appointment.updated`, `appointment.deleted`, `record.created`, `icd_code.created` |

### 5.4 Storage & Backup

Audit events are stored in the `audit_events` table in PostgreSQL, indexed on `event_id`, `action`, `resource_type`, and `timestamp`. The database is backed up via PostgreSQL's native continuous archiving and point-in-time recovery (PITR), managed by the deployment platform.

---

## 6. Data Protection

### 6.1 Encryption in Transit

- **External:** All client-to-server traffic is encrypted via TLS 1.3, enforced by the `Strict-Transport-Security` header (`max-age=31536000; includeSubDomains`).
- **Internal:** Backend-to-database communication occurs over the private network provided by the deployment platform (Railway), which encrypts inter-service traffic by default.
- **API gateway:** The nginx reverse proxy handles TLS termination. Upstream traffic to the FastAPI backend is plain HTTP within the private network.

### 6.2 Encryption at Rest

PostgreSQL data files are encrypted at the storage-layer level (platform-managed). No application-level field encryption is currently implemented for clinical data fields; access control is enforced entirely through RBAC. The `ENCRYPTION_KEY` environment variable is provisioned for future column-level encryption.

### 6.3 Sensitive Data Handling

- **Patient identifiers:** Stored as FHIR-compliant JSONB resources in the `patients` table. Application-level RBAC restricts read access.
- **Consent data:** Stored as JSONB in the `consents` table with SHA-256 hashing for integrity verification via `compute_consent_hash`.
- **Credentials:** Only bcrypt password hashes and TOTP secrets are stored — never plaintext passwords.
- **Personally Identifiable Information (PII):** `full_name` and `email` are stored in the `users` table, accessible only to authorized roles.

### 6.4 FHIR Compliance

Patient data follows the HL7 FHIR R4 resource model. The `fhir_resource` column stores the complete FHIR patient resource as JSONB, ensuring interoperability with healthcare data exchange standards.

---

## 7. Secure Development Lifecycle

### 7.1 Static Analysis & Type Safety

- **TypeScript strict mode:** The frontend compiles with `strict: true` in `tsconfig.json`, enabling all strict type-checking options.
- **ESLint:** Configured with `@typescript-eslint`, `react/recommended`, and Next.js rules. Enforced in CI — zero warnings policy.
- **Python type hints:** All backend code uses Python type annotations. Pydantic V2 leverages these for runtime validation.

### 7.2 Build-Time Security

- **Next.js standalone build:** Compiles to a minimal Node.js production image with no dev dependencies.
- **Docker multi-stage builds:** The Dockerfile uses a builder stage for compilation and a separate runtime stage with only production artifacts.
- **Dependency scanning:** Regular Dependabot alerts are reviewed and patched within the SLA window. Critical and high-severity alerts are addressed immediately.

### 7.3 Testing

- **Frontend test suite:** Jest 29 with `ts-jest` and `@testing-library/react`. Currently 7 tests across 2 suites (login, patient dashboard).
- **API testing:** FastAPI's `TestClient` is available for backend route testing (roadmap for comprehensive coverage).
- **Chain integrity tests:** The `verify_chain()` method is called periodically to detect audit log tampering.

### 7.4 Secrets Management

- **No secrets in code:** All configuration values are injected via environment variables. The `.env.example` file contains placeholder values only.
- **Git ignore:** `.env` files are excluded by `.gitignore`. Secrets never enter the repository.
- **Deployment:** Railway environment variables are managed through the Railway dashboard, never hardcoded.

### 7.5 Dependency Management

| Dependency | Version | Security Notes |
|-----------|---------|----------------|
| `python-jose` | 3.4.0 | Patched CVE-2024-33663, CVE-2024-33664 |
| `python-dotenv` | 1.2.2 | Patched CVE-2026-28684 |
| `bcrypt` | 4.2.1 | Up-to-date |
| `postcss` | 8.5.15 | Past patched version |
| `fastapi` | 0.115.6 | Latest stable |

---

## 8. Security Controls Checklist — OWASP Top 10 (2021)

| OWASP Category | UnityCare Control | Status |
|----------------|------------------|--------|
| **A01: Broken Access Control** | RBAC with `require_role` dependency; resource-level scoping; auditor/admin separation | ✓ Implemented |
| **A02: Cryptographic Failures** | bcrypt (cost 12) for passwords; TLS in transit; environment-based key management | ✓ Implemented |
| **A03: Injection** | SQLAlchemy ORM parameterized queries; Pydantic input validation; no raw SQL | ✓ Implemented |
| **A04: Insecure Design** | Defense-in-depth architecture; rate limiting; audit hash chain; zero-trust principles | ✓ Implemented |
| **A05: Security Misconfiguration** | Configurable CORS whitelist; security headers middleware; environment-specific config | ✓ Implemented |
| **A06: Vulnerable & Outdated Components** | Dependabot alerts monitored; dependencies patched proactively | ✓ Implemented |
| **A07: Identification & Authentication Failures** | JWT with short TTL; bcrypt hashing; account lockout (5 attempts/15 min); MFA-ready | Partial (MFA routes not wired) |
| **A08: Software & Data Integrity Failures** | Audit hash chain for tamper detection; CI-enforced linting and type checking | ✓ Implemented |
| **A09: Security Logging & Monitoring Failures** | Comprehensive audit logging for all mutations; OpenTelemetry integration; chain verification endpoint | ✓ Implemented |
| **A10: Server-Side Request Forgery** | All external URLs are configurable via environment variables; no user-controlled fetch targets | ✓ Implemented |

---

## 9. Vulnerability Disclosure Program

### 9.1 Reporting

Security researchers and government reviewers should report vulnerabilities to:

**Email:** `security@elmahrosa.org`  
**PGP Key:** Available at `https://elmahrosa.org/.well-known/pgp-key.txt`

### 9.2 Response SLA

| Milestone | Target |
|-----------|--------|
| Acknowledgment | 48 hours |
| Initial triage | 5 business days |
| Fix deployment (critical) | 7 days |
| Fix deployment (high) | 30 days |
| Fix deployment (medium/low) | 90 days |

### 9.3 Scope

- `https://health.elmahrosa.org` (production)
- `https://staging.health.elmahrosa.org` (staging)
- API endpoints under `/api/v1/*`
- IoT vitals endpoints under `/iot/{user_id}/vitals/*`

Out of scope: third-party services, physical security, social engineering, denial-of-service attacks exceeding published rate limits.

### 9.4 Safe Harbor

Elmahrosa International will not pursue legal action against researchers who:
1. Make a good-faith effort to avoid privacy violations and service disruption.
2. Report vulnerabilities through the designated channel.
3. Allow reasonable time for remediation before public disclosure.

---

## 10. Penetration Testing Readiness

### 10.1 Test Environment Setup

Pentesters may provision a local instance for testing:

```bash
# Clone the repository
git clone https://github.com/Elmahrosa/UnityCare
cd UnityCare

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # Edit JWT_SECRET and ENCRYPTION_KEY

# Database (PostgreSQL required)
# Create database "unitycare" and run:
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"

# Start server
uvicorn app.main:app --reload --port 8000

# Frontend setup
cd ../frontend
npm install
npm run dev
```

**Pre-seeded test accounts:**

| Email | Password | Role |
|-------|----------|------|
| `admin@test.org` | `admin123` | Admin |
| `provider@test.org` | `provider123` | Provider |
| `patient@test.org` | `patient123` | Patient |
| `auditor@test.org` | `auditor123` | Auditor |

### 10.2 API Documentation

The FastAPI application auto-generates OpenAPI documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

All endpoints, request/response schemas, and authorization requirements are fully documented in the OpenAPI specification.

### 10.3 Recommended Testing Scope

| Area | Focus |
|------|-------|
| Authentication | Token forgery, replay attacks, refresh token abuse, lockout bypass |
| Authorization | Horizontal privilege escalation (Patient A accessing Patient B's data), role escalation |
| Audit chain | Hash collision, event deletion, reordering, chain verification false negatives |
| Rate limiting | Sliding window bypass, multi-IP distributed attacks, resource exhaustion |
| Input validation | Pydantic bypass, injection via JSONB fields, boundary value testing |
| Session management | Refresh token theft, token reuse, concurrent session behavior |
| MFA readiness | TOTP seed exposure, replay window analysis, enrollment bypass |

### 10.4 Rate Limiting Considerations for Pentesters

The default rate limit is **60 requests per minute per IP+path**. The `/health` endpoint is exempt. Pentesters requiring elevated limits should contact `security@elmahrosa.org` to arrange a dedicated test profile. Distributed testing across multiple source IPs is permitted but must be coordinated to avoid infrastructure-level blocking.

---

## Appendix A: Cryptographic Inventory

| Algorithm | Use | Key Length |
|-----------|-----|-----------|
| SHA-256 | Audit hash chaining, consent integrity | 256-bit |
| bcrypt | Password hashing | Salt + 192-bit (cost 12) |
| HS256 (HMAC-SHA256) | JWT signing | Configurable (256-bit recommended) |
| TOTP (SHA-1) | MFA readiness | 160-bit (per RFC 6238) |
| TLS 1.3 | Transport security | Managed by deployment platform |

## Appendix B: Data Flow Diagram (Text)

```
User/Browser                  nginx Reverse Proxy              FastAPI Backend              PostgreSQL
     |                              |                              |                         |
     |---- HTTPS/TLS 1.3 ---------->|                              |                         |
     |                              |--- HTTP (private network) -->|                         |
     |                              |                              |--- ORM/asyncpg -------->|
     |                              |                              |                         |
     |<--- Security Headers --------|<--- Middleware Chain --------|<--- Pydantic Validation -|
     |                              |                              |                         |
     |                              |  1. CORS Validation          |                         |
     |                              |  2. Rate Limiting            |                         |
     |                              |  3. Security Headers         |                         |
     |                              |                              |                         |
     |                              |                              |  4. JWT Verification     |
     |                              |                              |  5. RBAC Check          |
     |                              |                              |  6. Audit Logging       |
     |                              |                              |  7. Business Logic      |
```

---

*This document is classified as Confidential. Distribution is restricted to authorized government security reviewers, SOC teams, and Elmahrosa International personnel with a need-to-know basis.*
