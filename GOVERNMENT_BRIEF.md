# UnityCare — Government Procurement Brief

## Sovereign Healthcare Infrastructure Platform

**Prepared for:** Ministry of Health officials, government procurement officers, hospital administrators  
**Prepared by:** Elmahrosa International  
**Document version:** 1.0 — June 2026  
**Classification:** For Official Use Only

---

## Table of Contents

1. Executive Summary
2. The Problem
3. The Solution
4. Technical Architecture
5. Compliance & Certifications
6. Security
7. Deployment & Operations
8. Pilot Program
9. Procurement Packages
10. About Elmahrosa International
11. Appendices

---

## 1. Executive Summary

UnityCare is a **sovereign healthcare infrastructure platform** purpose-built for government health systems that require complete data sovereignty, regulatory compliance, and audit transparency. It replaces fragmented, foreign-controlled SaaS solutions with a unified national platform where patient data never leaves sovereign jurisdiction.

**What UnityCare delivers:**

| Dimension | Capability |
|-----------|-----------|
| **Sovereignty** | On-premise or private-cloud deployment. Zero foreign data egress. Full control over encryption keys, access policies, and data residency. |
| **Interoperability** | Native FHIR R4 compliance. ICD-10-CM coding. SMART-on-FHIR ready. RESTful APIs for national health information exchange (HIE). |
| **Audit & Trust** | Blockchain-style hash-chained audit ledger. Every clinical and administrative action is cryptographically linked, tamper-evident, and independently verifiable. |
| **Consent Governance** | Multi-jurisdiction consent engine with version history, purpose limitation, expiry, and revocation — designed for GDPR, HIPAA, Egypt Law 151, and Saudi PDPL alignment. |
| **AI Readiness** | Structured, anonymizable data pipelines. AI governance layer (roadmap). Built for national population health analytics and clinical decision support without compromising privacy. |
| **Bilingual** | Full English and Arabic interface — both RTL and LTR layouts supported throughout. |

**Key value proposition:** Sovereign control + blockchain audit + FHIR interoperability + AI governance — delivered as a single integrated platform, not a collection of bolt-on modules.

---

## 2. The Problem

National healthcare systems across the Middle East and Africa face a converging crisis of fragmentation, vendor dependency, and regulatory exposure.

### 2.1 Data Fragmentation

Patient records are scattered across hospital information systems (HIS), standalone EHRs, pharmacy management tools, laboratory systems, and paper files. No single source of truth exists. Clinicians waste 30–40% of their time reconciling patient data across disjoint systems.

### 2.2 Foreign Vendor Lock-In

Most healthcare IT in the region is supplied by foreign SaaS vendors. This creates multiple structural risks:

- **Data residency violations:** Patient records stored on servers outside national jurisdiction.
- **Supply chain dependency:** Critical health infrastructure dependent on foreign corporate roadmaps and pricing.
- **Regulatory exposure:** Vendor non-compliance with local data protection laws (e.g., Egypt Law 151, Saudi PDPL) exposes the ministry to liability.
- **Limited customization:** Generic products that cannot adapt to local clinical workflows, coding systems (ICD-10-CM, local procedure codes), or regulatory reporting.

### 2.3 Lack of Auditability

Most existing systems log events in plain databases with no cryptographic integrity protection. Audit logs can be silently modified or deleted. This is a critical gap for:

- Medicolegal investigations.
- Regulatory compliance audits.
- Anti-fraud and abuse monitoring.
- Patient trust and transparency.

### 2.4 AI Governance Challenges

As ministries move toward AI-assisted diagnostics, population health analytics, and clinical decision support, they face foundational gaps:

- No structured consent pipeline for training data.
- No anonymization or de-identification frameworks.
- No audit trail for AI model inputs and outputs.
- No mechanism for patient opt-in/opt-out at scale.

### 2.5 Cross-Border Data Sharing

National health information exchange (HIE) initiatives are blocked by incompatible data formats, missing consent frameworks, and the absence of a national patient identifier or enterprise master patient index (EMPI) — both on the UnityCare roadmap.

---

## 3. The Solution

UnityCare is a modular, API-first healthcare platform that replaces fragmented systems with a unified national infrastructure.

### 3.1 Platform Overview

