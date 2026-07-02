# UCH Sovereign Core

Healthcare compliance and audit platform by **Elmahrosa International**. Part of the Elmahrosa TEOS stack (Trust, Ethics, Oversight, Sovereignty). Built for clinical/health data governance — consent management, tamper-evident audit trails, role-based access control, FHIR R4 interoperability, and policy-driven access enforcement across regulated health environments.

---

## Built with Claude: Life Sciences, Builder Track

The `audit/` directory contains a **policy-consistency reasoning agent** — this is the hackathon deliverable.

### Problem

Standard audit logging tells you *who accessed what and when*. It does not tell you whether that access was *allowed*. In a healthcare setting, determining compliance requires reasoning across multiple dimensions simultaneously:

- Does the actor's role permit this action on this resource type? (RBAC)
- Does the patient own the data, or is the actor assigned to the patient? (horizontal access control)
- Is there an active consent with a matching purpose for this specific access? (consent-policy alignment)
- If consent exists for "treatment", does it extend to "cross-border data sharing"? (purpose mismatch)
- Is this off-hours access accompanied by a valid emergency or on-call reason? (time-based policy)
- Has this actor triggered the off-hours threshold requiring mandatory review? (frequency escalation)

This is a **genuine multi-factor reasoning task**, not a hash lookup or regex match. The verifier reads `audit/policy.txt` (a structured healthcare access policy document) and `audit/access_logs.json` (synthetic log entries with deliberately mixed signals — compliant accesses next to subtle violations), then outputs one of three verdicts per event:

- ✅ Compliant — all policy dimensions satisfied
- ⚠️ Warning — policy-advisory condition (e.g., off-hours without reason code)
- ❓ Violation — one or more policy rules breached

Each verdict includes a one-sentence explanation identifying the specific rule triggered.

### Run it

```bash
node audit/verify.js                    # full report
node audit/verify.js --summary-only      # condensed
node audit/verify.js --json             # machine-readable
```

The 18 synthetic events exercise RBAC, horizontal access control, consent-purpose alignment, off-hours restrictions, proximity rules, break-glass (emergency override), audit-read scoping, and cross-border data governance.

**[Demo recording — link to be added once uploaded]**

> This is a proof-of-concept for the policy reasoning layer, not the full platform. The verifier evaluates synthetic logs against a static policy. It does not enforce policy at runtime, connect to a live database, or replace the platform's production middleware.

---

## Platform Status

**Verified as of July 2026:**

| Dimension | Status |
|---|---|
| **Backend tests** | 39 tests across 6 modules: auth (10), consent (8), audit chain integrity (5), medical/ICD-10 (11), FHIR Patient CRUD (5), middleware/access control (6) |
| **Frontend tests** | 15 tests across 5 suites (login, register, patient, doctor, admin) |
| **Frontend build** | 0 errors (Next.js 15.5, TypeScript strict) |
| **MFA enforcement** | TOTP enforcement on admin and provider roles; setup/enable/disable/verify endpoints |
| **CI/CD** | GitHub Actions: lint + test + Docker build on push/PR; Railway deploy on main |
| **Security headers** | 9 headers: HSTS, CSP (extended for Railway/assets), XFO, X-Content-Type-Options, X-XSS-Protection, Cache-Control, Pragma, Referrer-Policy, Permissions-Policy |
| **Rate limiting** | Redis-backed fixed-window with in-memory graceful fallback |
| **Horizontal access control** | Patient-scoped data access (8 endpoints); cross-patient access returns 403 |
| **Audit chain** | SHA-256 hash-linked events; `verify_chain()` detects tampering |
| **Consent management** | Versioned, jurisdiction-aware, purpose-scoped (treatment/data_sharing/ai_processing/research/cross_border) |
| **ICD-10-CM** | Lookup table with search API; codes on MedicalRecord model |
| **FHIR R4** | Patient resource CRUD, search with user_id scoping |
| **Legacy Dependabot alerts** | 8 alerts in `modules/hospital-core/` — confirmed inactive, excluded from scans |
| **Migrations** | Alembic (async) with initial schema; ICD-10 table created via lifespan handler |

---

## Architecture

- **Deterministic verdicts.** Policy evaluation is rule-based and deterministic — same inputs always produce the same verdict. No ML, no probabilistic inference.
- **SHA-256 chained audit trails.** Audit events are linked via `previous_hash → event_hash` chain using `sha256(prev_hash + canonical_json(event_data))`. Chain integrity is verifiable via `GET /audit/verify`. Tampering with any historical event breaks the chain.
- **Fail-closed design.** Access requires explicit authorization. Missing consent, expired token, unlinked patient profile, or missing role all produce 403/401. No default-permit path exists at the middleware level.
- **Layered enforcement.** Security headers → rate limiting → JWT authentication → RBAC → horizontal access control → consent check. Each layer is independent and can fail independently.

---

## Links

- **Deployment:** [health.elmahrosa.org](https://health.elmahrosa.org)
- **Source:** [github.com/Elmahrosa/UnityCare-Platform](https://github.com/Elmahrosa/UnityCare-Platform)
- **Contact:** [contact@elmahrosa.org](mailto:contact@elmahrosa.org)
