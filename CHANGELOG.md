# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-04

### Added
- Initial production release of consolidated UnityCare Platform
- SHA-256 hash-linked audit trail with tamper detection
- TOTP MFA enforcement for admin and provider roles
- Versioned, jurisdiction-aware, purpose-scoped consent management
- FHIR R4 Patient resource CRUD with user-scoped search
- ICD-10-CM lookup table with search API
- Policy-consistency reasoning agent (audit/verify.js)
- Horizontal access control on 8 patient-scoped endpoints
- Redis-backed rate limiting with in-memory fallback
- 9 security headers (HSTS, CSP, XFO, X-Content-Type-Options, X-XSS-Protection, Cache-Control, Pragma, Referrer-Policy, Permissions-Policy)
- 39 backend tests across 6 modules
- 15 frontend tests across 5 suites
- CI/CD pipeline: lint + test + Docker build + Railway deploy
- Comprehensive documentation suite (ARCHITECTURE, SECURITY, COMPLIANCE, DEPLOYMENT, MONITORING, DATA_GOVERNANCE)

### Security
- Fail-closed access control design — no default-permit paths
- Layered enforcement: headers → rate limit → JWT → RBAC → horizontal AC → consent
- Break-glass (emergency override) with mandatory audit logging
- Cross-border data governance policy enforcement

[1.0.0]: https://github.com/Elmahrosa/UnityCare-Platform/releases/tag/v1.0.0
