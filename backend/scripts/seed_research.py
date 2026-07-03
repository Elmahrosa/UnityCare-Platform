#!/usr/bin/env python3
"""Seed research demo data for hackathon demo.

Usage:
    python scripts/seed_research.py
    python scripts/seed_research.py --base-url https://backend.example.com/api/v1
"""

import argparse
import logging
import os
import sys
import time

import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("seed_research")

BASE_URL = os.getenv("UNITYCARE_API_URL", "http://localhost:8000/api/v1")

STUDIES = [
    {
        "name": "SARS-CoV-2 Host Protein Interaction Network (Krogan Lab)",
        "description": "Proteomic mapping of SARS-CoV-2 interacting human proteins to identify therapeutic targets. Data from Krogan Lab, Gladstone Institutes.",
        "irb_status": "approved",
        "irb_approval_date": "2025-11-01T00:00:00Z",
        "irb_expiry_date": "2027-10-31T00:00:00Z",
        "data_classification": "confidential",
        "geographic_scope": "US",
        "principal_investigator": "Dr. Nevan Krogan",
        "institution": "Gladstone Institutes / UCSF",
    },
    {
        "name": "MPRA Regulatory Element Activity (Pollard Lab)",
        "description": "Massively parallel reporter assay data measuring regulatory element activity across human cell types. Data from Pollard Lab, Gladstone Institutes.",
        "irb_status": "approved",
        "irb_approval_date": "2026-01-15T00:00:00Z",
        "irb_expiry_date": "2028-01-14T00:00:00Z",
        "data_classification": "internal",
        "geographic_scope": "US",
        "principal_investigator": "Dr. Katherine Pollard",
        "institution": "Gladstone Institutes / UCSF",
    },
    {
        "name": "Blinded Treatment Response Cohort (Phase II)",
        "description": "Blinded cohort study evaluating treatment response biomarkers. Access restricted to approved researchers only.",
        "irb_status": "approved",
        "irb_approval_date": "2026-03-01T00:00:00Z",
        "irb_expiry_date": "2026-09-01T00:00:00Z",
        "data_classification": "phi",
        "geographic_scope": "US",
        "principal_investigator": "Dr. Jennifer Doudna",
        "institution": "Innovative Genomics Institute",
    },
]

COHORTS = [
    # Krogan Lab cohorts
    {"study_idx": 0, "name": "Full Interactome Dataset", "cohort_type": "open", "allowed_purposes": ["research", "reproduction", "collaboration"], "member_count": 42},
    {"study_idx": 0, "name": "Kinase-Enriched Subset", "cohort_type": "controlled", "allowed_purposes": ["research"], "member_count": 15},
    # Pollard Lab cohorts
    {"study_idx": 1, "name": "All MPRA Libraries", "cohort_type": "open", "allowed_purposes": ["research", "reproduction"], "member_count": 28},
    {"study_idx": 1, "name": "Neural Cell Type Panel", "cohort_type": "controlled", "allowed_purposes": ["research", "collaboration"], "member_count": 12},
    # Blinded cohort
    {"study_idx": 2, "name": "Treatment Group A", "cohort_type": "blinded", "allowed_purposes": ["research"], "member_count": 60},
    {"study_idx": 2, "name": "Treatment Group B", "cohort_type": "blinded", "allowed_purposes": ["research"], "member_count": 60},
]


def login(client: httpx.Client, email: str, password: str) -> str | None:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("access_token", "")
    log.warning("  ↳ Login failed for %s: %s", email, resp.status_code)
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=BASE_URL)
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    log.info("Seeding research demo data at %s", base)

    client = httpx.Client(base_url=base, timeout=30, headers={"User-Agent": "UnityCare-Seed/1.0"})

    # Login as admin
    token = login(client, "admin@unitycare.demo", "Demo@2026Admin")
    if not token:
        log.error("Cannot login as admin. Ensure main seed has been run.")
        sys.exit(1)

    auth_headers = {"Authorization": f"Bearer {token}"}

    study_ids = []
    for s in STUDIES:
        resp = client.post("/research/studies", json=s, headers=auth_headers)
        if resp.status_code == 201:
            sid = resp.json()["id"]
            study_ids.append(sid)
            log.info("  ✓ Created study: %s (%s)", s["name"][:60], sid[:8])
        elif resp.status_code == 409:
            log.warning("  ↳ Study already exists: %s", s["name"][:60])
            study_ids.append(None)
        else:
            log.error("  ✗ Failed to create study: %s %s", resp.status_code, resp.text)
            study_ids.append(None)

    # Create cohorts
    for c in COHORTS:
        sid = study_ids[c["study_idx"]]
        if not sid:
            continue
        data = {
            "study_id": sid,
            "name": c["name"],
            "cohort_type": c["cohort_type"],
            "allowed_purposes": c["allowed_purposes"],
            "member_count": c["member_count"],
        }
        resp = client.post("/research/cohorts", json=data, headers=auth_headers)
        if resp.status_code == 201:
            log.info("  ✓ Created cohort: %s", c["name"])
        else:
            log.warning("  ↳ Cohort: %s", resp.text)

    # Test access request as doctor
    doc_token = login(client, "doctor.ahmed@unitycare.demo", "Demo@2026Doc")
    if doc_token and study_ids[0]:
        data = {"study_id": study_ids[0], "cohort_id": None, "purpose": "research"}
        resp = client.post("/research/access", json=data, headers={"Authorization": f"Bearer {doc_token}"})
        if resp.status_code == 200:
            r = resp.json()
            log.info("  ✓ Access request: %s — %s", r["verdict"], r["explanation"][:100])
        else:
            log.warning("  ↳ Access: %s", resp.text)
    else:
        log.warning("  ↳ Skipping access request — doctor not logged in")

    # Test failed access: expired IRB study
    if doc_token and study_ids[2]:
        data = {"study_id": study_ids[2], "cohort_id": None, "purpose": "research"}
        resp = client.post("/research/access", json=data, headers={"Authorization": f"Bearer {doc_token}"})
        if resp.status_code == 200:
            r = resp.json()
            log.info("  ✓ Denied access test: %s — %s", r["verdict"], r["explanation"][:100])
        else:
            log.warning("  ↳ Denied access: %s", resp.text)

    log.info("Done. Research demo data seeded.")


if __name__ == "__main__":
    main()
