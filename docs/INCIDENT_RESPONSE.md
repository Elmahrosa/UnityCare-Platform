# UnityCare Incident Response Plan

> **Platform:** UnityCare Sovereign Healthcare Infrastructure  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-20  
> **Owner:** Security Operations — Elmahrosa International

---

## 1. Incident Classification

| Severity | Level | Examples |
|---|---|---|
| **Critical** | P0 | Mass PHI exfiltration via API, audit chain tampering detected, ransomware on production database, consent records bulk-modified |
| **High** | P1 | Unauthorized access to a patient cohort (10+ records), credential stuffing breach, FHIR API data corruption, prolonged service outage (>30 min) |
| **Medium** | P2 | Single patient record accessed without authorization, rate-limit bypass attempt, failed login spike from single IP, expired TLS certificate |
| **Low** | P3 | Misconfigured security header, stale consent version detected, phishing report with no compromise, minor audit log gap |

---

## 2. Incident Response Team

| Role | Responsibility | Primary | Alternate |
|---|---|---|---|
| **Security Lead** | Directs technical response, forensics, chain verification | DevOps/Security engineer (on-call) | CISO |
| **Technical Lead** | Backend/Frontend remediation, Railway/on-prem infrastructure | Senior backend engineer | Senior frontend engineer |
| **Communications Lead** | Internal status updates, regulatory notifications, public statements | CTO | CEO |
| **Legal/Compliance** | HIPAA/GDPR/PDPL breach notification, law enforcement liaison | Legal counsel (retained) | Compliance officer |

**Contact Tree:** Security Lead (first) → Technical Lead + Legal/Compliance (parallel) → Communications Lead (within 1 hour of classification).

---

## 3. Detection

Incidents are surfaced through:

- **Health check alerts** — Railway/on-prem uptime monitors; PostgreSQL connection pool exhaustion; `/health` endpoint 5xx spikes.
- **Rate-limit threshold events** — `RateLimitMiddleware` exceeding 100 req/min per IP on auth routes triggers a `user.rate_limit_exceeded` audit event.
- **Audit log anomalies** — `AuditService` chain verification (`GET /audit/verify`) flags hash mismatch; bulk `DELETE` or `UPDATE` on consent/medical records outside normal patterns.
- **Failed login spikes** — >5 failed attempts per user within 5 minutes (account lockout) or >50 failed attempts across accounts from one IP in 10 minutes.
- **User reports** — Patients reporting unexplained PHI access, consent changes they did not authorize, or appointment modifications.
- **Consent version drift** — `ConsentVersion` records where `signed_at` timestamp is inconsistent with `created_at` on parent consent.

---

## 4. Triage

Initial assessment checklist (responder answers each):

1. Is PHI confirmed exposed or reasonably suspected? (Y/N)
2. Is the audit chain integrity verified or compromised? (Y/N)
3. Are consent records affected — modified, revoked, or created without patient action? (Y/N)
4. Is the service degraded or unavailable for patients/providers? (Y/N)
5. Is there evidence of ongoing access by an unauthorized actor? (Y/N)
6. Can the attack vector be identified (API token leak, SQL injection, XSS, credential stuffing)? (Y/N)
7. Has the incident crossed jurisdiction boundaries (EU patient data on US server, etc.)? (Y/N)
8. Are backups confirmed intact and recent (within RPO)? (Y/N)
9. Have credentials (JWT signing key, database passwords, API tokens) been rotated in the last 90 days? (Y/N)
10. Is law enforcement or a regulatory body already involved? (Y/N)

**Severity assignment:** Critical if Q1+Q2 both Y, or Q3 Y, or Q5 Y. High if Q1 Y or Q4 Y. Medium if Q6 Y or Q7 Y. Low otherwise.

---

## 5. Containment

