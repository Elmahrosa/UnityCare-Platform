# UnityCare — Security Posture Document

**Platform:** UnityCare Healthcare Trust Infrastructure  
**Version:** 1.0.0  
**Classification:** Public  
**Prepared for:** Government Security Reviewers  
**Last updated:** June 2026

---

## 1. Security Philosophy

UnityCare is built on three foundational security principles:

- **Sovereignty:** Patient health data remains under the jurisdiction of the originating nation-state. All data residency decisions are enforced at the application layer via consent-gated access controls and per-tenant database isolation patterns.
- **Data Residency:** The platform supports configurable jurisdiction tags on every consent record (SA, GCC, EU, etc.). Data flows across borders only when an explicit `cross_border` consent record exists with an `active` status.
- **Zero Trust:** No request is trusted by virtue of network location. Every API call is authenticated (JWT), authorized (RBAC), rate-limited, and logged. The internal network is treated as untrusted; all inter-service communication requires bearer tokens.

---

## 2. Authentication

| Mechanism | Implementation |
|-----------|---------------|
| **Token format** | JSON Web Token (JWT) signed with HS256 via `python-jose` |
| **Token expiry** | Access token: 15 minutes (configurable). Refresh token: 7 days (configurable) |
| **Token transport** | `Authorization: Bearer <token>` via FastAPI `HTTPBearer` |
| **Password hashing** | bcrypt with cost factor 12 (`bcrypt.gensalt(12)`) |
| **Account lockout** | 5 failed login attempts triggers a 15-minute lock (`locked_until` field) |
| **MFA readiness** | `mfa_enabled` and `mfa_secret` columns exist on the `User` model; `MFAEnableRequest` and `MFAVerifyRequest` Pydantic schemas are defined |
| **Session management** | `sessions` table stores refresh token hashes with device info and IP; sessions can be invalidated server-side |

Source: `backend/app/services/auth.py`, `backend/app/utils/security.py`, `backend/app/models/user.py`

---

## 3. Authorization

Role-based access control (RBAC) is enforced via FastAPI dependency injection.

### Roles

| Role | Privileges |
|------|-----------|
| `admin` | Full system access — user management, ICD-10 administration, audit log review |
| `provider` | Healthcare provider — create/update patient records, appointments, vitals |
| `patient` | Own data access — view own records, manage own consents |
| `auditor` | Read-only — audit log review, chain verification |

### Enforcement

The `require_role(*roles)` dependency (defined in `backend/app/middleware/auth.py:28`) wraps every protected endpoint. It:
1. Resolves the current user via `get_current_user` (validates JWT + checks `is_active` + checks `locked_until`)
2. Verifies `current_user.role in roles`
3. Returns `403 Forbidden` immediately on mismatch

No unprotected mutation endpoints exist. Every `POST`/`PUT`/`PATCH`/`DELETE` route is gated behind an explicit role check.

---

## 4. API Security

### Rate Limiting

An in-memory sliding-window rate limiter (`RateLimitMiddleware` in `backend/app/middleware/rate_limit.py`) tracks requests per IP+path tuple. Default: 60 requests per 60-second window. Configurable via `RATE_LIMIT_PER_MINUTE` environment variable. Health check endpoints (`/health`) are exempted.

### CORS

Configured via FastAPI's `CORSMiddleware`:
```python
allow_origins = ["http://localhost:3000", "https://health.elmahrosa.org"]
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

### Security Headers

Every response is augmented by `SecurityHeadersMiddleware`:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `X-XSS-Protection` | `0` |
| `Cache-Control` | `no-store` |
| `Pragma` | `no-cache` |

---

## 5. Data Security

### At Rest

- **PostgreSQL** is the primary data store. Connection string uses `postgresql+asyncpg` with configurable credentials via environment variables.
- **JSONB columns** are used for flexible schemas (patient FHIR data, consent data, device info, permissions). This allows schema validation at the application layer via Pydantic V2 while maintaining storage efficiency.
- **Passwords** are stored as bcrypt hashes (cost factor 12). No plaintext passwords are ever persisted.
- **Refresh tokens** are stored as SHA-256 hashes in the `sessions` table, not in plaintext.
- **Encryption at rest** is delegated to the underlying PostgreSQL deployment (Transparent Data Encryption when available). An `encryption_key` setting exists in config for future column-level encryption.

### In Transit

TLS is enforced at the reverse proxy layer. The production deployment uses an nginx reverse proxy (see `nginx.conf`) configured with TLS termination. All database connections use SSL when the environment requires it.

### Audit Trail Integrity

Every audit event is hash-chained using SHA-256. Each event stores:
- `previous_hash`: the hash of the chronologically preceding event
- `event_hash`: `SHA-256(previous_hash + canonical_event_data)`

This creates an immutable chain. Tampering with any historical event breaks the chain for all subsequent events and is detectable via the `/api/v1/audit/verify` endpoint.

Source: `backend/app/utils/hashing.py`, `backend/app/services/audit.py`

---

## 6. Audit Logging

### Scope

Every mutation in the system is logged to the `audit_events` table:

| Action Category | Examples |
|----------------|---------|
| Authentication | `user.login`, `user.registered` |
| Patient records | `patient.created`, `patient.updated`, `patient.deleted` |
| Medical data | `vitals.recorded`, `record.created`, `appointment.created`, `appointment.updated`, `appointment.deleted` |
| Consents | `consent.created`, `consent.revoked` |
| Administration | `icd_code.created`, `admin.user.list` |

### Schema

Each `AuditEvent` record captures: `event_id` (UUID), `actor_id`, `actor_email`, `action`, `resource_type`, `resource_id`, `details` (JSONB), `ip_address`, `previous_hash`, `event_hash`, and `timestamp` (timezone-aware).

### Chain Verification

`GET /api/v1/audit/verify` re-computes every event hash in sequence and compares it to the stored value. Returns `{"chain_valid": true}` only if the entire chain is intact. Access restricted to `admin` and `auditor` roles.

---

## 7. Vulnerability Disclosure

UnityCare welcomes responsible disclosure of security vulnerabilities.

- **Contact:** security@elmahrosa.org
- **PGP key:** Available via `https://elmahrosa.org/.well-known/pgp-key.txt`
- **Response SLA:** Initial acknowledgment within 72 hours. Remediation timeline communicated within 5 business days of triage.
- **Scope:** The UnityCare platform (all first-party code in this repository). Third-party dependencies should be reported to their respective maintainers.
- **Guidelines:** Please provide a detailed description, steps to reproduce, and potential impact. Do not publicly disclose vulnerabilities before we have had a reasonable opportunity to remediate.

