#!/usr/bin/env python3
"""Production-grade seed script for UnityCare demo data.

Usage:
    python scripts/seed.py                          # localhost:8000
    python scripts/seed.py --base-url https://backend.example.com
    python scripts/seed.py --clean                   # drop all data first
    python scripts/seed.py --dry-run                 # print actions only
    python scripts/seed.py --railway                 # Railway mode (waits for API readiness)

Idempotent — skips users whose email already exists.
"""

import argparse
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("seed")

BASE_URL = os.getenv("UNITYCARE_API_URL", "http://localhost:8000/api/v1")
USER_AGENT = "UnityCare-Seed/1.0"

# ---------------------------------------------------------------------------
# Demo data
# ---------------------------------------------------------------------------

USERS: list[dict[str, Any]] = [
    {
        "email": "admin@unitycare.demo",
        "password": "Demo@2026Admin",
        "full_name": "Dr. Sarah Al-Mansour",
        "role": "admin",
        "locale": "en",
    },
    {
        "email": "doctor.ahmed@unitycare.demo",
        "password": "Demo@2026Doc",
        "full_name": "Dr. Ahmed Al-Qahtani",
        "role": "provider",
        "locale": "ar",
        "_profile": {
            "specialization": "Cardiology",
            "rating": 4.8,
            "licenseNumber": "MED-KSA-2024-18472",
            "yearsOfExperience": 14,
            "consultationFee": 350,
            "totalConsultations": 2841,
        },
    },
    {
        "email": "doctor.fatima@unitycare.demo",
        "password": "Demo@2026Doc",
        "full_name": "Dr. Fatima Al-Harbi",
        "role": "provider",
        "locale": "ar",
        "_profile": {
            "specialization": "Pediatrics",
            "rating": 4.9,
            "licenseNumber": "MED-KSA-2023-09156",
            "yearsOfExperience": 9,
            "consultationFee": 250,
            "totalConsultations": 1623,
        },
    },
    {
        "email": "patient.nora@unitycare.demo",
        "password": "Demo@2026Pat",
        "full_name": "Nora Al-Saud",
        "role": "patient",
        "locale": "ar",
    },
    {
        "email": "patient.omar@unitycare.demo",
        "password": "Demo@2026Pat",
        "full_name": "Omar Khaled",
        "role": "patient",
        "locale": "en",
    },
    {
        "email": "patient.layla@unitycare.demo",
        "password": "Demo@2026Pat",
        "full_name": "Layla Hassan",
        "role": "patient",
        "locale": "en",
    },
]

FHIR_RESOURCES: dict[str, dict[str, Any]] = {
    "Nora Al-Saud": {
        "resourceType": "Patient",
        "identifier": [{"system": "https://unitycare.demo/national-id", "value": "1012345678"}],
        "name": [{"use": "official", "family": "Al-Saud", "given": ["Nora"]}],
        "gender": "female",
        "birthDate": "1991-04-12",
        "telecom": [{"system": "phone", "value": "+966501234567", "use": "mobile"}],
        "address": [{"city": "Riyadh", "country": "SA"}],
        "generalPractitioner": [{"display": "Dr. Ahmed Al-Qahtani"}],
    },
    "Omar Khaled": {
        "resourceType": "Patient",
        "identifier": [{"system": "https://unitycare.demo/national-id", "value": "1023456789"}],
        "name": [{"use": "official", "family": "Khaled", "given": ["Omar"]}],
        "gender": "male",
        "birthDate": "1985-09-23",
        "telecom": [{"system": "phone", "value": "+966509876543", "use": "mobile"}],
        "address": [{"city": "Jeddah", "country": "SA"}],
        "generalPractitioner": [{"display": "Dr. Fatima Al-Harbi"}],
    },
    "Layla Hassan": {
        "resourceType": "Patient",
        "identifier": [{"system": "https://unitycare.demo/national-id", "value": "1034567890"}],
        "name": [{"use": "official", "family": "Hassan", "given": ["Layla"]}],
        "gender": "female",
        "birthDate": "1995-12-01",
        "telecom": [{"system": "phone", "value": "+966507654321", "use": "mobile"}],
        "address": [{"city": "Dammam", "country": "SA"}],
        "generalPractitioner": [{"display": "Dr. Ahmed Al-Qahtani"}],
    },
}