```
┌─────────────────────────────────────────────────────────┐
│                  UNITYCARE PLATFORM                      │
├────────────┬────────────┬─────────────┬─────────────────┤
│   HIS      │    EHR     │ Telemedicine│   Pharmacy      │
│ (In Dev)   │  (Live)    │ (Research)  │   (Research)    │
├────────────┼────────────┼─────────────┼─────────────────┤
│ Emergency  │ Compliance │   Audit     │   Consent       │
│ (Research) │  (Live)    │  (Live)     │   (Live)        │
├────────────┴────────────┴─────────────┴─────────────────┤
│                  Shared Infrastructure                   │
│  FHIR R4  │  ICD-10-CM  │  JWT/RBAC  │  i18n (EN/AR)   │
│────────────┴────────────┴─────────────┴─────────────────│
│           PostgreSQL 16  │  Redis 7   │  Railway/AWS    │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Core Capabilities

| Module | Status | Description |
|--------|--------|-------------|
| **Patient Records (EHR)** | **Live** | FHIR R4 patient create, read, update, soft-delete, search. JSONB storage with version tracking. |
| **Consent Engine** | **Live** | Multi-jurisdiction consent with purpose limitation, expiry, revocation, version history, and cryptographic hashing. |
| **Audit Ledger** | **Live** | SHA-256 hash-chained immutable audit trail with chain verification API. Every event cryptographically linked to its predecessor. |
| **User & Role Management** | **Live** | JWT access/refresh tokens. RBAC with patient, doctor, admin roles. bcrypt hashing (12 rounds). |
| **Appointment Scheduling** | **In Dev** | Patient queue and scheduling (Express-based module from hospital-core). |
| **Telemedicine** | **Research** | Video consultation capability planned. |
| **Pharmacy Operations** | **Research** | Prescription management and inventory planned. |
| **Emergency Dispatch** | **Research** | Emergency routing and dispatch planned. |
| **AI Governance Layer** | **Planned** | Consent-to-train pipelines, model audit trails, anonymization engine. |
| **NPHIES Integration** | **Planned** | Saudi national e-claims and interoperability connection. |
| **Malaffi / NABIDH** | **Planned** | UAE health information exchange integration. |

### 3.3 Deployment Models

| Model | Description | Use Case |
|-------|-------------|----------|
| **On-Premise** | Deployed entirely within ministry data centers. Full physical and logical control. | National defense-grade security. Jurisdictions with data localization laws. |
| **Private Cloud** | Deployed on ministry-managed VPC (AWS GovCloud, Azure Government, or local provider). | Scalable without physical infrastructure ownership. |
| **Sovereign Cloud** | Deployed on nationally owned cloud infrastructure (e.g., Oracle Saudi, Alibaba MENA, local sovereign cloud). | Balance of scalability and sovereignty. |
| **Railway / Commercial** | Deployed on commercial PaaS (Railway, AWS, Azure, GCP) with encryption-at-rest. | Pilot programs, non-sensitive deployments, development. |

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | Next.js + React | 15.1 / 19.0 | App Router, server components, RTL support. |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x | Accessible, customizable, 65+ pre-built components. |
| **Internationalization** | Custom i18n with useTranslation | — | English + Arabic. RTL/LTR switching per route. |
| **Backend** | FastAPI (Python) | 3.12 / 0.115 | Async-native, OpenAPI auto-docs, high throughput. |
| **ORM** | SQLAlchemy 2.0 (async) | 2.0 | Async PostgreSQL with connection pooling. |
| **Database** | PostgreSQL | 16 | JSONB for FHIR resources, native UUID, robust. |
| **Cache** | Redis | 7 | Rate limiting, session cache, token blacklist. |
| **Auth** | JWT (HS256) | Custom | Access token (15 min) + refresh token (7 day) rotation. |
| **Audit** | SHA-256 hash chain | Custom | Tamper-evident, cryptographically verifiable. |
| **Migration** | Alembic | 1.14 | Schema version control. |

### 4.2 Frontend Architecture

The UnityCare frontend is built on Next.js 15 App Router with full i18n support for English and Arabic. Route segments under `/[locale]/` load the appropriate language and direction (LTR/RTL) automatically.

**Key pages:**

- `/` — Landing (Hero, Features, Compliance)
- `/login` — Authentication
- `/register` — User registration
- `/patient` — Patient dashboard (appointments, records, consents)
- `/doctor` — Clinical dashboard (queue, consultations, prescriptions)
- `/admin` — System administration (user management, audit viewer)
- `/not-found` — Custom 404

65+ shadcn/ui components provide a consistent, accessible design system. The compliance section highlights alignment with HIPAA, GDPR, EHDS, NPHIES, SOC 2, and ISO 27001.

### 4.3 Backend Architecture

The FastAPI application is organized into six route modules:

| Route | Prefix | Capabilities |
|-------|--------|-------------|
| Auth | `/api/v1/auth` | Register, login, refresh, logout |
| Patients | `/api/v1/patients` | FHIR R4 CRUD, search |
| Medical | `/api/v1/medical` | Clinical records (ICD-10-CM) |
| Consents | `/api/v1/consents` | Create, query, revoke, version history |
| Audit | `/api/v1/audit` | Event query, chain verification |
| Admin | `/api/v1/admin` | User management, role assignment |

Middleware stack: CORS (whitelist) → Rate limiting (configurable per-minute) → Security headers (CSP, HSTS, XFO, etc.) → Route handler.

### 4.4 FHIR R4 Interoperability

The FHIR service (`backend/app/services/fhir.py`) implements:

- **Patient resource** create, read, update, soft-delete, and search.
- **JSONB storage** preserving full FHIR resource structure.
- **Version tracking** via incrementing `version_id` on each update.
- **UUID-based resource identification** compatible with national HIE requirements.

Additional FHIR resource types (Observation, Condition, MedicationRequest, Encounter, Practitioner) are on the roadmap.

### 4.5 Blockchain Audit Trail

The audit ledger (`backend/app/services/audit.py`) implements a cryptographic hash chain:

```
Genesis Event (previous_hash = null)
    │
    ▼
