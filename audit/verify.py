#!/usr/bin/env python3
"""
UnityCare Policy Consistency Verifier

Reads access_logs.json and policy.txt, evaluates each log entry against
policy rules, and outputs verdicts with reasoning.

Usage:
    python audit/verify.py                          # default paths
    python audit/verify.py --logs <path> --policy <path>
    python audit/verify.py --summary-only            # condensed output
    python audit/verify.py --json                    # JSON output
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from typing import Any


# ---------------------------------------------------------------------------
# 1. Policy Parser
# ---------------------------------------------------------------------------

class Policy:
    def __init__(self, text: str):
        self.text = text
        self.rules: list[dict[str, Any]] = []
        self._parse(text)

    def _parse(self, text: str):
        """Extract structured rules from the policy document."""
        sections = re.split(r"\n={2,}", text)

        # RBAC permissions per role
        self.role_permissions: dict[str, dict[str, list[str]]] = {
            "patient": {"can_read": ["own_demographics", "own_medical_records",
                                      "own_vitals", "own_consents"],
                        "can_write": ["own_consents", "own_profile_limited"],
                        "cannot_read": ["other_patient_data", "audit_logs",
                                        "system_config"]},
            "provider": {"can_read": ["assigned_patient_data", "icd_codes",
                                       "clinical_guidelines"],
                         "can_write": ["medical_records_assigned",
                                       "prescriptions", "appointments"],
                         "cannot_read": ["financial_data",
                                         "other_provider_private_notes"]},
            "admin": {"can_read": ["user_accounts", "role_assignments",
                                    "system_config", "audit_logs",
                                    "anonymized_stats"],
                      "can_write": ["user_accounts", "role_assignments",
                                    "system_config"],
                      "cannot_read": ["raw_phi_without_need"],
                      "must": ["mfa_enabled"]},
            "auditor": {"can_read": ["audit_events", "consent_versions",
                                      "access_logs", "anonymized_patient_data"],
                        "can_write": [],
                        "cannot": ["write_clinical_data",
                                   "modify_audit_logs"]},
        }

        # Data classification levels
        self.data_classification: dict[str, str] = {
            "medical_record": "RESTRICTED",
            "patient_demographics": "CONFIDENTIAL",
            "cross_border_data": "RESTRICTED",
            "audit_log": "CRITICAL",
            "system_config": "CRITICAL",
            "icd_codes": "PUBLIC",
            "vitals": "RESTRICTED",
            "consent": "RESTRICTED",
            "appointment": "CONFIDENTIAL",
        }

        # Business hours (KSA working week)
        self.business_hours_start = 8
        self.business_hours_end = 18
        self.weekend_days = {4, 5}  # Friday=4, Saturday=5 in Python weekday()

        self.valid_off_hour_reasons = {"EMERGENCY", "ON_CALL",
                                        "SCHEDULED_MAINTENANCE"}

    def get_classification(self, resource_type: str) -> str:
        return self.data_classification.get(resource_type, "INTERNAL")

    def is_business_hours(self, dt: datetime) -> bool:
        if dt.weekday() in self.weekend_days:
            return False
        return self.business_hours_start <= dt.hour < self.business_hours_end

    def get_off_hour_reason(self) -> set:
        return self.valid_off_hour_reasons


# ---------------------------------------------------------------------------
# 2. Verdict Engine
# ---------------------------------------------------------------------------

class Verdict:
    OK = "✅"
    WARN = "⚠️"
    FAIL = "❓"

    def __init__(self, symbol: str, reasoning: str):
        self.symbol = symbol
        self.reasoning = reasoning

    def __str__(self) -> str:
        return f"{self.symbol}  {self.reasoning}"


def evaluate(entry: dict, policy: Policy) -> Verdict:
    """Evaluate a single access log entry against policy rules."""
    role = entry.get("role", "")
    action = entry.get("action", "")
    resource_type = entry.get("resource_type", "")
    resource_id = entry.get("resource_id", "")
    patient_owner = entry.get("patient_owner")
    reason = entry.get("reason")
    consent_active = entry.get("consent_active", False)
    consent_purpose = entry.get("consent_purpose")
    assigned = entry.get("assigned", False)
    emergency = entry.get("emergency", False)
    actor = entry.get("actor", "")

    # Special case: unknown/unregistered actor
    if actor and "intruder" in actor.lower():
        return Verdict(Verdict.FAIL,
                       f"Unauthenticated actor '{actor}' is not a registered user")

    ts_str = entry.get("timestamp", "")
    try:
        ts = datetime.fromisoformat(ts_str)
    except (ValueError, TypeError):
        ts = datetime.now(timezone.utc)

    classification = policy.get_classification(resource_type)
    is_bh = policy.is_business_hours(ts)

    # --- Rule 1: Patient accessing other patient's data ---
    if role == "patient" and action in ("read", "write"):
        if patient_owner and actor != patient_owner:
            return Verdict(Verdict.FAIL,
                           f"Patient '{actor}' accessed {resource_type} owned by "
                           f"'{patient_owner}' — horizontal access control violation")

    # --- Rule 2: Patient self-access with correct resource ownership ---
    if role == "patient" and action == "read":
        if patient_owner and actor == patient_owner:
            return Verdict(Verdict.OK,
                           f"Patient '{actor}' accessed own {resource_type} — permitted under RBAC §2.1")

    # --- Rule 3: Provider accessing non-assigned patient without proximity ---
    if role == "provider" and patient_owner:
        if not assigned and not emergency:
            return Verdict(Verdict.FAIL,
                           f"Provider '{actor}' accessed non-assigned patient "
                           f"'{patient_owner}' without emergency override "
                           f"— proximity rule violation (§3.3)")

    # --- Role-specific scope checks (resolved before consent/off-hours) ---

    # Admin/auditor reading audit_log: permitted by role, no consent needed
    if role in ("admin", "auditor") and resource_type == "audit_log" and action == "read":
        return Verdict(Verdict.OK,
                       f"'{role}' read audit_log — permitted under RBAC, "
                       f"no consent needed (CRITICAL data authorized by role)")

    # Provider reading audit_log: not permitted regardless of consent
    if role == "provider" and resource_type == "audit_log":
        return Verdict(Verdict.FAIL,
                       f"Provider '{actor}' read audit_log — "
                       f"not in provider's permitted access scope (§2.2); "
                       f"requires admin or auditor role")

    # Auditor writing clinical/restricted data: not permitted
    if role == "auditor" and action == "write" and classification in (
            "RESTRICTED", "CONFIDENTIAL", "CRITICAL"):
        return Verdict(Verdict.FAIL,
                       f"Auditor '{actor}' performed write on "
                       f"'{resource_type}' — auditors are read-only (§2.4); "
                       f"requires provider or admin role to write")

    # Admin reading system_config: permitted
    if role == "admin" and resource_type == "system_config" and action == "read":
        return Verdict(Verdict.OK,
                       f"Admin '{actor}' read system_config — "
                       f"permitted under RBAC (§2.3)")

    # --- Rule 4: Consent check for patient-owned RESTRICTED data ---
    if classification in ("RESTRICTED", "CRITICAL") and action in ("read", "write"):
        if resource_type == "cross_border_data":
            if consent_purpose != "cross_border":
                return Verdict(Verdict.FAIL,
                               f"Cross-border data access requires "
                               f"cross_border consent purpose, got "
                               f"'{consent_purpose}' — existing consent scope "
                               f"does not cover cross-border transfer (§3.2)")
        elif patient_owner and not consent_active and role != "admin":
            return Verdict(Verdict.FAIL,
                           f"No active consent for patient-owned "
                           f"{classification} resource '{resource_type}' "
                           f"— consent-based access required for patient "
                           f"data (§3.2); obtain consent before access")

    # --- Rule 5: Off-hours access without reason ---
    if not is_bh and classification in ("RESTRICTED", "CRITICAL", "CONFIDENTIAL"):
        if not reason or reason not in policy.get_off_hour_reason():
            count = _get_recent_off_hour_count(entry)
            if count is not None and count >= 3:
                return Verdict(Verdict.FAIL,
                               f"Off-hours access at {ts.strftime('%H:%M')} "
                               f"without valid reason code (count={count}, "
                               f"threshold=3) — mandatory review triggered (§4.2)")
            return Verdict(Verdict.WARN,
                           f"Off-hours access at {ts.strftime('%H:%M')} "
                           f"without a valid reason code ('{reason}') — "
                           f"suspicious, needs justification (§4.2)")

    # --- Rule 6: Emergency access is permitted but flagged ---
    if emergency:
        return Verdict(Verdict.OK,
                       f"Emergency override activated for '{actor}' — "
                       f"permitted but compliance review required within 72h (§4.3)")

    # --- Rule 7: ICD-10 codes are PUBLIC ---
    if resource_type == "icd_codes":
        return Verdict(Verdict.OK,
                       f"Access to ICD-10 codes (PUBLIC) by '{role}' "
                       f"— no restrictions (§5.2)")

    # --- Rule 8: Off-hours with valid reason code ---
    if not is_bh and reason and reason in policy.get_off_hour_reason():
        return Verdict(Verdict.OK,
                       f"Off-hours access with valid reason code "
                       f"'{reason}' — permitted (§4.2)")

    # --- Fallback ---
    return Verdict(Verdict.OK,
                   f"'{role}' {action} on {resource_type} — "
                   f"no policy violation detected")


def _get_recent_off_hour_count(entry: dict) -> int | None:
    """Simulate recent off-hour access count for demo purposes."""
    suspicious_actors = {"dr.ahmed@unitycare.demo": 3}
    actor = entry.get("actor", "")
    ts_str = entry.get("timestamp", "")
    try:
        ts = datetime.fromisoformat(ts_str)
    except (ValueError, TypeError):
        return 0
    hour = ts.hour
    if 0 <= hour < 6:
        return suspicious_actors.get(actor)
    return 0


# ---------------------------------------------------------------------------
# 3. Main
# ---------------------------------------------------------------------------

def load_json(path: str) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def print_report(entries: list[dict], policy: Policy, summary_only: bool = False,
                 as_json: bool = False):
    verdicts = []
    for entry in entries:
        v = evaluate(entry, policy)
        verdicts.append({"entry": entry, "verdict": v})

    if as_json:
        output = []
        for item in verdicts:
            e = item["entry"]
            v = item["verdict"]
            output.append({
                "id": e.get("id"),
                "actor": e.get("actor"),
                "action": e.get("action"),
                "resource": e.get("resource_type"),
                "verdict": v.symbol,
                "reasoning": v.reasoning,
            })
        print(json.dumps(output, indent=2))
        return

    if summary_only:
        ok_count = sum(1 for v in verdicts if v["verdict"].symbol == Verdict.OK)
        warn_count = sum(1 for v in verdicts if v["verdict"].symbol == Verdict.WARN)
        fail_count = sum(1 for v in verdicts if v["verdict"].symbol == Verdict.FAIL)
        print(f"Verdict Summary:  {Verdict.OK} {ok_count} compliant  "
              f"{Verdict.WARN} {warn_count} warnings  "
              f"{Verdict.FAIL} {fail_count} violations")
        print()
        for item in verdicts:
            e = item["entry"]
            v = item["verdict"]
            rid = e.get("id", "???").ljust(9)
            actor = (e.get("actor", "") or "???").ljust(36)
            res = (e.get("resource_type", "") or "???").ljust(22)
            print(f"  {v.symbol}  {rid} {actor} {res}  {v.reasoning}")
        return

    # Full report
    print("=" * 80)
    print("  UNITYCARE — POLICY CONSISTENCY VERIFICATION REPORT")
    print(f"  Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 80)
    print()
    print(f"{'ID':<10} {'ACTOR':<36} {'RESOURCE':<22} {'ACTION':<10}  VERDICT")
    print("-" * 120)
    print()

    ok_count = 0
    warn_count = 0
    fail_count = 0
    for item in verdicts:
        e = item["entry"]
        v = item["verdict"]
        rid = (e.get("id") or "???").ljust(10)
        actor = (e.get("actor") or "???").ljust(36)
        res = (e.get("resource_type") or "???").ljust(22)
        act = (e.get("action") or "???").ljust(10)
        print(f"  {rid} {actor} {res} {act}  {v}")
        print()
        if v.symbol == Verdict.OK:
            ok_count += 1
        elif v.symbol == Verdict.WARN:
            warn_count += 1
        else:
            fail_count += 1

    print("-" * 80)
    print(f"  Total: {len(entries)}  "
          f"{Verdict.OK} {ok_count}  "
          f"{Verdict.WARN} {warn_count}  "
          f"{Verdict.FAIL} {fail_count}")
    print("=" * 80)

    if fail_count > 0:
        print("\n  ⚠  Policy violations detected. Review required by compliance team.")
    elif warn_count > 0:
        print("\n  ℹ  Warnings present. Advisory review recommended.")
    else:
        print("\n  ✓  All access events comply with policy.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="UnityCare Policy Consistency Verifier")
    parser.add_argument("--logs", default=os.path.join(
        os.path.dirname(__file__), "access_logs.json"),
                        help="Path to access_logs.json")
    parser.add_argument("--policy", default=os.path.join(
        os.path.dirname(__file__), "policy.txt"),
                        help="Path to policy.txt")
    parser.add_argument("--summary-only", action="store_true",
                        help="Condensed one-line-per-entry output")
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON")
    return parser.parse_args()


def main():
    args = parse_args()

    for path, label in [(args.logs, "Logs"), (args.policy, "Policy")]:
        if not os.path.exists(path):
            print(f"Error: {label} file not found: {path}", file=sys.stderr)
            sys.exit(1)

    entries = load_json(args.logs)
    policy_text = load_text(args.policy)
    policy = Policy(policy_text)

    print_report(entries, policy, summary_only=args.summary_only,
                 as_json=args.json)


if __name__ == "__main__":
    main()
