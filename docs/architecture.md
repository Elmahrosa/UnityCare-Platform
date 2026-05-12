# Unity Care Hospital - Enterprise Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UNITY CARE HOSPITAL v2.0                           │
│                    Enterprise Healthcare Platform                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   Web App   │   │  Pi App     │   │  Mobile     │   │   Admin     │     │
│  │  (React)    │   │ (Pi SDK)    │   │  (Future)   │   │  Dashboard  │     │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Express.js + TypeScript                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Helmet  │ │  Rate    │ │   JWT    │ │   RBAC   │ │  Audit   │  │   │
│  │  │ Security │ │  Limiter │ │   Auth   │ │Middleware│ │  Logger  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │  Patient   │ │   Doctor   │ │  Pharmacy  │ │  Emergency │               │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │               │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘               │
│        │              │              │              │                       │
│  ┌─────┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐               │
│  │Appointment │ │ Telehealth │ │    IoT     │ │ Blockchain │               │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │   PostgreSQL       │  │     Redis          │  │      S3            │    │
│  │   (Primary DB)     │  │   (Cache/Queue)    │  │  (File Storage)    │    │
│  │                    │  │                    │  │                    │    │
│  │  • Users           │  │  • Sessions        │  │  • Medical Docs    │    │
│  │  • Records         │  │  • Rate Limits     │  │  • Images          │    │
│  │  • Appointments    │  │  • Realtime        │  │  • Backups         │    │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Pi      │ │  WebRTC  │ │   AI     │ │  Google  │ │  Payment │         │
│  │ Network  │ │  Video   │ │  Models  │ │  Maps    │ │ Gateway  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure (Clean Architecture)

```
U_C_H/
├── src/
│   ├── config/                    # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── security.ts
│   │   └── index.ts
│   │
│   ├── middleware/                # Express Middleware
│   │   ├── auth.ts               # JWT Authentication
│   │   ├── rbac.ts               # Role-Based Access Control
│   │   ├── rateLimiter.ts        # Rate Limiting
│   │   ├── validator.ts          # Request Validation
│   │   ├── errorHandler.ts       # Global Error Handler
│   │   └── auditLogger.ts        # Audit Logging
│   │
│   ├── modules/                   # Feature Modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── patient/
│   │   │   ├── patient.controller.ts
│   │   │   ├── patient.service.ts
│   │   │   ├── patient.routes.ts
│   │   │   └── patient.types.ts
│   │   │
│   │   ├── doctor/
│   │   ├── appointment/
│   │   ├── pharmacy/
│   │   ├── emergency/
│   │   ├── telehealth/
│   │   ├── iot/
│   │   └── blockchain/
│   │
│   ├── services/                  # Shared Services
│   │   ├── ai/
│   │   │   ├── chat.service.ts
│   │   │   ├── voice.service.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── payment/
│   │   │   └── pi-payment.service.ts
│   │   │
│   │   └── notification/
│   │       ├── email.service.ts
│   │       └── sms.service.ts
│   │
│   ├── database/                  # Database Layer
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── repositories/
│   │   └── connection.ts
│   │
│   ├── utils/                     # Utilities
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   │
│   └── app.ts                     # Express App Factory
│
├── tests/                         # Test Suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                          # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── COMPLIANCE.md
│   ├── DEPLOYMENT.md
│   ├── INVESTOR_BRIEF.md
│   ├── ROADMAP.md
│   └── SAAS_PRICING.md
│
├── scripts/                       # Utility Scripts
│   ├── migrate.sh
│   ├── deploy.sh
│   └── backup.sh
│
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Technology Stack (Standardized)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | JavaScript runtime |
| **Language** | TypeScript 5.x | Type safety |
| **Framework** | Express.js | REST API |
| **Database** | PostgreSQL 15 | Primary data store |
| **ORM** | Drizzle ORM | Type-safe queries |
| **Cache** | Redis 7 | Sessions, rate limiting |
| **Auth** | JWT + bcrypt | Authentication |
| **Validation** | Zod | Schema validation |
| **Logging** | Winston + Pino | Structured logging |
| **Testing** | Vitest | Unit & integration tests |
| **CI/CD** | GitHub Actions | Automated pipeline |
| **Container** | Docker | Deployment |

## Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Layer 1: Network Security                                        │
│  ├── HTTPS/TLS 1.3                                                │
│  ├── CORS Policy                                                  │
│  └── Rate Limiting (100 req/15min)                               │
│                                                                    │
│  Layer 2: Application Security                                    │
│  ├── Helmet.js Headers                                           │
│  ├── Input Validation (Zod)                                      │
│  ├── SQL Injection Prevention                                    │
│  └── XSS Protection                                               │
│                                                                    │
│  Layer 3: Authentication                                          │
│  ├── JWT Access Tokens (15min expiry)                            │
│  ├── Refresh Tokens (7 days)                                     │
│  ├── bcrypt Password Hashing (cost: 12)                          │
│  └── Multi-factor Auth (optional)                                │
│                                                                    │
│  Layer 4: Authorization                                           │
│  ├── Role-Based Access Control (RBAC)                            │
│  │   ├── Admin (full access)                                     │
│  │   ├── Doctor (patient data)                                   │
│  │   ├── Nurse (limited patient data)                            │
│  │   └── Patient (own data only)                                 │
│  └── Resource-Level Permissions                                  │
│                                                                    │
│  Layer 5: Data Security                                           │
│  ├── AES-256 Encryption at Rest                                  │
│  ├── TLS in Transit                                               │
│  ├── Audit Logging (all access)                                  │
│  └── Data Masking (PHI)                                          │
│                                                                    │
│  Layer 6: Compliance                                              │
│  ├── HIPAA Controls                                               │
│  ├── GDPR Rights Implementation                                  │
│  └── SOC 2 Type II Ready                                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## API Design Standards

### RESTful Endpoints

```
Authentication:
POST   /api/v1/auth/register       # Register new user
POST   /api/v1/auth/login          # Authenticate user
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # Invalidate session
POST   /api/v1/auth/password/reset # Reset password