Event 2 (previous_hash = sha256(genesis_data))
    │
    ▼
Event 3 (previous_hash = sha256(event2_data))
    │
    ▼
...
```

Each `AuditEvent` stores:
- `event_id` (UUID v4)
- `actor_id`, `actor_email`
- `action`, `resource_type`, `resource_id`
- `details` (JSONB)
- `ip_address`
- `previous_hash` — SHA-256 of the prior event
- `event_hash` — SHA-256 of `(previous_hash + event_data)`
- `timestamp` (UTC)

The `verify_chain()` method re-computes every hash from genesis to head, returning `False` if any tampering is detected. This provides court-admissible evidence integrity.

### 4.6 ICD-10-CM Coding

The medical service (`backend/app/services/medical.py`) supports ICD-10-CM diagnosis coding as structured data within FHIR-compatible resources, enabling standardized morbidity and mortality reporting at the national level.

### 4.7 Consent Engine with Versioning

The consent service (`backend/app/services/consent.py`) provides:

- Consent creation with **purpose limitation** (treatment, research, payment, operations).
- **Jurisdiction scoping** (per consent, field-selectable).
- **Expiry** with automatic invalidation (enforcement planned).
- **Full version history** — every change creates a `ConsentVersion` snapshot.
- **Revocation** with audit trail and cryptographic signature via `compute_consent_hash()`.
- Each consent carries a `signature_hash` that binds the consent data to the patient identity.

---

## 5. Compliance & Certifications

### 5.1 Regulatory Alignment Map

| Regulation / Standard | Status | UnityCare Controls |
|-----------------------|--------|-------------------|
| **HIPAA** (US) | Architecture aligned | RBAC, audit logging, consent management, encryption-at-rest, soft-delete, BAA-ready architecture. |
| **GDPR** (EU) | Architecture aligned | Consent with purpose limitation, right to erasure (soft-delete), data portability (FHIR export), audit trail. |
| **Egypt Law 151** (2020) | Architecture aligned | Data localization (on-premise), consent management, audit trail, regulatory access controls. |
| **Saudi PDPL** | Architecture aligned | Consent with jurisdiction scoping, data processing registry, cross-border transfer controls. |
| **EHDS** (EU) | Planned | FHIR R4 alignment, patient access APIs, secondary use consent pipeline (roadmap). |
| **NPHIES** (Saudi) | Planned | National e-claims format mapping, interoperability gateway. |
| **Malaffi / NABIDH** (UAE) | Planned | UAE health information exchange API alignment. |

### 5.2 Certification Roadmap

| Certification | Target | Timeline |
|-------------|--------|----------|
| SOC 2 Type II | Audit readiness review | Q3 2026 |
| ISO 27001 | ISMS implementation | Q4 2026 |
| HITRUST CSF | Certified deployment | Q1 2027 |
| HIPAA (attestation) | BA agreement | With each US-covered entity deployment |
| National data protection authority | In-country registration | Prior to deployment |

### 5.3 SMART-on-FHIR Readiness

UnityCare's FHIR R4 API surface is designed for SMART-on-FHIR launch context integration, enabling:

- Third-party clinical applications (lab systems, imaging, clinical decision support) to authenticate via OAuth 2.0.
- Patient-facing apps to access their own records via patient-scoped tokens.
- National HIE nodes to query cross-organization patient data.

Full SMART-on-FHIR conformance is targeted for Q3 2026.

### 5.4 Sovereign Data Residency

UnityCare enforces data residency at the architectural level:

- **Storage:** All patient data, consent records, and audit events reside in the jurisdiction's database.
- **Encryption:** Encryption keys are generated and managed by the ministry (BYOK support available).
- **Network:** No outbound data routes to foreign servers. Telemetry and monitoring are ministry-controlled.
- **Backup:** Backups are stored within national boundaries. Cross-border DR is optional and policy-controlled.

---

## 6. Security

### 6.1 Authentication & Authorization

| Mechanism | Implementation |
|-----------|---------------|
| **Password hashing** | bcrypt, 12 rounds (`backend/app/utils/security.py`) |
| **Access tokens** | JWT (HS256), 15-minute expiry, includes role + user ID |
| **Refresh tokens** | JWT, 7-day expiry, rotation on each refresh |
| **Token blacklist** | Revoked tokens are blacklisted on logout |
| **RBAC** | Three-tier: patient, doctor, admin. Middleware-enforced on every protected route. |
| **MFA** | TOTP scaffold implemented (`verify_totp`). UI integration planned. |
| **Rate limiting** | In-memory per-IP-per-route limiter, configurable (default: 60 req/min). |

### 6.2 Audit Logging & Chain Verification

Every security-relevant action is logged to the hash-chained audit ledger:

| Category | Events Logged |
|----------|--------------|
| **Authentication** | Login, logout, registration, token refresh, failed login attempts |
| **Consent** | Consent created, updated, revoked, expired |
| **Patient data** | Record created, updated, deleted (soft), accessed (read) |
| **Administration** | User created, role changed, account disabled |
| **System** | Health check failures, rate limit triggers, configuration changes |

The `verify_chain()` endpoint provides a programmatic integrity check — any tampering with past events is immediately detectable.

### 6.3 Rate Limiting & DDoS Protection

| Layer | Protection |
|-------|-----------|
| **Application** | Per-IP-per-route rate limiting (configurable window and threshold). Health/status endpoints excluded. |
| **Edge (Railway)** | TLS termination, edge caching, regional DDoS mitigation. |
| **Planned** | Cloud WAF (Cloudflare or equivalent) for production sovereign deployments. |

### 6.4 Security Headers

Every API response includes (via `SecurityHeadersMiddleware`):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | `default-src 'self'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |

### 6.5 Vulnerability Management

- **Dependabot** is configured for both backend (Python) and frontend (npm) dependencies.
- All alerts are triaged within 48 hours. Critical patches are applied within 72 hours.
- Current posture: **0 open alerts** across both stacks (as of June 2026).

### 6.6 Penetration Testing

Penetration testing is planned prior to any production deployment. The ministry may commission:

- External black-box assessment.
- Internal grey-box assessment (with API documentation).
- Source code review (full access to the UnityCare repository).
- Cryptographic audit (SHA-256 chain implementation review).

Elmahrosa International will remediate all critical and high-severity findings prior to go-live.

---

## 7. Deployment & Operations

### 7.1 Deployment Options

| Option | Provisioning | Estimated Timeline | Suitable For |
|--------|-------------|-------------------|-------------|
| **Local Docker Compose** | Manual / Ansible | 1 day | Single hospital, pilot |
| **Ministry Data Center** | Bare metal / VM + Docker | 1–2 weeks | National deployment |
| **Private Cloud (AWS/Azure/GCP)** | Terraform + Helm | 1 week | Scaled regional deployment |
| **Sovereign Cloud** | Provider-specific IaC | 2–3 weeks | Compliance-optimized |
| **Railway (PaaS)** | `railway up` | 2 hours | Development, demo, pilot |

