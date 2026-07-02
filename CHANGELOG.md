# Changelog

All notable changes to the UnityCare sovereign healthcare infrastructure platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-20

### Added
- Sovereign healthcare infrastructure platform
- FastAPI backend with PostgreSQL and SQLAlchemy async
- Next.js 15 frontend with Tailwind CSS and App Router
- JWT-based authentication with role-based access control (admin, provider, patient, auditor)
- FHIR R4 patient resource management
- Purpose-based consent management with versioning
- SHA-256 hash-chained immutable audit trail with chain verification
- Vital signs recording and history (IoT-ready)
- Appointment scheduling with status workflow
- Medical records with ICD-10-CM coding
- ICD-10-CM reference code lookup table
- Internationalization (English/Arabic) via custom i18n hook
- Rate limiting middleware (configurable sliding window)
- Security headers middleware (HSTS, CSP, XFO, etc.)
- OpenTelemetry integration for distributed tracing
- Backend health, status, and version endpoints
- Comprehensive demo mode with mock data fallback
- Loading skeletons and error boundary components
- Seed script with 6 demo accounts and comprehensive demo data
- Arabic translation review and fixes

### Fixed
- `python-jose` dependency bumped to 3.4.0 (CVE-2024-33663, CVE-2024-33664)
- `python-dotenv` dependency bumped to 1.2.2 (CVE-2026-28684)
- `postcss` already at patched version 8.5.15 — no action required

### Security
- Resolved 3 moderate Dependabot alerts in production dependencies
- Public repository at `github.com/Elmahrosa/UnityCare` is showcase-only; no source code exposed

## [0.9.0] - 2026-06-15

### Added
- Patient dashboard with vital signs display and consent management controls
- Doctor dashboard with appointment queue and patient management
- Admin dashboard with user management and audit log viewer
- Frontend test suite (Jest + Testing Library) — 5 tests passing
- Legacy page migration to Next.js App Router
- Translation consumption across all dashboard views

## [0.8.0] - 2026-06-01

### Added
- FHIR R4 patient API endpoints
- Consent management API with versioning support
- Blockchain audit trail service with chain verification
- Medical records backend service
- Appointments backend service with status workflow

## [0.7.0] - 2026-05-15

### Added
- Initial FastAPI backend scaffolding
- PostgreSQL integration with SQLAlchemy async ORM
- JWT authentication and token management
- User registration and login endpoints

## [0.6.0] - 2026-05-01

### Added
- Project initialization
- Architecture planning and system design
- Technology stack selection (FastAPI, Next.js, PostgreSQL, Tailwind CSS)
