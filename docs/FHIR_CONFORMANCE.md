# FHIR R4 Conformance Statement — UnityCare Platform

| Metadata | Value |
|---|---|
| **FHIR Version** | R4 (4.0.1) |
| **MIME Type** | `application/json` (JSON only) |
| **API Style** | RESTful HTTP |
| **Base URL** | `https://api.unitycare.health/api/v1/fhir` |
| **Published** | 2026-06-20 |
| **Status** | Draft — Active Development |

---

## 1. Conformance Statement Overview

UnityCare implements a subset of the HL7 FHIR R4 specification to support patient identity, consent management, clinical audit, and provider directory use cases. The implementation follows a pragmatic "FHIR-native-for-Patient, FHIR-aligned-for-everything-else" approach: the Patient resource is stored and served as raw FHIR JSON through full CRUD endpoints, while related domains (consent, audit, appointments) follow FHIR resource concepts and data models but are exposed through purpose-built RESTful endpoints.

The system uses PostgreSQL JSONB columns to store FHIR resource payloads as-is, avoiding schema-on-write validation beyond JSON parsing. This allows rapid iteration while maintaining forward compatibility with full FHIR ecosystem tools.

The API is versioned under `/api/v1/fhir/` and secured with JWT Bearer tokens and role-based access control (RBAC).

---

## 2. Supported Resources

| Resource Type | FHIR Profile | Read | Search | Create | Update | Delete (Soft) | Versioned |
|---|---|---|---|---|---|---|---|
| **Patient** | FHIR R4 Patient | ✅ `GET /{id}` | ✅ `GET` (skip/limit) | ✅ `POST` | ✅ `PUT /{id}` | ✅ `DELETE /{id}` | ✅ (version_id) |
| **Consent** | FHIR-aligned | ✅ `GET /consent/{id}` | ✅ `GET /consent/patient/{id}` | ✅ `POST /consent` | ✅ revoke via `POST /{id}/revoke` | ❌ | ✅ (ConsentVersion) |
| **AuditEvent** | FHIR-aligned | ✅ via `GET /audit/events` | ✅ (actor_id, action, resource_type filters) | ✅ (internal) | ❌ | ❌ | ✅ (hash-chain) |
| **Practitioner** | FHIR-aligned | ✅ `GET /admin/users/{id}` | ✅ `GET /admin/users` | ✅ via auth registration | ✅ `PATCH /admin/users/{id}` | ✅ (is_active flag) | ❌ |
| **Observation** | *Planned* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Appointment** | FHIR-aligned | ✅ `GET /appointments/{id}` | ✅ `GET /appointments/doctor/{id}` / `.../patient/{id}` | ✅ `POST /appointments` | ✅ `PATCH /appointments/{id}` | ✅ `DELETE /appointments/{id}` | ❌ |
| **MedicalRecord** | FHIR-aligned | ✅ `GET /records/{id}` | ✅ `GET /records/patient/{id}` | ✅ `POST /records` | ❌ | ❌ | ❌ |

> **Note:** Only Patient follows strict FHIR wire-format (raw resource JSONB). Consent, AuditEvent, Practitioner, and Appointment use custom database schemas aligned with FHIR concepts but served via non-FHIR endpoints. These will migrate to native FHIR endpoints in subsequent releases.

---

## 3. FHIR Endpoints Reference

All endpoints are prefixed with `https://api.unitycare.health/api/v1/fhir` unless otherwise noted.

### 3.1 Patient (FHIR-Native)

| Operation | HTTP Method | Path | Auth Required | Roles |
|---|---|---|---|---|
| **Search** | `GET` | `/Patient` | ✅ | ADMIN, PROVIDER, PATIENT |
| **Read** | `GET` | `/Patient/{fhir_id}` | ✅ | ADMIN, PROVIDER, PATIENT |
| **Create** | `POST` | `/Patient` | ✅ | ADMIN, PROVIDER |
| **Update** | `PUT` | `/Patient/{fhir_id}` | ✅ | ADMIN, PROVIDER |
| **Delete** | `DELETE` | `/Patient/{fhir_id}` | ✅ | ADMIN |

**Search Parameters:**
- `skip` (integer, default 0) — offset for pagination
- `limit` (integer, default 20, max 100) — page size

**Request/Response Format:**
```json
{
  "fhir_resource": {
    "resourceType": "Patient",
    "id": "a1b2c3d4-...",
    "name": [{ "use": "official", "family": "Example", "given": ["Nora"] }],
    "gender": "female",
    "birthDate": "1990-05-15"
  }
}
```

