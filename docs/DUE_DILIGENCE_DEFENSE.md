# 🧾 Due Diligence Defense Document (UCH)
**Confidential — Institutional Review Version**  
**Project:** Unity Care Hospital (UCH)  
**Positioning:** Institutional telehealth infrastructure (deployable, white-label, ownership-ready)

---

## 1) Executive Positioning (What this is)
UCH is **not** positioned as a consumer telehealth SaaS.  
It is positioned as **digital healthcare infrastructure** designed for:

- Private hospital groups seeking operational control
- Digital health operators that need deployable infrastructure
- Sovereign programs requiring jurisdictional and governance alignment

**Primary differentiator:** institutions can license, own, or deploy sovereign-ready stacks (not perpetual SaaS lock-in).

---

## 2) Scope Clarity (MVP vs Roadmap)
### MVP scope (deployable today)
- Teleconsultation workflows
- WebRTC video consultations
- Role-based access control (RBAC)
- Secure patient record storage (encrypted + audit trail)
- Administrative dashboard

### Roadmap modules (institution-led rollout)
- Insurance integration layer
- Blockchain notarization (integrity proofs; not “records on-chain”)
- IoT vitals ingestion endpoints
- AI triage assistant (policy-controlled)

**Diligence note:** We avoid overstating “live” functionality. MVP and roadmap are explicitly separated.

---

## 3) Technical Architecture (High-level)
- Backend: Node.js services
- Database: PostgreSQL (core), optional document store where needed
- API layer: GraphQL (where applicable) + REST endpoints for operational functions
- Video: WebRTC
- Deployment: containerized; cloud-native; horizontally scalable

---

## 4) Security & Compliance Posture (Honest)
**Compliance posture:** HIPAA-aligned architecture; SOC 2 principles applied.  
**Status:** audit-ready design; **formal certification audits scheduled post-seed funding**.

Security controls:
- TLS everywhere
- RBAC enforcement
- Audit logging
- Environment variable handling for secrets
- Deployment isolation strategy per institution

---

## 5) Data Governance
- Institution retains data ownership inside its deployment
- No centralized extraction as a default posture
- Operational logs retained per agreed policy and contract

---

## 6) Commercial Model (Institutional)
UCH supports procurement-friendly options:

- **Pilot (paid):** $40K–$60K, credited toward license/ownership on conversion  
- **License:** $75K+  
- **Ownership Transfer:** $250K+  
- **Sovereign Stack:** $350K+

Typical maintenance/upgrade contracts: **15–20% of license value** (scope dependent).

---

## 7) Execution Roadmap (Disciplined)
Phase 1 — Hardening + evidence pack (security, deployment docs, tests)  
Phase 2 — Pilot deployment with institution  
Phase 3 — Formal audit engagement (HIPAA/SOC2 evidence alignment)  
Phase 4 — Integration layers (insurance, IoT, notarization)  
Phase 5 — Scale through reference deployments

---

## 8) Risk Register (Acknowledged)
- Distribution risk: institutional sales cycles are long
- Regulatory risk: payments vary by jurisdiction (crypto optional; fiat fallback)
- Execution risk: audits require time + budget

Mitigation:
- Paid pilot structure to convert faster
- Scope discipline (MVP first)
- Audit evidence pack built early (pre-audit readiness)

---

## 9) What “Success” Means
- A signed pilot + successful KPI evaluation
- Conversion into a full institutional tier (license/ownership)
- A reference deployment for expansion

---

## 10) Attachments
See:
- `INSTITUTIONAL_PROPOSAL_TEMPLATE.md`
- `DUE_DILIGENCE_QA.md`
- `CASHFLOW_12M.md`
- `SENSITIVITY_ANALYSIS.md`
- `PIPELINE_BLUEPRINT.md`