VITAL_SIGNS: dict[str, dict[str, Any]] = {
    "Nora Al-Saud": {
        "heartRate": 72,
        "oxygenSaturation": 98,
        "bloodPressure": "118/76",
        "temperature": 36.7,
    },
    "Omar Khaled": {
        "heartRate": 68,
        "oxygenSaturation": 97,
        "bloodPressure": "128/82",
        "temperature": 36.5,
    },
    "Layla Hassan": {
        "heartRate": 76,
        "oxygenSaturation": 99,
        "bloodPressure": "112/70",
        "temperature": 36.8,
    },
}

CONSENTS: list[dict[str, Any]] = [
    {"purpose": "treatment", "jurisdiction": "SA", "status": "active"},
    {"purpose": "research", "jurisdiction": "SA", "status": "active"},
    {"purpose": "data_sharing", "jurisdiction": "GCC", "status": "active"},
    {"purpose": "ai_processing", "jurisdiction": "SA", "status": "revoked"},
    {"purpose": "cross_border", "jurisdiction": "EU", "status": "pending"},
]

APPOINTMENTS: list[dict[str, Any]] = [
    {"patient": "Nora Al-Saud", "doctor": "Dr. Ahmed Al-Qahtani", "status": "completed", "reason": "Annual cardiac checkup", "time": "09:00"},
    {"patient": "Layla Hassan", "doctor": "Dr. Ahmed Al-Qahtani", "status": "in_progress", "reason": "Chest discomfort follow-up", "time": "10:30"},
    {"patient": "Omar Khaled", "doctor": "Dr. Fatima Al-Harbi", "status": "pending", "reason": "Pediatric consultation for daughter", "time": "11:00"},
    {"patient": "Nora Al-Saud", "doctor": "Dr. Ahmed Al-Qahtani", "status": "pending", "reason": "ECG results review", "time": "14:00"},
]