The `fhir_resource` field stores the complete FHIR Patient resource as-is, including the `resourceType`, `id`, and all patient demographics per the base FHIR R4 Patient profile.

**Versioning:** Each update increments `version_id` (starts at 1). The `fhir_resource` is replaced entirely on each `PUT`; no merge/diff logic is applied.

**Soft Delete:** `DELETE` sets `is_active = false`. The row remains in the database for audit trail continuity. Subsequent reads and searches exclude soft-deleted records.

### 3.2 Consent (FHIR-Aligned)

Base path: `https://api.unitycare.health/api/v1/consent`

| Operation | Method | Path | Roles |
|---|---|---|---|
| Create | `POST` | `/consent` | ADMIN, PROVIDER, PATIENT |
| Read | `GET` | `/consent/{consent_id}` | ADMIN, PROVIDER, PATIENT |
| Search by patient | `GET` | `/consent/patient/{patient_id}` | ADMIN, PROVIDER, PATIENT |
| Revoke | `POST` | `/consent/{consent_id}/revoke` | ADMIN, PROVIDER, PATIENT |
| Version history | `GET` | `/consent/{consent_id}/versions` | ADMIN, AUDITOR |

Mapped to FHIR Consent resource concepts:
- `purpose` → `Consent.purpose` (enum: treatment, data_sharing, ai_processing, research, cross_border)
- `status` → `Consent.status` (active, revoked, expired)
- `jurisdiction` → `Consent.jurisdiction` (ISO 3166-1 alpha-2, e.g., "US", "SA", "EG")
- `version` history → `ConsentVersion` table with full JSON snapshots

### 3.3 AuditEvent (FHIR-Aligned)

Base path: `https://api.unitycare.health/api/v1/audit`

| Operation | Method | Path | Roles |
|---|---|---|---|
| Search events | `GET` | `/audit/events` | ADMIN, AUDITOR |
| Verify hash chain | `GET` | `/audit/verify` | ADMIN, AUDITOR |

Each audit event records:
- `event_id` (UUID), `actor_id`, `action`, `resource_type`, `resource_id`
- `timestamp` (UTC ISO 8601)
- `ip_address`, `details` (JSONB payload)
- `previous_hash` + `event_hash` (SHA-256 hash chain for tamper detection)

The chain integrity can be verified by calling `GET /audit/verify`, which traverses all events and recomputes hash linkages.

### 3.4 Practitioner (FHIR-Aligned via Admin)

Base path: `https://api.unitycare.health/api/v1/admin/users`

| Operation | Method | Path | Roles |
|---|---|---|---|
| Search | `GET` | `/admin/users` | ADMIN |
| Read | `GET` | `/admin/users/{user_id}` | ADMIN, AUDITOR |
| Update | `PATCH` | `/admin/users/{user_id}` | ADMIN |

Practitioners are stored in the `users` table with role `provider`. Fields include `full_name`, `email`, `role` (patient/provider/admin/auditor), `locale`, MFA status, and account lock/active state.

### 3.5 Medical Records & Appointments (FHIR-Aligned)

Base path: `https://api.unitycare.health/api/v1`

| Operation | Method | Path | Roles |
|---|---|---|---|
| Create appointment | `POST` | `/appointments` | ADMIN, PROVIDER |
| Read appointment | `GET` | `/appointments/{id}` | ADMIN, PROVIDER, PATIENT |
| Update appointment | `PATCH` | `/appointments/{id}` | ADMIN, PROVIDER |
| Delete appointment | `DELETE` | `/appointments/{id}` | ADMIN |
| Search by doctor | `GET` | `/appointments/doctor/{doctor_id}` | ADMIN, PROVIDER |
| Search by patient | `GET` | `/appointments/patient/{patient_id}` | ADMIN, PROVIDER, PATIENT |
| Create medical record | `POST` | `/records` | ADMIN, PROVIDER |
| Read medical record | `GET` | `/records/{record_id}` | ADMIN, PROVIDER, PATIENT |
| Search by patient | `GET` | `/records/patient/{patient_id}` | ADMIN, PROVIDER, PATIENT |
| Record vitals | `POST` | `/iot/{user_id}/vitals` | ADMIN, PROVIDER |
| Read latest vitals | `GET` | `/iot/{user_id}/vitals` | ADMIN, PROVIDER, PATIENT |
| Vitals history | `GET` | `/iot/{user_id}/vitals/history` | ADMIN, PROVIDER, PATIENT |
| Search ICD-10 codes | `GET` | `/icd-codes?q={query}` | ADMIN, PROVIDER |
| Read ICD-10 code | `GET` | `/icd-codes/{code}` | ADMIN, PROVIDER, PATIENT |
| Create ICD-10 code | `POST` | `/icd-codes` | ADMIN |

