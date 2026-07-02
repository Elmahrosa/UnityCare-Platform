# UnityCare Platform — Data Governance Framework

> **Document Owner:** Elmahrosa International  
> **Classification:** Confidential — Customer-Facing  
> **Last Updated:** June 2026  
> **Target Audience:** Government Data Protection Officers, Compliance Teams, Regulatory Auditors

---

## 1. Data Governance Framework

### 1.1 Data Classification Levels

The UnityCare platform classifies all data into four tiers, with each tier defining permissible handling, storage, and access controls:

| Level | Definition | Examples | Access Control |
|-------|-----------|---------|----------------|
| **Public** | Non-sensitive information with no re-identification risk | Marketing content, facility hours, published research abstracts | No authentication required |
| **Internal** | Operational data not containing personal or health information | Shift schedules, inventory counts (non-PHI), system logs (anonymised) | Authenticated user, any role |
| **Confidential** | Personal data and de-identified health information | Patient demographics (name, DOB, contact), appointment history, billing records | Role-specific (patient, provider, admin), audited |
| **Restricted** | Directly identifying health data subject to statutory protection | Clinical notes, diagnosis codes, lab results, genomic data, consent records | Provider + patient only, full audit trail, encryption at rest |

All data inherits the highest classification of any field it contains. A medical record containing a single Restricted field is classified Restricted in its entirety.

### 1.2 Data Lifecycle Management

| Phase | Controls | Enforcement Mechanism |
|-------|----------|----------------------|
| **Collection** | Purpose limitation, consent capture, field-level validation | `ConsentService.create_consent()` before data ingestion; FastAPI Pydantic validation |
| **Storage** | PostgreSQL 16 with JSONB (FHIR), AES-256-GCM at rest, TLS 1.3 in transit | Database-level encryption; application-layer field access control |
| **Processing** | RBAC middleware (`requireRole()`), rate limiting, input sanitisation | Middleware chain on every FastAPI route |
| **Sharing** | Consent-based authorisation; jurisdiction-aware policy field | `Consent.jurisdiction` column; `ConsentPurpose.DATA_SHARING` and `.CROSS_BORDER` |
| **Retention** | Configurable per-class expiry; automated cleanup | `expires_at` on consent records; retention cron jobs |
| **Deletion** | Soft-delete (`is_active = False`); eventual hard purge per policy | FHIR `delete_patient()` sets `is_active=False`; GDPR-compliant |

### 1.3 Data Ownership and Stewardship

- **Data Owner:** The deploying healthcare institution retains full ownership of all data. The platform functions exclusively as processing infrastructure.
- **Data Steward:** Elmahrosa International acts as data processor, with stewardship limited to technical operation, security, and compliance enforcement.
- **Data Controller:** The deploying institution is the data controller for the purposes of GDPR Art. 4(7).
- **Segregation:** Each institution receives a dedicated, isolated deployment. No cross-institution data access is architecturally possible.

---

## 2. Data Residency & Sovereignty

### 2.1 Sovereign Deployment Architecture

UnityCare is designed from first principles for sovereign operation:

- **On-Premise / Private Cloud:** The platform can be deployed entirely within the institution's own infrastructure — including air-gapped environments — with zero dependency on external cloud services.
- **National Borders:** All data persists within the physical jurisdiction of the deployment. No data egress occurs without explicit cross-border consent.
- **No Third-Party Processing:** The platform does not embed any third-party analytics, telemetry, or sub-processors. All code is self-contained.

### 2.2 Sovereign Control

The deploying institution retains:

- Full administrative control over the database, encryption keys, and infrastructure
- Source code escrow availability for independent audit
- Control over which version of the platform runs and when upgrades occur
- Authority to terminate, suspend, or export all data at any time

### 2.3 Cross-Border Consent Management

Where lawful data transfer across national boundaries is required (e.g., a patient seeking treatment abroad), the consent engine enforces:

```
ConsentPurpose.CROSS_BORDER
```

Each cross-border consent record captures:

- Source and destination jurisdictions (`Consent.jurisdiction` field)
- Explicit patient grant with SHA-256 signature hash
- Expiry date and automatic revocation on expiration
- Full versioned history for audit

---

## 3. Consent Management

### 3.1 Purpose-Based Consent Model