### 7.2 Infrastructure Components

```
┌──────────────────────────────────────────────────┐
│                   Reverse Proxy                   │
│            (nginx / Railway Edge / ALB)           │
├──────────────────────┬───────────────────────────┤
│   Frontend (Next.js) │  Backend (FastAPI + Uvicorn) │
│   Static + SSR       │  6× async workers            │
├──────────────────────┴───────────────────────────┤
│              PostgreSQL 16 (Primary)               │
│              + Streaming Replica (DR)              │
├──────────────────────────────────────────────────┤
│                   Redis 7                          │
│              (Cache + Rate Limit + Sessions)       │
├──────────────────────────────────────────────────┤
│              Object Store (S3/MinIO)               │
│              (Documents, FHIR attachments)         │
└──────────────────────────────────────────────────┘
```

### 7.3 Backup & Disaster Recovery

| Component | Backup Frequency | Retention | DR Strategy |
|-----------|-----------------|-----------|-------------|
| PostgreSQL | Continuous WAL archiving + daily full backup | 30 days (configurable) | Streaming replica in secondary zone. RPO < 1 min, RTO < 15 min. |
| Redis | Snapshot every 5 minutes | 7 days | Rebuildable from DB. Non-critical cache. |
| Object store | Daily incremental | 30 days | Cross-region replication (optional). |

### 7.4 Monitoring & Observability

- **Health endpoints:** `/health`, `/status`, `/version` on both frontend and backend.
- **OpenTelemetry:** Conditional OTLP export for traces and metrics (configurable endpoint).
- **Prometheus + Grafana:** Configuration files provided (`infra/prometheus.yml`, `infra/grafana/`). Dashboards for request rate, error rate, latency, DB pool, and audit chain integrity.
- **Structured logging:** JSON-formatted logs via Python `logging` module. Log aggregation (ELK / Loki) configuration available.

---

## 8. Pilot Program

### 8.1 Phase 1: Single Hospital or Healthcare Network

**Duration:** 3–6 months  
**Objective:** Validate UnityCare in a live clinical environment, gather requirements, and establish the baseline for national rollout.

### 8.2 Scope

| Module | Included in Pilot | Notes |
|--------|-----------------|-------|
| Patient Records (EHR) | Yes | FHIR R4 patient management. |
| Consent Engine | Yes | Patient consent capture, versioning, revocations. |
| Audit Ledger | Yes | Full cryptographic audit trail. |
| User & Role Management | Yes | RBAC for clinicians, admins, patients. |
| Appointment Scheduling | Yes | Outpatient queue management. |
| Telemedicine | Optional | Video consultation (if infrastructure ready). |
| Pharmacy | Optional | Prescription management. |
| NPHIES Integration | No | Phase 2. |
| AI Governance | No | Phase 3. |

### 8.3 Success Metrics

| Metric | Target |
|--------|--------|
| Patient records created | 10,000+ |
| Consent records captured | 5,000+ |
| Audit events logged | 100,000+ |
| System uptime | 99.5% |
| API response time (p95) | < 200 ms |
| Chain verification success | 100% |
| User satisfaction (clinician survey) | > 4.0 / 5.0 |

### 8.4 Independent Security Review

Prior to pilot commencement, the ministry may commission an independent security review covering:

- Source code audit of the entire backend.
- Penetration testing of all API endpoints.
- Cryptographic review of the hash chain implementation.
- Infrastructure security assessment (network, access controls, encryption).

Elmahrosa will provide full documentation, source access, and dedicated engineering support for the review.

### 8.5 Pilot Deliverables

- Deployed and configured UnityCare instance.
- Clinician and administrator training (onsite or remote).
- User manual and administration guide (English + Arabic).
- FHIR API documentation (OpenAPI/Swagger at `/docs`).
- Pilot completion report with metrics and recommendations for national rollout.

---

## 9. Procurement Packages

### 9.1 Package Comparison