Patients:
GET    /api/v1/patients            # List patients (RBAC)
GET    /api/v1/patients/:id        # Get patient details
POST   /api/v1/patients            # Create patient
PUT    /api/v1/patients/:id        # Update patient
DELETE /api/v1/patients/:id        # Soft delete patient

Appointments:
GET    /api/v1/appointments        # List appointments
GET    /api/v1/appointments/:id    # Get appointment
POST   /api/v1/appointments        # Book appointment
PUT    /api/v1/appointments/:id    # Reschedule
DELETE /api/v1/appointments/:id    # Cancel appointment

Telehealth:
POST   /api/v1/telehealth/sessions # Start video session
GET    /api/v1/telehealth/sessions/:id # Get session
PUT    /api/v1/telehealth/sessions/:id/end # End session

Health Check:
GET    /api/v1/health              # Service health
GET    /api/v1/health/detailed     # Detailed status
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-27T00:00:00Z",
    "requestId": "abc-123"
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "timestamp": "2026-02-27T00:00:00Z",
    "requestId": "abc-123"
  }
}
```

## Database Schema (Simplified)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CORE ENTITIES                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  users                                                              │
│  ├── id (UUID, PK)                                                 │
│  ├── email (unique)                                                │
│  ├── password_hash                                                 │
│  ├── role (enum: admin, doctor, nurse, patient)                    │
│  ├── status (enum: active, suspended, deleted)                     │
│  ├── created_at                                                    │
│  └── updated_at                                                    │
│                                                                     │
│  patients                                                           │
│  ├── id (UUID, PK)                                                 │
│  ├── user_id (FK -> users)                                         │
│  ├── medical_record_number                                         │
│  ├── date_of_birth                                                 │
│  ├── blood_type                                                    │
│  └── emergency_contact                                             │
│                                                                     │
│  doctors                                                            │
│  ├── id (UUID, PK)                                                 │
│  ├── user_id (FK -> users)                                         │
│  ├── license_number                                                │
│  ├── specialization                                                │
│  └── availability_schedule                                         │
│                                                                     │
│  appointments                                                       │
│  ├── id (UUID, PK)                                                 │
│  ├── patient_id (FK -> patients)                                   │
│  ├── doctor_id (FK -> doctors)                                     │
│  ├── scheduled_at                                                  │
│  ├── status (enum: scheduled, completed, cancelled)                │
│  └── notes                                                         │
│                                                                     │
│  medical_records                                                    │
│  ├── id (UUID, PK)                                                 │
│  ├── patient_id (FK -> patients)                                   │
│  ├── doctor_id (FK -> doctors)                                     │
│  ├── diagnosis                                                     │
│  ├── treatment                                                     │
│  ├── attachments (JSONB)                                           │
│  └── blockchain_hash                                               │
│                                                                     │
│  audit_logs                                                         │
│  ├── id (UUID, PK)                                                 │
│  ├── user_id (FK -> users)                                         │
│  ├── action                                                        │
│  ├── resource_type                                                 │
│  ├── resource_id                                                   │
│  ├── ip_address                                                    │
│  └── created_at                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   CDN       │    │  Load       │    │  WAF        │             │
│  │  (CloudFlare)│───▶│  Balancer   │───▶│  (Security) │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                 │                   │
│                                                 ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Kubernetes Cluster                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │ API Pod │  │ API Pod │  │ API Pod │  │ Worker  │        │   │
│  │  │   x3    │  │         │  │         │  │  Pod    │        │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │   │
│  └───────┼─────────────┼─────────────┼─────────────┼───────────┘   │
│          │             │             │             │               │
│          └─────────────┴─────────────┴─────────────┘               │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Data Layer                              │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│  │  │ PostgreSQL│  │   Redis   │  │    S3     │               │   │
│  │  │ (Primary) │  │  (Cache)  │  │ (Storage) │               │   │
│  │  └───────────┘  └───────────┘  └───────────┘               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Copyright 2025-2026 Elmahrosa International**