The platform defines five consent purposes, each stored as a `ConsentPurpose` enum:

| Purpose | Code | Description |
|---------|------|-------------|
| Treatment | `treatment` | Clinical care, diagnosis, prescription, referral |
| Research | `research` | Anonymised or de-identified research studies |
| AI Processing | `ai_processing` | Machine learning model training and inference |
| Data Sharing | `data_sharing` | Sharing with named partner institutions |
| Cross-Border | `cross_border` | Transfer of data across national jurisdictions |

Each purpose is independently granted, versioned, and revocable.

### 3.2 Versioned Consent Records

Every consent event — creation, modification, revocation — produces an immutable `ConsentVersion` record containing:

- Full JSON snapshot of the consent at that point
- `changed_by` actor identifier
- `changed_at` timestamp
- Sequential version number

### 3.3 Consent Revocation & Automatic Enforcement

Consent revocation is immediate and audited:

```python
# backend/app/services/consent.py:69
consent.status = ConsentStatus.REVOKED
consent.version += 1
# Version snapshot created; audit event logged
```

Revocation is propagated to downstream processing pipelines. The automated enforcement layer (planned for Q3 2026) will block data access at the database middleware level.

### 3.4 Jurisdiction-Aware Consent Policies

Each consent record carries a `jurisdiction` field (ISO 3166-1 alpha-2), enabling:

- Jurisdiction-specific consent requirements (e.g., GDPR Art. 49 for cross-border)
- Region-specific processing rules
- Regulatory reporting by jurisdiction

### 3.5 Granular Patient Controls

Patients can, via the patient dashboard:

- View all active and historical consents
- Grant or deny consent per purpose independently
- Set consent expiry dates
- Revoke any consent at any time
- Export complete consent history

---

## 4. Audit & Accountability

### 4.1 SHA-256 Hash-Chained Audit Trail

The audit ledger (`AuditEvent` model) implements a cryptographic hash chain:

```
event_hash = SHA-256(previous_hash + event_data)
```

Each event stores:

- `previous_hash` — the hash of the immediately preceding event
- `event_hash` — the computed hash of this event
- Full event payload (actor, action, resource, timestamp, IP)

### 4.2 Tamper-Evident Verification

The chain can be verified programmatically at any time:

```
GET /api/v1/audit/verify
→ { "chain_valid": true | false }
```

The `verify_chain()` method (see `backend/app/services/audit.py:80`) recomputes every event hash in sequence and confirms continuity. Any discrepancy — even a single byte modified retroactively — breaks the chain and returns `false`.

This enables third-party auditors to independently verify ledger integrity without trusting the platform's storage layer.

### 4.3 Events Logged

Every data access and mutation is captured:

| Category | Events |
|----------|--------|
| Authentication | Login, logout, refresh, failed login attempt, account lockout |
| Patient Records | FHIR create, read, update, delete, search |
| Consent | Create, modify, revoke, expire |
| Admin | Role assignment, user management, system configuration |
| Clinical | Appointment create/update, prescription write, lab order |
| Export | Data portability requests, report generation |

### 4.4 Immutable Records

Audit events are append-only. No `UPDATE` or `DELETE` operations are permitted on the `audit_events` table. Cryptographic chain integrity supplements database-level append-only enforcement.

---

## 5. Patient Rights

The platform implements the full set of data subject rights required under GDPR and mirrored by HIPAA, Egypt Law 151, and Saudi PDPL:

| Right | Implementation | API / Mechanism |
|-------|---------------|-----------------|
| **Right of Access** | FHIR R4 patient read endpoint; full data export | `GET /api/v1/patients/me` |
| **Right to Rectification** | Patient self-service update; provider-assisted correction | `PUT /api/v1/patients/me` |
| **Right to Erasure** | Account deactivation with soft-delete; hard purge on retention expiry | `DELETE /api/v1/patients/me` (sets `is_active=False`) |
| **Right to Data Portability** | Machine-readable export in FHIR JSON format | `GET /api/v1/patients/me/export?format=json` |
| **Right to Restriction of Processing** | Per-purpose consent revocation; blocks downstream processing | `POST /api/v1/consents/{id}/revoke` |
| **Right to Object** | Consent management interface; granular purpose-level opt-out | Patient dashboard consent controls |

