# UnityCare Platform — Sovereign Hospital Management & Telemedicine Monorepo

**Elmahrosa International delivers sovereign healthcare IT operations with HIPAA/GDPR compliance, blockchain-backed audit trails, and deterministic AI safety. UnityCare provides end-to-end hospital management, telemedicine, pharmacy integration, emergency dispatch, and institutional deployment support — positioned as the compliance infrastructure layer for next-generation biomedical AI pipelines.**

Designed to integrate with AI drug discovery ecosystems, UnityCare enables de-identified patient data pipelines and clinical trial management support, ensuring biomedical breakthroughs are delivered safely, reproducibly, and with sovereign trust.

Consolidated from 5 repositories: Unity-Care-Hospital-Sovereign, UCH-Backend, UCH-Buyer-Kit, salma-unity-care-hospital, U_C_H2.

---

## 📦 Monorepo Structure

```
UnityCare-Platform/
├── frontend/          # React SPA (JavaScript + TypeScript)
│   ├── src/
│   │   ├── components/   # UI components (base + shadcn/ui from U_C_H2)
│   │   ├── pages/        # Role-based pages (admin, doctor, patient, pharmacy, emergency)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client services
│   │   ├── context/      # Auth & theme context
│   │   ├── lib/          # Utilities (tRPC, helpers)
│   │   ├── styles/       # Global CSS, theme
│   │   └── _core/        # U_C_H2 core framework
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── backend/           # Express API (Node.js)
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database schemas
│   │   ├── middleware/   # Auth, validation, audit
│   │   ├── config/       # DB, env configuration
│   │   └── utils/        # Logger, helpers
│   ├── pi/               # Pi Network integration (from U_C_H2)
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
├── infra/             # Deployment & institutional kit
│   ├── docs/             # Buyer kit, proposals, NDA templates
│   ├── assets/           # Screenshots, architecture PDFs
│   └── LICENSE
├── docs/              # Consolidated documentation
│   ├── api/              # API specs (OpenAPI, Swagger)
│   ├── technical/        # Architecture, backend system
│   ├── commercial/       # Licensing, acquisition
│   ├── compliance/       # HIPAA, GDPR, audit
│   ├── design/           # Wireframes, UI specs
│   ├── governance/       # Contributing, PR templates
│   └── user/             # User guides
├── database/          # Migrations, seeds, schema
│   ├── migrations/
│   └── seeds/
├── archive/           # Legacy assets from archived repos
│   ├── salma-legacy/     # From salma-unity-care-hospital
│   └── uch2-legacy/      # From U_C_H2
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── vercel.json
├── .env.example
└── .github/workflows/ci.yml
```

---

## 🏗️ Architecture

| Layer | Source Repo | Technology |
|-------|------------|------------|
| Frontend | Unity-Care-Hospital-Sovereign + U_C_H2 | React, TypeScript, shadcn/ui, Tailwind |
| Backend API | UCH-Backend + U_C_H2 | Node.js, Express, JWT |
| Database | Unity-Care-Hospital-Sovereign | MongoDB / PostgreSQL |
| Auth | Unity-Care-Hospital-Sovereign | JWT (access + refresh tokens) |
| Blockchain | U_C_H2 / salma | Web3, Pi Network |
| Infra | UCH-Buyer-Kit | Docker, Vercel |
| CI/CD | Unity-Care-Hospital-Sovereign | GitHub Actions, Jenkins |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Elmahrosa/UnityCare-Platform.git
cd UnityCare-Platform

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Docker

```bash
docker-compose up --build
```

---

## 📡 API Modules

| Module | Endpoints | Source |
|--------|-----------|--------|
| Auth | login, register, refresh, logout | UCH-Backend |
| Patients | CRUD, search, records | UCH-Backend |
| Appointments | create, list, update, cancel | UCH-Backend |
| Telemedicine | sessions, video, chat | UCH-Backend + U_C_H2 |
| Pharmacy | inventory, prescriptions | UCH-Backend + U_C_H2 |
| Emergency | dispatch, triage, alerts | U_C_H2 |
| Blockchain | records, verification | U_C_H2 / salma |
| Analytics | reporting, dashboards | UCH-Backend |
| IoT | monitoring, devices | UCH-Backend |
| Chatbot | AI-assisted queries | salma |

---

## 🔐 Security

- JWT authentication (access + refresh tokens)
- Role-based access control (RBAC)
- Audit logging for HIPAA compliance
- Environment variable protection
- CORS configuration

---

## 📜 Merge History

| Source Repo | Status | Role |
|------------|--------|------|
| Unity-Care-Hospital-Sovereign | Merged | Base frontend + backend + database |
| UCH-Backend | Merged | Primary backend API |
| UCH-Buyer-Kit | Merged | → `/infra` |
| salma-unity-care-hospital | Archived | Extracted → `/archive/salma-legacy` |
| U_C_H2 | Archived | Extracted → frontend TS components + `/archive/uch2-legacy` |

---

## 🏛️ Elmahrosa International

Founder: Ayman Seif
Institutional: https://uch.teosegypt.com