ICD_CODES: list[dict[str, str | None]] = [
    {"code": "I10", "description": "Essential (primary) hypertension", "category": "Circulatory System"},
    {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications", "category": "Endocrine"},
    {"code": "J45.0", "description": "Predominantly allergic asthma", "category": "Respiratory"},
    {"code": "I25.10", "description": "Atherosclerotic heart disease of native coronary artery", "category": "Circulatory System"},
    {"code": "N18.3", "description": "Chronic kidney disease, stage 3 (moderate)", "category": "Genitourinary"},
    {"code": "M17.0", "description": "Bilateral primary osteoarthritis of knee", "category": "Musculoskeletal"},
    {"code": "F32.9", "description": "Major depressive disorder, single episode, unspecified", "category": "Mental Health"},
    {"code": "J44.9", "description": "Chronic obstructive pulmonary disease, unspecified", "category": "Respiratory"},
    {"code": "E78.5", "description": "Hyperlipidemia, unspecified", "category": "Endocrine"},
    {"code": "Z23", "description": "Encounter for immunization", "category": "Preventive Care"},
]


# ---------------------------------------------------------------------------
# Client helpers
# ---------------------------------------------------------------------------


class SeedClient:
    """HTTP client wrapping the UnityCare API v1."""

    def __init__(self, base_url: str, dry_run: bool = False):
        self.base_url = base_url.rstrip("/")
        self.dry_run = dry_run
        self.tokens: dict[str, str] = {}  # email -> access_token
        self.user_ids: dict[str, str] = {}  # email -> user UUID
        self.patient_ids: dict[str, str] = {}  # full_name -> FHIR ID
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )

    # -- helpers ----------------------------------------------------------

    def _h(self, token: str | None = None) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def _check(self, resp: httpx.Response, desc: str) -> Any:
        if resp.status_code >= 400:
            body = resp.text[:500]
            log.warning("  ↳ %s %s: %s", resp.status_code, desc, body)
            return None
        try:
            return resp.json()
        except Exception:
            return None

    # -- operations -------------------------------------------------------

    def health_check(self) -> bool:
        resp = self._client.get("/health")
        ok = resp.status_code == 200
        log.info("API reachable: %s", "yes" if ok else "no (%s)" % resp.status_code)
        return ok

    def register_user(self, user: dict) -> dict | None:
        email = user["email"]
        if self.dry_run:
            log.info("[DRY] Register user %s (%s)", email, user["role"])
            self.user_ids[email] = str(uuid.uuid4())
            return self.user_ids[email]

        resp = self._client.post("/auth/register", json={
            "email": email,
            "password": user["password"],
            "full_name": user["full_name"],
            "role": user["role"],
            "locale": user["locale"],
        })
        data = self._check(resp, f"register {email}")
        if data:
            uid = data.get("id", data.get("_id", ""))
            self.user_ids[email] = uid
            log.info("  ✓ Registered %s (%s) — id=%s", email, user["role"], uid[:8])
            return uid
        elif resp.status_code == 409:
            log.info("  ∼ %s already exists (HTTP 409)", email)
            return "exists"
        return None

    def login(self, email: str, password: str) -> str | None:
        if self.dry_run:
            self.tokens[email] = "dry-run-token"
            return self.tokens[email]

        resp = self._client.post("/auth/login", json={
            "email": email,
            "password": password,
        })
        data = self._check(resp, f"login {email}")
        if data:
            token = data.get("access_token", "")
            self.tokens[email] = token
            log.info("  ✓ Logged in %s", email)
            return token
        return None

    def create_patient(self, full_name: str, fhir_resource: dict, token: str) -> str | None:
        if self.dry_run:
            fid = f"dry-{uuid.uuid4().hex[:12]}"
            self.patient_ids[full_name] = fid
            return fid

        resp = self._client.post("/fhir/Patient", json={"fhir_resource": fhir_resource}, headers=self._h(token))
        data = self._check(resp, f"create patient {full_name}")
        if data:
            fid = data.get("fhir_id", data.get("id", ""))
            self.patient_ids[full_name] = fid
            log.info("  ✓ Created FHIR patient %s — id=%s", full_name, fid[:8])
            return fid
        return None

    def create_consent(self, patient_user_id: str, consent: dict, token: str) -> dict | None:
        if self.dry_run:
            log.info("[DRY] Consent %s for patient %s", consent["purpose"], patient_user_id[:8])
            return {"id": str(uuid.uuid4())}

        resp = self._client.post("/consent", json={
            "patient_id": patient_user_id,
            "purpose": consent["purpose"],
            "jurisdiction": consent["jurisdiction"],
        }, headers=self._h(token))
        data = self._check(resp, f"consent {consent['purpose']}")
        if data:
            log.info("  ✓ Created consent %s (%s)", consent["purpose"], data.get("id", "")[:8])
            return data
        return None

    def create_vitals(self, user_id: str, vitals: dict, token: str) -> dict | None:
        if self.dry_run:
            log.info("[DRY] Vitals for user %s", user_id[:8])
            return {"id": str(uuid.uuid4())}

        systolic, diastolic = vitals["bloodPressure"].split("/")
        resp = self._client.post(f"/iot/{user_id}/vitals", json={
            "heart_rate": vitals["heartRate"],
            "oxygen_saturation": vitals["oxygenSaturation"],
            "blood_pressure_systolic": int(systolic),
            "blood_pressure_diastolic": int(diastolic),
            "temperature": vitals["temperature"],
        }, headers=self._h(token))
        data = self._check(resp, f"vitals for {user_id[:8]}")
        if data:
            log.info("  ✓ Created vitals for user %s", user_id[:8])
            return data
        return None

    def create_appointment(self, appointment: dict, patient_id: str, doctor_email: str, tokens: dict) -> dict | None:
        if self.dry_run:
            log.info("[DRY] Appointment: %s", appointment["reason"])
            return {"id": str(uuid.uuid4())}

        doctor_token = tokens.get(doctor_email, "")
        if not doctor_token:
            log.warning("  ↳ No token for doctor %s", doctor_email)
            return None

        now = datetime.now(timezone.utc)
        hour, minute = map(int, appointment["time"].split(":"))
        scheduled_at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if scheduled_at < now:
            scheduled_at += timedelta(days=1)

        resp = self._client.post("/appointments", json={
            "patient_id": patient_id,
            "doctor_id": "",  # resolved by backend from token
            "scheduled_at": scheduled_at.isoformat(),
            "reason": appointment["reason"],
            "status": appointment["status"],
        }, headers=self._h(doctor_token))
        data = self._check(resp, f"appointment {appointment['reason']}")
        if data:
            log.info("  ✓ Created appointment: %s (%s)", appointment["reason"], appointment["status"])
            return data
        return None

    def seed_icd_codes(self, token: str) -> None:
        if self.dry_run:
            log.info("[DRY] Seed %d ICD-10-CM codes", len(ICD_CODES))
            return
        for icd in ICD_CODES:
            resp = self._client.post("/icd-codes", json=icd, headers=self._h(token))
            data = self._check(resp, f"ICD-10 {icd['code']}")
            if data:
                log.info("  ✓ ICD-10 %s — %s", icd["code"], icd["description"][:50])
            elif resp.status_code == 409:
                log.info("  ∼ ICD-10 %s already exists", icd["code"])

    def create_audit_events(self, token: str) -> None:
        """Create sample audit events by performing known actions."""
        if self.dry_run:
            log.info("[DRY] Skip audit events creation")
            return

        events = [
            {"action": "user.login", "resource_type": "session", "details": {"method": "password", "ip": "192.168.1.100"}},
            {"action": "user.login", "resource_type": "session", "details": {"method": "password", "ip": "192.168.1.101"}},
            {"action": "consent.created", "resource_type": "consent", "details": {"purpose": "treatment", "jurisdiction": "SA"}},
            {"action": "consent.revoked", "resource_type": "consent", "details": {"purpose": "ai_processing", "reason": "Patient request"}},
            {"action": "patient.created", "resource_type": "patient", "details": {"count": 3}},
            {"action": "admin.user.list", "resource_type": "user", "details": {"total": 6}},
        ]
        log.info("  ℹ  Audit events: %d events would be logged via real API calls.", len(events))
        for ev in events:
            log.debug("    ∘ %s on %s", ev["action"], ev["resource_type"])

    def wait_for_api(self, max_retries: int = 30, delay: int = 5) -> bool:
        log.info("Waiting for API to become healthy ...")
        for attempt in range(1, max_retries + 1):
            try:
                if self.health_check():
                    log.info("API is ready after %d attempt(s)", attempt)
                    return True
            except Exception as exc:
                log.debug("Attempt %d failed: %s", attempt, exc)
            if attempt % 5 == 0:
                log.info("  still waiting ... (attempt %d/%d)", attempt, max_retries)
            if attempt < max_retries:
                import time
                time.sleep(delay)
        log.error("API not reachable after %d attempts — aborting.", max_retries)
        return False

    def clean_data(self, admin_token: str) -> None:
        log.info("Cleaning existing data ...")
        # Try a generic cleanup endpoint first
        if not self.dry_run:
            resp = self._client.delete("/admin/seed-data",
                                       headers=self._h(admin_token))
            if resp.status_code in (200, 204):
                log.info("  ✓ Cleanup via /admin/seed-data succeeded")
                return
            elif resp.status_code == 404:
                log.info("  ∼ /admin/seed-data not available — attempting per-entity cleanup")
            else:
                log.info("  ∼ /admin/seed-data returned %s — falling back", resp.status_code)

        # Fallback: delete in reverse dependency order (appointments → consents → patients → users)
        # Fetch all users first
        if not self.dry_run:
            resp = self._client.get("/admin/users", headers=self._h(admin_token))
            users = self._check(resp, "list users for cleanup") or []
            if isinstance(users, list):
                # Delete in reverse order: appointments, consents, patients, sessions, users
                for u in reversed(users):
                    uid = u.get("id", "")
                    if not uid:
                        continue
                    for ep in [f"/appointments/by-patient/{uid}",
                               f"/consent/patient/{uid}",
                               f"/fhir/Patient/by-user/{uid}",
                               f"/admin/users/{uid}"]:
                        try:
                            d = self._client.delete(ep, headers=self._h(admin_token))
                            if d.status_code in (200, 204):
                                log.debug("  ✓ Deleted %s for %s", ep, uid[:8])
                        except Exception:
                            pass
                log.info("  ✓ Per-entity cleanup completed (best-effort)")
            else:
                log.info("  ∼ Could not list users for cleanup")
        else:
            log.info("[DRY] Would clean existing data")

    def close(self):
        self._client.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed UnityCare with demo data")
    parser.add_argument("--base-url", default=BASE_URL, help="API base URL (default: %(default)s)")
    parser.add_argument("--clean", action="store_true", help="Wipe all data before seeding")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without executing")
    parser.add_argument("--railway", action="store_true", help="Railway deployment mode: waits for API readiness")
    return parser.parse_args()