All patient rights requests are logged to the audit ledger with a unique event ID for traceability.

---

## 6. Data Security

### 6.1 Encryption

| Scope | Algorithm / Protocol | Detail |
|-------|---------------------|--------|
| In Transit | TLS 1.3 | Railway edge termination; HSTS enabled (1 year) |
| At Rest | AES-256-GCM | PostgreSQL 16 transparent data encryption |
| Field-Level | Application-layer encryption | Sensitive columns encrypted before write |
| Key Management | Environment variables (dev) / HSM (production) | Key rotation supported |

### 6.2 Access Control

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT (15-min access token + 7-day refresh token with rotation); bcrypt (cost factor 12) |
| MFA | TOTP scaffold implemented; activation pending UI completion |
| Authorisation | Role-Based Access Control — 4 roles: `patient`, `provider`, `admin`, `auditor` |
| Session Management | Token blacklist on logout; account lockout after configurable failed attempts |

### 6.3 Network & Application Security

- **Rate Limiting:** 200 requests/15-minute window (global); 20 requests/15-minute window (auth routes)
- **Security Headers:** Helmet.js middleware — HSTS, Content Security Policy, Referrer-Policy, X-Content-Type-Options
- **Input Validation:** Pydantic schemas on all FastAPI mutation endpoints
- **Error Handling:** Structured error responses; no stack traces exposed to clients
- **No PHI in Logs:** Structured logging with sensitive field exclusion

---

## 7. AI & Biomedical Data Governance

### 7.1 Separate Consent for AI Processing

AI/ML model training requires explicit consent under the dedicated purpose:

```
ConsentPurpose.AI_PROCESSING
```

This is independent of and orthogonal to treatment, research, and data-sharing consents. A patient may consent to AI processing while refusing data sharing, or vice versa.

### 7.2 De-Identified Data Pipelines

Data supplied to AI pipelines undergoes de-identification per HIPAA Safe Harbor / Expert Determination methods:

- Direct identifiers removed (name, ID numbers, contact information)
- Dates shifted or generalised
- Free-text fields scanned for residual PHI
- De-identification verified before pipeline entry

### 7.3 Model Auditability

- Every AI training run is logged to the audit ledger
- Training datasets are versioned and traceable to consent records
- Model outputs are linked to the specific model version and training cohort
- Provenance metadata accompanies all AI-generated insights

### 7.4 Human Oversight Workflows

No AI-generated clinical output reaches a patient without human review:

1. AI produces recommendation / insight
2. Licensed provider reviews and either approves, modifies, or rejects
3. Audit trail records the human review decision
4. Only approved outputs are committed to the patient record

### 7.5 Reproducible Healthcare AI Operations

Training pipelines are configured declaratively, enabling:

- Deterministic reproduction of any model from stored hyperparameters and dataset snapshots
- Full dependency pinning (library versions, random seeds, environment)
- Audit-trail linkage between model outputs and their training provenance

---

## 8. Compliance Mapping

The following table maps UnityCare's data governance controls to major regulatory frameworks:

| Requirement | HIPAA | GDPR | Egypt Law 151 (2020) | Saudi PDPL |
|-------------|-------|------|---------------------|------------|
| **Data Classification** | §164.514 (De-identification) | Art. 5(1)(c) (Data minimisation) | Art. 2 (Personal data definition) | Art. 1 (Personal data categories) |
| **Consent Management** | §164.508 (Authorization) | Art. 6-7 (Lawful processing) | Arts. 5-6 (Consent requirements) | Arts. 6-8 (Consent & purpose) |
| **Purpose Limitation** | §164.502 (Minimum necessary) | Art. 5(1)(b) | Art. 3 (Purpose specification) | Art. 5 (Purpose limitation) |
| **Right of Access** | §164.524 (Access to PHI) | Art. 15 | Art. 8 | Art. 16 |
| **Right to Rectification** | §164.526 (Amendment) | Art. 16 | Art. 9 | Art. 17 |
| **Right to Erasure** | §164.502 (De-identification alternative) | Art. 17 | Art. 10 | Art. 18 |
| **Right to Data Portability** | §164.524 (Electronic copy) | Art. 20 | Not explicitly covered | Art. 19 |
| **Right to Restrict Processing** | §164.522 (Restriction request) | Art. 18 | Art. 11 | Art. 10 |
| **Audit Logging** | §164.312(b) (Audit controls) | Art. 5(2) (Accountability) | Art. 13 (Record-keeping) | Art. 24 (Record-keeping) |
| **Encryption at Rest** | §164.312(a)(2)(iv) (Addressable) | Art. 32 (Security) | Art. 15 | Art. 22 |
| **Encryption in Transit** | §164.312(e)(1) (Transmission) | Art. 32 | Art. 15 | Art. 22 |
| **Access Control / RBAC** | §164.312(a)(1) (Unique user ID) | Art. 32(1)(b) | Art. 14 | Art. 21 |
| **Data Retention Limits** | §164.530 (6-year min.) | Art. 5(1)(e) | Art. 12 | Art. 11 |
| **Breach Notification** | §164.400–414 | Art. 33-34 | Art. 17 | Art. 30 |
| **Cross-Border Transfer** | N/A (US domestic) | Arts. 44-49 | Arts. 18-19 (prohibited unless permitted) | Arts. 28-29 |
| **AI Governance** | Not specified | Art. 22 (Automated decisions) | Not specified | Not specified |

> **Legend:**
> - **Bold requirement** = control implemented in production code
> - *Italic* = documented procedure or policy in place
> - Plain text = planned or under development

---

## 9. Data Retention Policy

### 9.1 Retention Schedules

| Data Category | Retention Period | Basis | Disposal Method |
|---------------|-----------------|-------|-----------------|
| **Medical Records** | 10 years from last encounter (or local statutory minimum, whichever is longer) | HIPAA §164.530, Egypt Law 151 Art. 12 | Soft-delete → hard purge after retention + 1 year |
| **Audit Logs** | 7 years minimum | HIPAA §164.530 (6 years), GDPR Art. 5(1)(e) | Append-only archive; hard delete after 7 years |
| **Consent Records** | Duration of consent + 5 years | GDPR Art. 7(3), Egypt PDPL guidance | Versioned snapshots retained; active consent purged on expiry + 5 years |
| **User Accounts** | Until deactivation request or 2 years of inactivity | GDPR data minimisation principle | Soft-deactivate at 2 years inactivity; hard purge at 5 years |
| **Session & Token Data** | 7 days (refresh tokens) / 15 min (access tokens) | Operational necessity | Automatic expiry by TTL; blacklist entries purged weekly |
| **De-Identified Research Data** | Indefinite (no re-identification risk) | HIPAA Safe Harbor exemption | Governance review every 3 years; re-identification risk reassessment |

### 9.2 Enforcement Mechanisms

- Retention schedules are configurable per deployment via environment variables
- Automated cron jobs enforce hard purges at defined intervals
- All deletions are preceded by a 30-day grace period with data recovery capability
- Hard purges are logged with a tamper-proof audit entry

### 9.3 Legal Hold

Upon receiving a legal hold notice (litigation hold, regulatory investigation):

1. The affected records are flagged in the database with a legal hold marker
2. Automated retention-based deletion is suspended for flagged records
3. The hold is logged to the audit ledger with the authorising institution and case reference
4. Upon hold release, records revert to standard retention schedules

---

## Appendix A: Related Documents

| Document | Location |
|----------|----------|
| COMPLIANCE.md | `docs/COMPLIANCE.md` |
| DATA_PRIVACY.md | `docs/DATA_PRIVACY.md` |
| SECURITY_OVERVIEW.md | `docs/institutional/SECURITY_OVERVIEW.md` |
| THREAT_MODEL.md | `docs/THREAT_MODEL.md` |
| INCIDENT_RESPONSE_PROCESS.md | `docs/INCIDENT_RESPONSE_PROCESS.md` |
| MASTER_CAPABILITIES.md | `MASTER_CAPABILITIES.md` |

## Appendix B: Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| June 2026 | 1.0 | Elmahrosa International | Initial release — comprehensive data governance whitepaper |

---

*This document is intended for procurement evaluation and regulatory review. Technical implementation details are based on the UnityCare Platform codebase as of June 2026. For the most current information, contact compliance@elmahrosa.com.*

**Copyright 2025–2026 Elmahrosa International. All rights reserved.**