| Feature | Pilot Engagement | Institutional License | Enterprise Deployment | Sovereign National License |
|---------|-----------------|---------------------|----------------------|--------------------------|
| **Duration** | 6 months | Annual | Multi-year (3–5) | Perpetual (10-year) |
| **Facilities** | Single hospital | Single institution | Multi-hospital network | National (unlimited facilities) |
| **Deployment** | On-premise / PaaS | On-premise / Private cloud | Private / Sovereign cloud | Sovereign cloud / Ministry DC |
| **Source code** | Read-only access | Read-only access | Full source access | Full source + customization |
| **Training** | Standard (2 days) | Standard (3 days) | Advanced (5 days) | Custom curriculum |
| **SLA** | Best-effort | 99.5% uptime | 99.9% uptime | 99.95% uptime |
| **Support** | Business hours | 12×5 | 24×7 | Dedicated team on-site |
| **Security review** | Optional | Annual | Bi-annual | Continuous with dedicated SOC |
| **Customization** | Configuration only | Configuration + minor | Full customization | Full customization + co-development |
| **Price** | Fixed fee | Per-bed / per-year | Negotiated | Tendered |

### 9.2 White-Label Options

For ministries that require national branding, UnityCare can be white-labeled as the ministry's own sovereign health platform:

- Custom domain, branding, and color scheme.
- Ministry-branded mobile applications (iOS/Android — roadmap).
- Co-branded documentation and training materials.
- Optional: Ministry holds the distribution rights within the jurisdiction.

---

## 10. About Elmahrosa International

Elmahrosa International is a sovereign technology group specializing in critical national infrastructure — identity, governance, healthcare, and civic systems. Our platforms are designed for nations that demand digital sovereignty, operational resilience, and regulatory compliance.

### 10.1 TEOS Ecosystem

UnityCare is one component of the **TEOS** (Trusted Ecosystem of Sovereign) suite:

| Product | Function |
|---------|----------|
| **TEOS Identity** | National digital identity, authentication, and SSO. |
| **TEOS Governance** | Policy engine, consent orchestration, compliance automation. |
| **TEOS Sentinel** | Security monitoring, SIEM integration, threat detection. |
| **TEOS Civic Infrastructure** | E-government services, citizen portal, municipal systems. |
| **UnityCare** | Healthcare infrastructure platform (this brief). |

### 10.2 Contact Information

| Channel | Details |
|---------|---------|
| **Website** | `https://elmahrosa.org` |
| **Platform (demo)** | `https://health.elmahrosa.org` |
| **API (demo)** | `https://api.elmahrosa.org` |
| **Developer portal** | `https://developers.elmahrosa.org` |
| **CPN membership** | Elmahrosa International is a registered member of the CPN (Cyber Protection Network). |

For procurement inquiries, pilot program requests, or security reviews, please contact the Elmahrosa International Government Relations team via the official website.

---

## 11. Appendices

### Appendix A: API Endpoints Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register a new user | None |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT tokens | None |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Refresh token |
| `POST` | `/api/v1/auth/logout` | Revoke current tokens | Bearer |
| `POST` | `/api/v1/patients` | Create patient (FHIR R4) | Bearer |
| `GET` | `/api/v1/patients/{fhir_id}` | Read patient | Bearer |
| `PUT` | `/api/v1/patients/{fhir_id}` | Update patient | Bearer |
| `DELETE` | `/api/v1/patients/{fhir_id}` | Soft-delete patient | Bearer (admin) |
| `GET` | `/api/v1/patients` | Search patients | Bearer |
| `POST` | `/api/v1/medical/diagnoses` | Create diagnosis (ICD-10-CM) | Bearer (doctor) |
| `GET` | `/api/v1/medical/diagnoses/{patient_id}` | Get patient diagnoses | Bearer |
| `POST` | `/api/v1/consents` | Create consent record | Bearer |
| `GET` | `/api/v1/consents/{id}` | Get consent by ID | Bearer |
| `GET` | `/api/v1/consents/patient/{patient_id}` | List patient consents | Bearer |
| `POST` | `/api/v1/consents/{id}/revoke` | Revoke consent | Bearer |
| `GET` | `/api/v1/consents/{id}/versions` | Get consent version history | Bearer |
| `GET` | `/api/v1/audit` | Query audit events (paginated, filterable) | Bearer (admin) |
| `POST` | `/api/v1/audit/verify` | Verify full audit chain integrity | Bearer (admin) |
| `GET` | `/api/v1/admin/users` | List all users | Bearer (admin) |
| `GET` | `/api/v1/admin/users/me` | Get current user profile | Bearer |
| `PUT` | `/api/v1/admin/users/{id}/role` | Assign user role | Bearer (admin) |
| `GET` | `/health` | Health check (includes DB status) | None |
| `GET` | `/status` | Detailed service status | None |
| `GET` | `/version` | Application version info | None |

