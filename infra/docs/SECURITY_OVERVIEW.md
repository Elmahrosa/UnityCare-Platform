# Security Overview
**Unity Care Hospital (UCH)**  
*Confidential — Elmahrosa International*

---

## Compliance Posture

| Standard | Status |
|---|---|
| HIPAA | Architecture aligned to HIPAA safeguard principles |
| GDPR | Export + soft-delete workflows implemented |
| SOC 2 | Operational principles applied in design |
| Formal Certification | Scheduled post-seed funding |

> Institution retains full data ownership. All deployments are isolated.  
> No shared infrastructure between institutions.

---

## Security Controls

### Authentication & Session Management
- JWT access tokens (1-hour expiry) + refresh tokens (7-day expiry)
- Separate signing secrets for access and refresh tokens
- **Real logout** — token blacklist checked on every authenticated request
- bcrypt password hashing with 12 rounds

### Authorization
- Role-Based Access Control (RBAC) via `requireRole()` middleware
- Roles: `patient`, `doctor`, `admin`, `pharmacist`, `nurse`, `emergency_responder`
- All clinical and admin routes protected at middleware level

### Network & Input Security
- Rate limiting: 200 req/15min global, 20 req/15min on auth routes
- Helmet.js security headers (HSTS, referrer policy, content security)
- express-validator input validation on all mutation endpoints
- Structured error responses — no internal stack traces in client responses

### Data Protection
- GDPR soft-delete on all MedicalRecord entities
- JSON data export endpoint per patient for subject access requests
- No PHI in logs — structured logging with sensitive field exclusion
- `.env` secrets never committed (enforced via `.gitignore`)

### Operational Security
- Graceful SIGTERM shutdown — no interrupted writes on deploy
- Docker container isolation per service
- Environment-variable-based configuration — no hardcoded secrets
- Full audit trail — every user action logged with timestamp, actor, severity

---

## Audit Log

Every action in the platform generates an immutable-style audit entry:

```json
{
  "t": "2026-03-04 09:14:22",
  "actor": "doctor@institution.com",
  "action": "Accessed patient record P-1001",
  "sev": "info"
}
```

Audit logs are exportable as JSON for compliance review and governance reporting.

---

## Deployment Security Notes

- Each institution receives a **dedicated, isolated deployment**
- No cross-institution data access is architecturally possible
- Air-gapped deployment option eliminates external network attack surface entirely
- Source code escrow available — institution can audit full codebase

---

*Security configuration details and penetration test results available under NDA.*  
*Contact: info@uch.teosegypt.com*