---

## 4. Security

### 4.1 Authentication
- **Mechanism:** JWT Bearer tokens via `Authorization: Bearer <token>` header
- **Token expiry:** Access tokens 15 minutes; refresh tokens 7 days
- **Algorithm:** HS256
- **MFA:** Time-based OTP (TOTP) available per-user

### 4.2 Authorization (RBAC)
Four roles are defined, enforced via the `require_role()` dependency:

| Role | Permissions |
|---|---|
| `admin` | Full access: create/read/update/delete all resources, manage users, audit logs |
| `provider` | Create/read/update patients, appointments, records, consents; read vitals |
| `patient` | Read own data, manage own consents |
| `auditor` | Read-only access to audit logs, consent version history, user directory |

### 4.3 Transport & Header Security (FHIR API)
- TLS 1.2+ required in production
- Strict Transport Security: `max-age=31536000; includeSubDomains`
- Content Security Policy: `default-src 'self'`
- Frame Options: `DENY`
- Content-Type Options: `nosniff`
- Referrer Policy: `strict-origin-when-cross-origin`
- Permissions Policy: geolocation, microphone, camera all denied

### 4.4 Audit Logging
All resource mutations (patient CRUD, consent changes, appointment modifications) are logged to the `audit_events` table with:
- Actor identification (user UUID + email)
- Action type and resource identifier
- Timestamp with UTC timezone
- IP address
- SHA-256 hash chain linking each event to its predecessor

### 4.5 Rate Limiting
- 60 requests per minute per IP address
- Configurable via `RATE_LIMIT_PER_MINUTE` environment variable

---

## 5. Search Parameters

### 5.1 Patient
| Parameter | Type | Supported | Notes |
|---|---|---|---|
| `_id` | token | ❌ | Use `GET /Patient/{fhir_id}` instead |
| `identifier` | token | ❌ | Not indexed |
| `name` | string | ❌ | Not indexed |
| `birthdate` | date | ❌ | Not indexed |
| `gender` | token | ❌ | Not indexed |
| `_lastUpdated` | date | ❌ | Not indexed |
| `_tag` | token | ❌ | Not indexed |
| `_profile` | uri | ❌ | Not indexed |
| Pagination | — | ✅ | `skip` / `limit` query parameters |

> **Known Gap:** Patient search currently returns all active patients with skip/limit offset pagination. No field-level search filtering is implemented. Full FHIR search parameter support (name, identifier, birthdate, etc.) is planned for Q3 2026.

### 5.2 AuditEvent
| Parameter | Supported |
|---|---|
| `actor_id` | ✅ (exact match) |
| `action` | ✅ (exact match) |
| `resource_type` | ✅ (exact match) |
| Pagination | ✅ (skip/limit) |

### 5.3 Consent
| Parameter | Supported |
|---|---|
| `patient_id` | ✅ (exact match, via `/consent/patient/{id}`) |
| Version history | ✅ (via `/consent/{id}/versions`) |

---

## 6. Terminology

### 6.1 Currently Supported
- **ICD-10-CM** — 10 diagnosis codes seeded in the `icd_codes` reference table. Lookup API (`GET /icd-codes?q=`) supports code and description search. Codes can be associated with MedicalRecord entries via `icd_code` / `icd_description` fields.
- **Custom Consent Purposes** — treatment, data_sharing, ai_processing, research, cross_border (extensible enum)
- **Jurisdictions** — ISO 3166-1 alpha-2 country codes (US, SA, EG, EU, etc.)

### 6.2 Planned
- **LOINC** — For vital signs and laboratory observations
- **SNOMED CT** — For clinical findings, procedures, and problem lists
- **RxNorm** — For medication coding (contingent on MedicationRequest implementation)
- **FHIR Terminology Server** — `$expand`, `$validate-code`, `$lookup` operations (see Missing Capabilities)

---

## 7. Missing Capabilities

The following FHIR R4 capabilities are **not implemented** and are explicitly out of scope for the current release:

| Capability | Impact | Timeline |
|---|---|---|
| **Terminology Server** (`$expand`, `$validate-code`, `$lookup`) | Cannot validate codes at write time; relies on client-side validation | Q4 2026 |
| **Bulk Data Export** (`$export`) | No population-level FHIR export for analytics or data sharing | Q1 2027 |
| **`$everything` Operation** | Cannot retrieve a complete patient record in a single call | Not planned |
| **FHIR Subscription** (`Subscription` resource) | No real-time change notifications via webhook | Q1 2027 |
| **SMART-on-FHIR Launch** | No EHR-integrated launch flow; direct API access only | Q2 2027 |
| **DocumentReference** | No support for CDA or PDF document exchange | Q3 2027 |
| **ImagingStudy** | No imaging/DICOM integration | Not planned |
| **FHIR `_search` Parameter Semantics** | Full FHIR search API (`_id`, `name`, `identifier`, etc.) not implemented | Q3 2026 |
| **`OperationOutcome` Responses** | Errors return generic HTTP errors rather than FHIR OperationOutcome resources | Q3 2026 |
| **XML Support** | JSON only (`application/json`) | Not planned |
| **Patch (PATCH)** | Patient resource supports `PUT` replacement only; no JSON Patch or FHIR Patch | Q4 2026 |
| **Condition Resource** | Diagnoses stored in MedicalRecord as ICD-10 text; no FHIR Condition resource | Q3 2026 |
| **MedicationRequest** | No medication ordering or administration tracking | Q4 2026 |
| **Encounter Resource** | Appointments are FHIR-aligned but not native FHIR Encounter resources | Q4 2026 |
| **Resource `meta` Field** | No `meta.versionId`, `meta.lastUpdated` in returned FHIR resources | Q3 2026 |

---

## 8. Interoperability Roadmap

| Quarter | Milestone | Details |
|---|---|---|
| **Q3 2026** | Enhanced FHIR Search | Add `_id`, `name`, `identifier`, `birthdate`, `gender` search parameters to Patient; return `OperationOutcome` on validation errors; populate `meta.versionId` / `meta.lastUpdated` |
| **Q3 2026** | Condition Resource | Introduce `POST/GET /fhir/Condition` resource backed by MedicalRecord data with ICD-10-CM coding |
| **Q4 2026** | Observation Resource | Migrate VitalSigns to `POST/GET /fhir/Observation` using LOINC codes for heart rate, oxygen saturation, blood pressure, temperature |
| **Q4 2026** | MedicationRequest | Add MedicationRequest resource for e-prescribing workflows |
| **Q4 2026** | Encounter Resource | Convert Appointment endpoints to native FHIR `Encounter` resource |
| **Q4 2026** | FHIR Patch | Add `PATCH /fhir/Patient/{id}` support (JSON Patch / FHIR Patch) |
| **Q1 2027** | Bulk Data Export | Implement `$export` for analytics and health information exchange |
| **Q1 2027** | FHIR Subscription | Webhook-based change notification for Patient and Consent resources |
| **Q2 2027** | SMART-on-FHIR | OAuth 2.0 SMART-on-FHIR launch with EHR integration; OpenID Connect discovery |
| **Q2 2027** | Terminology Server | `$expand`, `$validate-code`, `$lookup` operations using ICD-10, LOINC, SNOMED CT |
| **Q3 2027** | DocumentReference | CDA and PDF exchange via DocumentReference resource |
| **Q4 2027** | $everything | Composite patient record retrieval operation |

---

## Appendix A: Supported FHIR RESTful Operations Summary

```
CapabilityStatement.kind = "capability"
CapabilityStatement.status = "draft"
CapabilityStatement.fhirVersion = "4.0.1"
CapabilityStatement.format = ["json"]
CapabilityStatement.rest.mode = "server"
CapabilityStatement.rest.security.service = ["OAuth"]
CapabilityStatement.rest.security.description = "JWT Bearer token with RBAC"
```

### RESTful Transaction Support
- Batch/transaction (`POST /`) — **not supported**
- History (`GET /{resource}/{id}/_history`) — **not supported**
- Version-specific read (`GET /{resource}/{id}/_history/{vid}`) — **not supported** (Patient stores version_id but does not expose via FHIR API)
- Conditional operations — **not supported**
- Patch — **not supported**

---

*Document maintained by UnityCare Platform Engineering — Elmahrosa International. For questions, contact fhir@unitycare.health.*
