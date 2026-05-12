
# 🛡️ UCH Sovereign Core

Private sovereign healthcare infrastructure backend.
## 🎯 Live Demo
👉 [Open Dashboard Demo](https://elmahrosa.github.io/uch-sovereign-core/demo/index.html)
---

## Overview

UCH Sovereign Core is the private backend system powering the Unity Care Sovereign platform.

It is designed for institutional deployment environments requiring:

- data sovereignty  
- controlled access  
- compliance-aligned architecture  
- on-premise or private-cloud deployment  

This repository is **not a public demo**.  
Access is restricted to qualified institutional reviewers.

---

## Repository Structure

```text
backend/      Core API, access control, audit logging
deployment/   Docker and infrastructure configuration
buyer-kit/    Institutional documentation (restricted)
docs/         Architecture and compliance materials
````

---

## Core Capabilities

* Access request intake (institutional review workflow)
* NDA + deposit-based access model
* Tamper-resistant audit logging (in progress)
* Secure API baseline (rate limiting, validation, headers)

---

## Access Model

Private repository access requires:

1. Institutional verification
2. Signed NDA
3. US$5,000 diligence deposit

Deposit terms:

* credited toward final invoice if buyer proceeds
* non-refundable once access is granted
* access includes repository, documentation, and technical review materials

---

## Development (Local)

```bash
cd backend
npm install
npm run dev
```

Health check:

```text
GET /health
```

---

## Status

Current phase:

> Core system bootstrap + compliance foundation

Not production-certified.
Not handling real patient data.

---

## Legal

This repository is part of a controlled-access system.

Unauthorized use, redistribution, or deployment is prohibited.

---

## Stewardship

Elmahrosa International
Founder: Ayman Seif

Contact: [ayman@teosegypt.com](mailto:ayman@teosegypt.com)

````