---

## 8. Dependency Management

- **Automated updates:** Dependabot is configured for both Python (`requirements.txt`) and Node.js (`package.json`) dependencies. Alerts are reviewed weekly.
- **Minimal footprint:** Only necessary dependencies are declared. The Python backend has fewer than 30 direct dependencies; the frontend avoids large UI frameworks in favor of Tailwind CSS.
- **JWT library:** `python-jose` is kept current. Version pinned with automated PR review.
- **PostgreSQL driver:** `asyncpg` and `sqlalchemy[asyncio]` are updated quarterly or when security advisories are published.
- **No unmaintained packages:** All direct dependencies are actively maintained as of June 2026.

---

## 9. Secure Development

### TypeScript Frontend

- `strict: true` in `tsconfig.json` — no implicit `any`, strict null checks, no unchecked indexed access.
- ESLint configured with recommended rulesets. CI enforces 0 errors, 0 warnings.
- All API calls go through a centralized `lib/api.ts` module that attaches bearer tokens automatically.

### Python Backend

- **No raw SQL:** All database access uses SQLAlchemy ORM query builders or parameterized `text()` constructs (see `/health` endpoint). No string concatenation for SQL.
- **Input validation:** All request bodies are validated by Pydantic V2 models before reaching service logic. Invalid payloads are rejected at the router boundary with clear error messages.
- **Type hints:** Every function has full type annotations. Mypy-compatible (where applicable).
- **No eval/exec:** Dynamic code execution primitives are not used anywhere in the codebase.

### Testing

- Frontend: Jest 29 + ts-jest + Testing Library (7 passing tests covering login and patient flows).
- Backend test infrastructure is ready for expansion.

---

## 10. Incident Response

The following process is followed for confirmed security incidents:

1. **Triage (≤4 hours):** Assess severity, scope, and affected data. Determine if the incident is active or contained.
2. **Containment:** Revoke compromised credentials, rotate secrets, apply WAF rules or rate-limit changes. If necessary, take affected services offline.
3. **Eradication:** Identify root cause. Deploy hotfix or dependency patch. Review audit logs for unauthorized access.
4. **Recovery:** Restore service from verified backups if data corruption occurred. Verify chain integrity via the `/api/v1/audit/verify` endpoint.
5. **Post-mortem (≤7 days):** Document timeline, root cause, remediation steps, and preventive measures. Update this security posture document as needed.

Incidents involving patient data are reported to the relevant data protection authority within 72 hours as required by applicable regulation.

---

## 11. Security Controls Checklist (OWASP Top 10 2021)

| OWASP Category | Control(s) Implemented |
|---------------|----------------------|
| **A01: Broken Access Control** | `require_role` dependency injection on every endpoint; role hierarchy enforced server-side |
| **A02: Cryptographic Failures** | bcrypt(12) for passwords, HS256 JWT, SHA-256 for audit chain, TLS in transit, no hardcoded secrets in code |
| **A03: Injection** | SQLAlchemy ORM with parameterized queries; Pydantic V2 input validation rejects malformed payloads |
| **A04: Insecure Design** | Rate limiting, account lockout after 5 failures, session management with refresh token rotation |
| **A05: Security Misconfiguration** | Security headers middleware on every response; CORS restricted to known origins; debug mode disabled in production |
| **A06: Vulnerable & Outdated Components** | Dependabot automated scanning; dependency review process; pinned versions with PR-based updates |
| **A07: Identification & Authentication Failures** | JWT with short-lived access tokens (15 min); bcrypt password hashing; account lockout; MFA model ready |
| **A08: Software & Data Integrity Failures** | SHA-256 hash chain on audit log; consent versioning with `ConsentVersion` table; tamper detection endpoint |
| **A09: Security Logging & Monitoring Failures** | Every mutation logged to `audit_events` with actor, action, resource, timestamp, and IP address; OpenTelemetry support |
| **A10: Server-Side Request Forgery** | All external requests use explicit allow-listed URLs from config; no user-supplied URLs are fetched server-side |

---

## Appendix: well-known/security.txt

```text
-----BEGIN SECURITY.TXT-----
Contact: mailto:security@elmahrosa.org
Expires: 2027-06-20T00:00:00.000Z
Encryption: https://elmahrosa.org/.well-known/pgp-key.txt
Preferred-Languages: en, ar
Canonical: https://health.elmahrosa.org/.well-known/security.txt
Policy: https://github.com/Elmahrosa/UnityCare/SECURITY.md
Acknowledgments: https://health.elmahrosa.org/security/hall-of-fame
-----END SECURITY.TXT-----
```

---

*© 2026 Elmahrosa International. This document is maintained as part of the UnityCare platform repository and is updated as the security posture evolves.*
