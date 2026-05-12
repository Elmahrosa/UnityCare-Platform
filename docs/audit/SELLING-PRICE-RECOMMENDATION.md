# Unity Care Hospital Sovereign — pricing recommendation

## My direct verdict

As of 26 March 2026, this repo is **not ready** for a $250K–$350K ownership-transfer ask in its current public state.

The live repository still shows:
- a PostgreSQL badge in the README while the backend package describes MongoDB,
- a merge-conflicted `docker-compose.yml`,
- an almost-empty `backend/src/app.js`,
- an incomplete `backend/src/server.js`,
- an almost-empty `backend/src/routes/auth.js`,
- an almost-empty `backend/src/routes/health.js`.

That means a buyer can discover obvious execution risk in minutes, before they ever review your institutional narrative.

## Recommended sell-side ranges

### 1) Current-state asset sale (repo + docs + branding, no full hardening)
**Ask:** $18,000 – $45,000

Use this only if you sell it honestly as:
- sovereign healthcare concept + architecture
- early infrastructure scaffold
- branding, docs, and pilot base
- not a production-ready hospital platform

### 2) Patched technical sale (after the bundle in this folder is applied and verified)
**Ask:** $45,000 – $90,000

This assumes:
- backend boots cleanly,
- auth flow works,
- Docker Compose works,
- README claims are corrected,
- there is no obvious runtime breakage in the first 10 minutes of diligence.

### 3) Buyer-ready strategic transfer
**Ask:** $120,000 – $220,000

This requires:
- one real backend only,
- no ghost modules,
- clear MongoDB-only architecture,
- audit logs expanded,
- appointment / patient / RBAC / medical record flows fully tested,
- HTTPS deployment on the public domain,
- no inflated claims in README or diligence docs.

## Why this range is more defensible

Public market and private-market software multiples in 2025–2026 remain much more disciplined than the 2021 peak, with private B2B SaaS often discussed in roughly the mid-single-digit revenue-multiple range rather than automatic “story premiums.” That matters because a pre-revenue or pre-deployable asset is usually valued more like replacement cost + strategic fit than like a scaled SaaS company.

For healthcare software specifically, third-party pricing guides still place enterprise hospital / EHR builds in high five-figure to six-figure implementation ranges and often much higher once compliance, integration, and deployment are real. Your repo can eventually justify a strong strategic price — but only after the code matches the positioning.

## How to pitch it right

Do not pitch this as:
- HIPAA-ready production system
- PostgreSQL + GraphQL system
- DID / VC implementation complete
- institutional deployment ready today

Pitch it as:
- sovereign healthcare infrastructure base
- self-hosted Node/Express/Mongo architecture
- security-hardened foundation in progress
- buyer can acquire code, domain alignment, design language, and institutional package

## Best commercial path

1. Apply this patch bundle.
2. Fix the README claims to match the code.
3. Record a 3-minute boot demo:
   - `docker compose up --build`
   - `GET /health`
   - register
   - login
   - refresh
   - logout
4. Then offer:
   - **license** first,
   - **deployment package** second,
   - **full ownership transfer** only after diligence.