### Data Breach (PHI exposed)
1. Revoke all JWT tokens (`refresh_token.revoked = True`) — forces re-authentication.
2. Isolate affected database — take the PostgreSQL instance off the load balancer; fail over to read-replica if available.
3. Snapshot current state — `pg_dump` of `consent`, `medical_records`, `patients`, `audit_events` tables for forensic analysis.
4. Block originating IPs in Railway firewall or on-prem iptables.
5. Engage `AuditService.verify_chain()` — identify exactly which audit events are compromised.

### Service Outage
1. Fail over to secondary Railway service or on-prem standby.
2. Scale up PostgreSQL connection pool (`max_connections`, `pgbouncer`).
3. If frontend is down, serve static maintenance page from CDN.
4. Restore from last known-good deployment artifact (Docker image or Railway snapshot).

### Account Compromise
1. Revoke all sessions for affected user(s) — clear JWT + refresh token records.
2. Force password reset on next login (set `user.force_password_reset = True`).
3. Audit all actions performed by the compromised account via `AuditEvent` filtered by `actor_id`.
4. Check `consent` records modified by the actor — revert any unauthorized consent changes.

### Audit Chain Tampering
1. Run `GET /audit/verify` — identify first broken link (block hash mismatch).
2. Rebuild chain from the last known-valid hash using `ConsentVersion.signed_at` and `AuditEvent.previous_hash` from unaffected replicas.
3. Lock all audit endpoints — only allow reads until chain integrity is restored.
4. Determine root cause: direct DB access, bypassed middleware, or SQL injection.

---

## 6. Eradication

1. **Remove threat** — Rotate all secrets: JWT `SECRET_KEY`, `ENCRYPTION_KEY`, database passwords, Railway API tokens. Patch the exploited vulnerability (SQL parameterization, input sanitization, rate-limit tightening).
2. **Patch vulnerability** — Deploy hotfix through CI/CD with mandatory review. If on-prem, apply via Ansible playbook or manual deploy.
3. **Rotate credentials** — Regenerate all service-to-service API keys, database users (`ALTER USER ... WITH PASSWORD`), and OIDC client secrets.
4. **Verify no persistence** — Scan Railway service logs and on-prem `/var/log` for reverse shell, cron job, or unauthorized SSH key additions.
5. **Re-run audit chain verify** — Confirm `AuditService.verify_chain()` returns `{"status": "valid", "blocks": <count>}`.

---

## 7. Recovery

1. **Restore from backup** — Restore `patients`, `medical_records`, `consent`, and `audit_events` tables from pre-incident backup (point-in-time recovery via PostgreSQL WAL archives).
2. **Verify audit chain integrity** — Run `AuditService.verify_chain()` on restored data. Confirm `previous_hash` linkage from genesis block forward.
3. **Validate consent records** — For each `Consent` modified during incident window, cross-reference `ConsentVersion` signatures. Email affected patients with a summary of changes.
4. **Re-enable services** — Bring restored PostgreSQL into load balancer; scale up backend replicas; confirm `/health` returns 200.
5. **Monitor** — Watch rate-limit counters, failed-login rates, and audit chain verify endpoint for 72 hours post-recovery.

---

## 8. Post-Mortem

1. **Timeline creation** — Merge Slack/Teams timestamps, Railway deploy logs, and `AuditEvent` records into a canonical incident timeline. Include: detection, triage, containment, eradication, recovery milestones.
2. **Root cause analysis** — Document the exact chain of events. Use 5 Whys technique. Determine whether the gap was in code (e.g. missing input validation), config (e.g. permissive CORS), or process (e.g. stale secrets).
3. **Preventive measures** — Assign action items with owners and due dates. Common outcomes: add rate-limit rule, expand audit coverage, tighten RBAC scope, update WAF rules, schedule secret rotation.
4. **Report** — Publish internally (exclude specific PHI) within 14 days. Store in `docs/post-mortem/YYYY-MM-DD-<incident-id>.md`.

---

## 9. Communication

### Notification Matrix