### Appendix B: Demo Accounts

| Role | Email | Credentials | URL |
|------|-------|-------------|-----|
| Patient | `patient@demo.elmahrosa.org` | Contact for credentials | `https://health.elmahrosa.org/patient` |
| Doctor | `doctor@demo.elmahrosa.org` | Contact for credentials | `https://health.elmahrosa.org/doctor` |
| Admin | `admin@demo.elmahrosa.org` | Contact for credentials | `https://health.elmahrosa.org/admin` |

Demo instances reset daily. Persistent demo environments are available for procurement evaluation upon request.

### Appendix C: Technical Specifications

| Parameter | Specification |
|-----------|--------------|
| **API style** | RESTful, JSON, versioned (`/api/v1/`) |
| **API documentation** | OpenAPI 3.1 (auto-generated at `/docs`) |
| **Authentication** | Bearer JWT (HS256) |
| **Interoperability** | FHIR R4 (Patient resource), ICD-10-CM |
| **Database** | PostgreSQL 16 with JSONB, UUID, async driver |
| **Cache** | Redis 7 |
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4 |
| **i18n** | English (EN), Arabic (AR) — full RTL/LTR |
| **Deployment** | Docker Compose, Railway, AWS, Azure, GCP, on-premise |
| **Minimum RAM (backend)** | 2 GB (pilot), 8 GB (production) |
| **Minimum RAM (frontend)** | 1 GB (pilot), 4 GB (production) |
| **Database storage** | 50 GB (pilot), 500 GB+ (national — scalable) |
| **Supported clients** | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |

### Appendix D: Compliance Mapping Tables

#### D.1 HIPAA Mapping (Selected Controls)

| HIPAA Rule | UnityCare Control |
|-----------|------------------|
| 164.312(a)(1) — Access control | RBAC middleware, JWT authentication |
| 164.312(a)(2)(i) — Unique user ID | UUID-based user identity |
| 164.312(a)(2)(iii) — Automatic logoff | Token expiry (15 min access, 7 day refresh) |
| 164.312(b) — Audit controls | Hash-chained audit ledger |
| 164.312(c)(1) — Integrity | SHA-256 chain verification |
| 164.312(d) — Person authentication | bcrypt password + JWT |
| 164.312(e)(1) — Transmission security | HTTPS enforced at edge |
| 164.314(a)(2)(i) — BA requirements | BAA-ready architecture |

#### D.2 GDPR Mapping (Selected Controls)

| GDPR Article | UnityCare Control |
|-------------|------------------|
| Art. 5 — Lawfulness, fairness, transparency | Consent engine with purpose limitation |
| Art. 7 — Consent conditions | Versioned consent with revocation |
| Art. 17 — Right to erasure | Soft-delete (`is_active = False`) |
| Art. 20 — Data portability | FHIR R4 export |
| Art. 25 — Data protection by design | Encryption at rest, RBAC, audit trail |
| Art. 30 — Record of processing | Audit ledger |
| Art. 32 — Security of processing | bcrypt, JWT, rate limiting, security headers |
| Art. 33 — Breach notification | Audit alerting pipeline (planned) |

#### D.3 Egypt Law 151 Mapping

| Requirement | UnityCare Control |
|-------------|------------------|
| Data localization | On-premise / sovereign cloud deployment |
| Consent required for processing | Full consent engine |
| Data subject access rights | Patient API + audit query |
| Regulatory audit access | Audit ledger with chain verification |
| Cross-border transfer restrictions | Jurisdiction-scoped consent, no foreign data routes |

#### D.4 Saudi PDPL Mapping (Selected)

| PDPL Requirement | UnityCare Control |
|-----------------|------------------|
| Personal data processing consent | Consent engine with purpose + jurisdiction |
| Data subject rights | Record access, erasure, portability |
| Processing registry | Audit ledger |
| Controller obligations | Ministry-controlled deployment |
| Cross-border transfer | Consent jurisdiction field + policy enforcement (planned) |

---

*End of document. For questions, procurement requests, or to schedule a live demonstration, please contact Elmahrosa International via the official government procurement channel or visit `https://elmahrosa.org`.*
