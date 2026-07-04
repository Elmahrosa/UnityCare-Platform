# UnityCare Platform — Research Compliance Infrastructure

Deterministic policy evaluation with Claude-generated audit narratives for regulated biomedical data.

Built on a production-hardened healthcare platform: SHA-256 audit chains, FHIR R4, RBAC, MFA, consent management — extended for multi-site study governance and IRB-compliant data sharing.

- **Live:** [health.elmahrosa.org](https://health.elmahrosa.org)
- **API:** [api.elmahrosa.org](https://api.elmahrosa.org)
- **Dev Portal:** [developers.elmahrosa.org](https://developers.elmahrosa.org)
**Source:** [github.com/Elmahrosa/UnityCare-Platform](https://github.com/Elmahrosa/UnityCare-Platform)

---

## Problem

When life sciences institutions like Gladstone Institutes share datasets (e.g., Krogan Lab SARS-CoV-2 PPI networks, Pollard Lab MPRA data) with collaborators, there is **no audit trail** for who accessed what, for what purpose, and whether that access was IRB-compliant. An IRB audit today cannot answer "who downloaded the SARS-CoV-2 interactome and why?"

## Solution

UnityCare adds a **Claude-powered compliance layer** on top of a production-hardened platform. Every data access request evaluates **7 policy dimensions** simultaneously:

| Dimension | Description |
|-----------|-------------|
| IRB Status | Approval current and not expired |
| Study Active | Study enrollment not closed |
| Role Authorization | Requester has appropriate role |
| Cohort Scope | Access respects cohort blinding/control |
| Purpose Alignment | Requested use matches allowed purposes |
| Geographic Scope | Data transfer complies with jurisdiction |
| Data Classification | Sensitivity level permits access |

Claude transforms the deterministic verdict into an **IRB-ready audit narrative** — human-readable explanations that compliance officers can actually use.

---

## Demo

A researcher requests access to the Krogan Lab SARS-CoV-2 PPI interactome:

```
Study:      GLAD-2026-001 — SARS-CoV-2 Host Protein Interaction Network
Request:    Download full interactome dataset
Purpose:    Research
Decision:   ✅ Approved

Claude Narrative:
"Access GRANTED for Dr. Ahmed Al-Qahtani to study 'SARS-CoV-2 Host Protein 
Interaction Network' for purpose 'research'. All 7 compliance dimensions 
satisfied: IRB approved (expires 2027-10-31), study active, role authorized 
(Provider), cohort accessible (open), purpose aligned with cohort configuration, 
geographic scope compatible (US), data classification appropriate (confidential)."
```

Try it: `POST /api/v1/research/access`

---

## Built with Claude

UnityCare uses **Claude Code** (Anthropic) for:

- Backend API architecture and implementation
- Security middleware and audit chain design
- Policy reasoning engine logic
- Test generation (54+ tests across 8 modules)
- Documentation generation

**Claude Science** is used for:

- Research compliance explanation generation
- Natural-language audit trail narratives
- IRB-ready compliance reports

### AI Responsibility

UnityCare uses **deterministic policy evaluation** for all compliance and access control decisions. Claude generates **audit-ready explanations and summaries** from those deterministic outputs. **Claude does not make compliance or regulatory decisions.** Every access verdict is rule-based, reproducible, and independently verifiable.

---

## Platform Status

| Dimension | Status |
|---|---|
| **Production deployment** | ✅ Live on Railway |
| **Backend tests** | 54+ across 8 modules |
| **Frontend tests** | 15 across 5 suites |
| **MFA enforcement** | TOTP on admin and provider roles |
| **CI/CD** | GitHub Actions + Railway auto-deploy |
| **Security headers** | 9 headers (HSTS, CSP, XFO, etc.) |
| **Rate limiting** | Redis-backed with in-memory fallback |
| **Horizontal access control** | Patient-scoped on 8 endpoints |
| **Audit chain** | SHA-256 hash-linked, tamper-evident |
| **Research compliance API** | ✅ Studies, cohorts, access evaluation |
| **Consent management** | Versioned, jurisdiction-aware, purpose-scoped |
| **FHIR R4** | Patient resource CRUD with search |
| **ICD-10-CM** | Lookup table with search API |

---

## Production Architecture

```
                        ┌──────────────────────────┐
                        │   health.elmahrosa.org    │
                        │   Next.js (Frontend)      │
                        │   Railway Service         │
                        └─────────┬────────────────┘
                                  │ HTTPS
                                  ▼
                        ┌──────────────────────────┐
                        │   api.elmahrosa.org      │
                        │   FastAPI (Backend)       │
                        │   Railway Service         │
                        └─────────┬────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │   PostgreSQL     │         │   Redis (opt.)   │
          │   Railway Plugin │         │   Rate Limit     │
          └─────────────────┘         └─────────────────┘

                        ┌──────────────────────────┐
                        │ developers.elmahrosa.org  │
                        │   Developer Portal        │
                        │   Railway Service         │
                        └──────────────────────────┘
```

- **Deterministic verdicts.** Policy evaluation is rule-based — same inputs always produce the same verdict.
- **SHA-256 chained audit trails.** Events linked via `previous_hash → event_hash` chain. Chain integrity verifiable via `GET /api/v1/audit/verify`.
- **Fail-closed design.** No default-permit path. Missing consent, expired token, or missing role produces 403/401.
- **Layered enforcement:** Security headers → rate limiting → JWT → RBAC → horizontal access control → consent → compliance evaluation.

---

## Roadmap

**Completed:** Compliance Engine, SHA-256 Audit Chain, Claude Audit Narratives, FHIR R4, RBAC + MFA, ICD-10-CM, Horizontal Access Control, Rate Limiting

**In Progress:** Backend Unit Tests (admin + research modules)

**Planned:** Institution Deployments, External Integrations, Production Research Workflows, Multi-Institution Collaboration

---

## Quick Start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install && npm run dev
```

### Seed demo data

```bash
python backend/scripts/seed.py              # users + patients + consents
python backend/scripts/seed_research.py     # Gladstone studies + cohorts
```

---

## Links

- **Frontend:** [health.elmahrosa.org](https://health.elmahrosa.org)
- **API:** [api.elmahrosa.org](https://api.elmahrosa.org)
- **API Docs:** [api.elmahrosa.org/docs](https://api.elmahrosa.org/docs)
- **Developer Portal:** [developers.elmahrosa.org](https://developers.elmahrosa.org)
- **Health Check:** [api.elmahrosa.org/health](https://api.elmahrosa.org/health)
- **Source:** [github.com/Elmahrosa/UnityCare-Platform](https://github.com/Elmahrosa/UnityCare-Platform)

---

*Built by Elmahrosa International — participating in Anthropic's Claude Partner Network.*
