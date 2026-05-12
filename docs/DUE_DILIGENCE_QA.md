# 🧾 Due Diligence Q&A (UCH)
**Confidential — Investor / CTO / Compliance Review**  
**Positioning:** Institutional telehealth infrastructure (deployable, white-label, ownership-ready)

---

## A) Product & Architecture
### 1) What is UCH?
UCH is a modular telehealth platform designed for institutional deployments where buyers require control, white-label capability, and optional ownership transfer.

### 2) What is live today vs roadmap?
**Live (MVP):** teleconsultation, WebRTC video, RBAC, secure records storage, admin dashboard.  
**Roadmap:** insurance layer, notarization integrity proofs, IoT vitals endpoints, AI triage.

### 3) What stack do you use?
Backend services in Node.js, PostgreSQL for core data, WebRTC for video. Deployment is containerized and cloud-native.

### 4) How do you scale?
Horizontally: stateless services, scalable DB patterns, caching where needed, and deployment isolation per institution.

### 5) How do you isolate institutions?
Each institution receives a dedicated instance/environment. Data remains within that deployment boundary unless contractually agreed otherwise.

---

## B) Security & Compliance
### 6) Are you HIPAA certified?
No. We implement HIPAA-aligned architecture. Formal certification audit is scheduled post-seed funding. We do not claim certification prematurely.

### 7) Are you SOC 2 certified?
Not yet. SOC 2 principles are applied; evidence pack and audit engagement are planned post-seed.

### 8) How do you protect PHI?
Encryption in transit, access control (RBAC), audit logs, least-privilege policy, and environment-separated deployments.

### 9) Where are secrets stored?
Environment variables / secret managers. No secrets committed to repo.

### 10) What logging exists?
Operational logs + audit trails for access. Retention policies are contract-defined.

### 11) What is your incident response posture?
Predefined triage + containment workflow; institutional escalation path; post-incident reporting pack.

---

## C) Data Governance
### 12) Who owns the data?
The institution owns its data. UCH provides software and operational tooling under contract.

### 13) Do you centralize data?
No by default. Centralization is optional and requires explicit contractual approval.

---

## D) Commercial & Procurement
### 14) Why not Teladoc / Amwell?
We are not competing on consumer volume. We compete on institutional control: deployment ownership, white-label operations, and sovereign-ready posture.

### 15) What are your pricing tiers?
Pilot $40K–$60K. License $75K+. Ownership Transfer $250K+. Sovereign Stack $350K+.

### 16) What is recurring revenue?
Maintenance and upgrades typically 15–20% of license value, scope dependent.

### 17) What is your standard pilot structure?
3–6 months, paid, limited scope, KPI-defined, conversion credit to final tier.

### 18) How do you handle procurement requirements?
Board-ready proposal template, scope definition, KPI success metrics, data governance terms, and deployment documentation.

---

## E) Execution & Roadmap
### 19) What are your top milestones post-seed?
Hardening + audit evidence pack, first institutional pilot, conversion to license/ownership, audit engagement.

### 20) How do you ensure disciplined execution?
Controlled scope, milestone-based release, KPI-defined pilots, no inflated claims.

---

## F) Financial Discipline
### 21) What is your seed ask?
$150K–$300K (example model uses $250K) tied to hardening + audit readiness + sales pipeline.

### 22) What is the biggest survival driver?
Closing at least one ownership-tier deal in Year 1, supported by a conversion-designed pilot.

### 23) What if deals slip?
We model 3-month and 6-month delays in `SENSITIVITY_ANALYSIS.md`, including the point of runway compression and mitigation.

---

## G) Risk & Mitigation
### 24) What are key risks?
Institutional sales cycles, regulatory variance for payments, audit execution.

### 25) How do you mitigate distribution risk?
Targeted pipeline strategy, paid pilots, reference deployments, and procurement-friendly packaging.

### 26) How do you mitigate regulatory risk?
Crypto settlement is optional; fiat fallback available; compliance posture is jurisdiction-specific.

---

## H) Ownership & IP
### 27) What does “Ownership Transfer” mean?
A commercial structure where the institution obtains full control rights as contractually defined (deployment assets + operational authority). Exact terms are in the proposal template.

### 28) Is this open source?
Repository is used for diligence review; licensing terms are defined in commercial agreements. See `COMMERCIAL_LICENSE_TEMPLATE.md` if present.