| Audience | Trigger | Channel | Timing | Owner |
|---|---|---|---|---|
| Internal team | All incidents | Slack #security-alerts | Immediate | Security Lead |
| Regulatory (HIPAA) | Breach of unsecured PHI | Email + HHS portal | ≤60 days | Legal/Compliance |
| Regulatory (GDPR) | Personal data breach | DPA notification + affected individuals | ≤72 hours | Legal/Compliance |
| Regulatory (Saudi PDPL) | Personal data breach | Saudi DPA (SDAIA) | ≤72 hours | Legal/Compliance |
| Regulatory (Egypt Law 151) | Personal data breach | Egypt DPA | ≤7 days | Legal/Compliance |
| Affected patients | PHI exposure | Email + platform notification | Upon confirmation | Communications Lead |
| Public / media | Critical P0 breach | Press release + security notice on website | After patient notification | CEO / Communications Lead |

### Notification Template (Patient)

```
Subject: Security Incident Notification — UnityCare Platform

Dear [Patient Name],

UnityCare has identified a security incident that may have affected your
health information. We are writing to inform you of what happened, what
information was involved, and what we are doing in response.

What happened: [brief description]
Information involved: [types of PHI — e.g., name, date of birth,
  diagnosis codes, consent status]
What we are doing: [remedial actions — terminated access, rotated
  credentials, enhanced monitoring]
Steps you should take: [e.g., monitor statements, contact support]

For questions, contact our privacy team at [email] or [phone].

Regards,
UnityCare Security Team
```

---

## 10. Healthcare-Specific Considerations

| Regulation | Breach Definition | Notification Deadline | Penalty for Non-Compliance |
|---|---|---|---|
| **HIPAA** (US) | Unsecured PHI accessed/acquried | ≤60 days from discovery | $100–$50,000 per violation, up to $1.5M/year |
| **GDPR** (EU) | Personal data breach | ≤72 hours to DPA | Up to €20M or 4% of global revenue |
| **Egypt Law 151** (2020) | Personal data breach (health data is sensitive) | ≤7 days to Egypt DPA | EGP 1M–5M fine, potential criminal liability |
| **Saudi PDPL** (2021) | Personal data breach (health is sensitive) | ≤72 hours to SDAIA | Up to SAR 5M + imprisonment |
| **EHDS** (EU, proposed) | Electronic health data breach | ≤72 hours + patient notification | TBD (aligns with GDPR framework) |

**UnityCare-specific safeguards activated during breach response:**
- `GET /audit/verify` provides a cryptographic proof of which records were accessed — defensible in regulatory investigations.
- `ConsentVersion` table captures every consent state change — enables precise determination of which consent records were affected.
- JWT revocation forces immediate re-authentication; combined with `AuditEvent` data, scope of exposure can be proven.
- Rate-limit thresholds on auth routes (`RateLimitMiddleware`) can be temporarily lowered during active incident to slow attackers.

---

## 11. Testing

| Exercise Type | Frequency | Participants | Scenario Examples |
|---|---|---|---|
| **Tabletop (basic)** | Quarterly | Security Lead + Technical Lead | Phishing report from patient, single-record unauthorized access |
| **Tabletop (full)** | Bi-annually | Full IRT (all roles) | Mass PHI exfiltration via compromised API token, audit chain integrity failure |
| **Live drill (simulated)** | Annually | Full IRT + on-call rotation | Ransomware on PostgreSQL, Railway account takeover, consent mass-modification attack |
| **Post-mortem review** | After each real incident | Full IRT + relevant developers | Document timeline, root cause, action items |

Drills use a sandboxed Railway environment (staging) with anonymized patient data. No real PHI is used in exercises. After each drill, a written report is filed to `docs/post-mortem/drill-YYYY-MM-DD.md`.

---

*This plan is reviewed and updated quarterly by the Security Operations team. Next review: 2026-09-20.*