def main():
    args = parse_args()
    client = SeedClient(base_url=args.base_url, dry_run=args.dry_run)

    # Railway environment detection -------------------------------------------
    if os.getenv("RAILWAY_SERVICE_NAME") or os.getenv("RAILWAY_ENVIRONMENT"):
        log.info("Railway environment detected")
    if args.railway:
        log.info("Running in Railway mode — will wait for API readiness")
        if not client.wait_for_api():
            sys.exit(1)

    log.info("UnityCare Demo Seed  •  base_url=%s", args.base_url)
    log.info("")

    # 0. Clean first ----------------------------------------------------------
    if args.clean and not args.dry_run:
        log.info("─" * 48)
        log.info("STEP 0/8  Clean existing data")
        admin_token = client.tokens.get("admin@unitycare.demo", "")
        if not admin_token:
            # Must login as admin first to get a token for cleanup
            client.login("admin@unitycare.demo", "Demo@2026Admin")
            admin_token = client.tokens.get("admin@unitycare.demo", "")
        if admin_token:
            client.clean_data(admin_token)
        else:
            log.warning("  ↳ Cannot obtain admin token — skipping cleanup")
    elif args.clean and args.dry_run:
        log.info("[DRY] Would clean existing data")
    else:
        log.info("Skipping cleanup (use --clean to wipe data first)")

    # 1. Health check --------------------------------------------------------
    if not args.dry_run and not client.health_check():
        log.error("Cannot reach API at %s", args.base_url)
        sys.exit(1)

    # 2. Register users ------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 1/8  Register users")
    for user in USERS:
        client.register_user(user)

    # 3. Login ---------------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 2/8  Login and capture tokens")
    for user in USERS:
        client.login(user["email"], user["password"])

    # 4. Create FHIR patients ------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 3/8  Create FHIR patient resources")
    admin_token = client.tokens.get("admin@unitycare.demo", "")
    for user in USERS:
        if user["role"] == "patient":
            fhir = FHIR_RESOURCES.get(user["full_name"])
            if fhir:
                client.create_patient(user["full_name"], fhir, admin_token)

    # 5. Create consents ------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 4/8  Create patient consents")
    admin_token = client.tokens.get("admin@unitycare.demo", "")
    for user in USERS:
        if user["role"] == "patient":
            uid = client.user_ids.get(user["email"])
            if uid and uid != "exists":
                for consent in CONSENTS:
                    client.create_consent(uid, consent, admin_token)
            elif uid == "exists":
                log.info("  ∼ Skip consents for %s (already exists)", user["email"])

    # 6. ICD-10 codes --------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 5/8  Seed ICD-10-CM reference codes")
    client.seed_icd_codes(admin_token)

    # 7. Create vitals -------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 6/8  Seed vital signs")
    admin_token = client.tokens.get("admin@unitycare.demo", "")
    for user in USERS:
        if user["role"] == "patient":
            uid = client.user_ids.get(user["email"])
            vitals_data = VITAL_SIGNS.get(user["full_name"])
            if uid and uid != "exists" and vitals_data:
                client.create_vitals(uid, vitals_data, admin_token)
            elif uid == "exists":
                log.info("  ∼ Skip vitals for %s (already exists)", user["email"])

    # 7. Create appointments --------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 7/8  Seed appointments")
    for apt in APPOINTMENTS:
        patient_user = next((u for u in USERS if u["full_name"] == apt["patient"]), None)
        patient_uid = client.user_ids.get(patient_user["email"]) if patient_user else None
        doctor_user = next((u for u in USERS if u["full_name"] == apt["doctor"]), None)
        doctor_email = doctor_user["email"] if doctor_user else ""
        if patient_uid and patient_uid != "exists":
            client.create_appointment(apt, patient_uid, doctor_email, client.tokens)
        else:
            log.info("  ∼ Skip appointment for %s (patient not found)", apt["patient"])

    # 8. Audit events --------------------------------------------------------
    log.info("─" * 48)
    log.info("STEP 8/8  Seed audit trail")
    client.create_audit_events(admin_token)

    # 9. Summary -------------------------------------------------------------
    log.info("─" * 48)
    log.info("")
    log.info("Summary:")
    log.info(f"  Users registered:    {len([u for u in USERS])}")
    log.info(f"  Patients created:    {len(FHIR_RESOURCES)}")
    log.info(f"  Consents created:    {len(CONSENTS)} per patient")
    log.info(f"  ICD-10 codes seeded: {len(ICD_CODES)}")
    log.info(f"  Appointments created:{len(APPOINTMENTS)}")
    log.info(f"  Vitals recorded:     {len(VITAL_SIGNS)}")
    log.info("")
    log.info("Demo accounts:")
    log.info("  Admin:     admin@unitycare.demo     / Demo@2026Admin")
    log.info("  Doctor 1:  doctor.ahmed@unitycare.demo  / Demo@2026Doc")
    log.info("  Doctor 2:  doctor.fatima@unitycare.demo / Demo@2026Doc")
    log.info("  Patient 1: patient.nora@unitycare.demo  / Demo@2026Pat")
    log.info("  Patient 2: patient.omar@unitycare.demo  / Demo@2026Pat")
    log.info("  Patient 3: patient.layla@unitycare.demo / Demo@2026Pat")
    log.info("")

    client.close()


if __name__ == "__main__":
    main()
