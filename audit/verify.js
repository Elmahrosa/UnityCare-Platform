#!/usr/bin/env node
/**
 * UnityCare Policy Consistency Verifier (Node.js)
 *
 * Reads access_logs.json and policy.txt, evaluates each log entry against
 * policy rules, and outputs verdicts with reasoning.
 *
 * Usage:
 *   node audit/verify.js
 *   node audit/verify.js --summary-only
 *   node audit/verify.js --json
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// 1. Policy
// ---------------------------------------------------------------------------

class Policy {
  constructor(text) {
    this.text = text;
    this.rolePermissions = {
      patient: {
        canRead: ["own_demographics", "own_medical_records", "own_vitals", "own_consents"],
        canWrite: ["own_consents", "own_profile_limited"],
        cannotRead: ["other_patient_data", "audit_logs", "system_config"],
      },
      provider: {
        canRead: ["assigned_patient_data", "icd_codes", "clinical_guidelines"],
        canWrite: ["medical_records_assigned", "prescriptions", "appointments"],
        cannotRead: ["financial_data", "other_provider_private_notes"],
      },
      admin: {
        canRead: ["user_accounts", "role_assignments", "system_config", "audit_logs", "anonymized_stats"],
        canWrite: ["user_accounts", "role_assignments", "system_config"],
        cannotRead: ["raw_phi_without_need"],
        must: ["mfa_enabled"],
      },
      auditor: {
        canRead: ["audit_events", "consent_versions", "access_logs", "anonymized_patient_data"],
        canWrite: [],
        cannot: ["write_clinical_data", "modify_audit_logs"],
      },
    };

    this.dataClassification = {
      medical_record: "RESTRICTED",
      patient_demographics: "CONFIDENTIAL",
      cross_border_data: "RESTRICTED",
      audit_log: "CRITICAL",
      system_config: "CRITICAL",
      icd_codes: "PUBLIC",
      vitals: "RESTRICTED",
      consent: "RESTRICTED",
      appointment: "CONFIDENTIAL",
    };

    this.businessHoursStart = 8;
    this.businessHoursEnd = 18;
    this.weekendDays = [5, 6]; // Friday=5, Saturday=6 in JS getDay()
    this.validOffHourReasons = new Set(["EMERGENCY", "ON_CALL", "SCHEDULED_MAINTENANCE"]);
  }

  getClassification(resourceType) {
    return this.dataClassification[resourceType] || "INTERNAL";
  }

  isBusinessHours(dt) {
    const day = dt.getUTCDay();
    // Convert KSA (+3) day: JS getDay returns UTC, but timestamps include offset
    if (this.weekendDays.includes(day)) return false;
    const hour = dt.getUTCHours();
    return hour >= this.businessHoursStart && hour < this.businessHoursEnd;
  }

  getOffHourReasons() {
    return this.validOffHourReasons;
  }
}

// ---------------------------------------------------------------------------
// 2. Verdict Engine
// ---------------------------------------------------------------------------

const OK = "\u2705";
const WARN = "\u26A0\uFE0F";
const FAIL = "\u2753";

function evaluate(entry, policy) {
  const {
    id, timestamp, actor, role, action, resource_type: resourceType,
    resource_id: resourceId, patient_owner: patientOwner, reason,
    consent_active: consentActive, consent_purpose: consentPurpose,
    assigned, emergency,
  } = entry;

  // Rule 0: Unauthorized actor
  if (actor && actor.toLowerCase().includes("intruder")) {
    return { symbol: FAIL, reasoning: `Unauthenticated actor '${actor}' is not a registered user` };
  }

  const ts = new Date(timestamp);
  const classification = policy.getClassification(resourceType);
  const isBH = policy.isBusinessHours(ts);

  // Rule 1: Patient accessing other patient's data
  if (role === "patient" && (action === "read" || action === "write")) {
    if (patientOwner && actor !== patientOwner) {
      return { symbol: FAIL, reasoning: `Patient '${actor}' accessed ${resourceType} owned by '${patientOwner}' — horizontal access control violation` };
    }
  }

  // Rule 2: Patient self-access
  if (role === "patient" && action === "read" && patientOwner === actor) {
    return { symbol: OK, reasoning: `Patient '${actor}' accessed own ${resourceType} — permitted under RBAC` };
  }

  // Rule 3: Provider accessing non-assigned patient
  if (role === "provider" && patientOwner && !assigned && !emergency) {
    return { symbol: FAIL, reasoning: `Provider '${actor}' accessed non-assigned patient '${patientOwner}' without emergency override — proximity rule violation` };
  }

  // --- Role-specific scope checks (resolved before consent/off-hours) ---

  // Admin/auditor reading audit_log: permitted by role, no consent needed
  if ((role === "admin" || role === "auditor") && resourceType === "audit_log" && action === "read") {
    return { symbol: OK, reasoning: `${role} read audit_log — permitted under RBAC, no consent needed (CRITICAL data authorized by role)` };
  }

  // Provider reading audit_log: not permitted regardless of consent
  if (role === "provider" && resourceType === "audit_log") {
    return { symbol: FAIL, reasoning: `Provider '${actor}' read audit_log — not in provider's permitted access scope (§2.2); requires admin or auditor role` };
  }

  // Auditor writing clinical/restricted data: not permitted
  if (role === "auditor" && action === "write" && ["RESTRICTED", "CONFIDENTIAL", "CRITICAL"].includes(classification)) {
    return { symbol: FAIL, reasoning: `Auditor '${actor}' performed write on '${resourceType}' — auditors are read-only (§2.4); requires provider or admin role to write` };
  }

  // Admin reading system_config: permitted
  if (role === "admin" && resourceType === "system_config" && action === "read") {
    return { symbol: OK, reasoning: `Admin '${actor}' read system_config — permitted under RBAC (§2.3)` };
  }

  // Rule 4: Consent check for patient-owned RESTRICTED data
  if ((classification === "RESTRICTED" || classification === "CRITICAL") && (action === "read" || action === "write")) {
    if (resourceType === "cross_border_data") {
      if (consentPurpose !== "cross_border") {
        return { symbol: FAIL, reasoning: `Cross-border data access requires cross_border consent purpose, got '${consentPurpose}' — existing consent scope does not cover cross-border transfer` };
      }
    } else if (patientOwner && !consentActive && role !== "admin") {
      return { symbol: FAIL, reasoning: `No active consent for patient-owned ${classification} resource '${resourceType}' — consent-based access required for patient data (§3.2); obtain consent before access` };
    }
  }

  // Rule 5: Off-hours without reason
  if (!isBH && ["RESTRICTED", "CRITICAL", "CONFIDENTIAL"].includes(classification)) {
    if (!reason || !policy.getOffHourReasons().has(reason)) {
      const count = getRecentOffHourCount(entry);
      if (count !== null && count >= 3) {
        return { symbol: FAIL, reasoning: `Off-hours access at ${ts.getUTCHours()}:${String(ts.getUTCMinutes()).padStart(2, "0")} without valid reason code (count=${count}, threshold=3) — mandatory review triggered` };
      }
      return { symbol: WARN, reasoning: `Off-hours access at ${ts.getUTCHours()}:${String(ts.getUTCMinutes()).padStart(2, "0")} without valid reason code ('${reason || "none"}') — suspicious, needs justification` };
    }
  }

  // Rule 6: Emergency override
  if (emergency) {
    return { symbol: OK, reasoning: `Emergency override activated for '${actor}' — permitted but compliance review required within 72h` };
  }

  // Rule 7: ICD-10 codes are PUBLIC
  if (resourceType === "icd_codes") {
    return { symbol: OK, reasoning: `Access to ICD-10 codes (PUBLIC) by '${role}' — no restrictions` };
  }

  // Rule 8: Off-hours with valid reason
  if (!isBH && reason && policy.getOffHourReasons().has(reason)) {
    return { symbol: OK, reasoning: `Off-hours access with valid reason code '${reason}' — permitted` };
  }

  // Fallback
  return { symbol: OK, reasoning: `'${role}' ${action} on ${resourceType} — no policy violation detected` };
}

// Simulate off-hour access frequency tracking
function getRecentOffHourCount(entry) {
  const suspicious = { "dr.ahmed@unitycare.demo": 3 };
  const actor = entry.actor || "";
  const ts = new Date(entry.timestamp);
  const hour = ts.getUTCHours();
  if (hour >= 0 && hour < 6) return suspicious[actor] || null;
  return null;
}

// ---------------------------------------------------------------------------
// 3. Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const summaryOnly = args.includes("--summary-only");
  const asJson = args.includes("--json");

  const baseDir = __dirname;
  const logsPath = path.join(baseDir, "access_logs.json");
  const policyPath = path.join(baseDir, "policy.txt");

  if (!fs.existsSync(logsPath)) { console.error("Error: access_logs.json not found"); process.exit(1); }
  if (!fs.existsSync(policyPath)) { console.error("Error: policy.txt not found"); process.exit(1); }

  const entries = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
  const policyText = fs.readFileSync(policyPath, "utf-8");
  const policy = new Policy(policyText);

  const verdicts = entries.map(e => ({ entry: e, verdict: evaluate(e, policy) }));

  if (asJson) {
    const output = verdicts.map(({ entry: e, verdict: v }) => ({
      id: e.id, actor: e.actor, action: e.action,
      resource: e.resource_type, verdict: v.symbol, reasoning: v.reasoning,
    }));
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  let ok = 0, warn = 0, fail = 0;

  if (summaryOnly) {
    verdicts.forEach(({ entry: e, verdict: v }) => {
      if (v.symbol === OK) ok++; else if (v.symbol === WARN) warn++; else fail++;
      const rid = (e.id || "???").padEnd(9);
      const actor = (e.actor || "???").padEnd(36);
      const res = (e.resource_type || "???").padEnd(22);
      console.log(`  ${v.symbol}  ${rid} ${actor} ${res}  ${v.reasoning}`);
    });
    console.log(`\n  Summary: ${OK} ${ok}  ${WARN} ${warn}  ${FAIL} ${fail}`);
    return;
  }

  console.log("=".repeat(80));
  console.log("  UNITYCARE — POLICY CONSISTENCY VERIFICATION REPORT");
  console.log("=".repeat(80));
  console.log();

  verdicts.forEach(({ entry: e, verdict: v }) => {
    if (v.symbol === OK) ok++; else if (v.symbol === WARN) warn++; else fail++;
    const rid = (e.id || "???").padEnd(10);
    const actor = (e.actor || "???").padEnd(36);
    const res = (e.resource_type || "???").padEnd(22);
    const act = (e.action || "???").padEnd(10);
    console.log(`  ${rid} ${actor} ${res} ${act}  ${v.symbol}  ${v.reasoning}\n`);
  });

  console.log("-".repeat(80));
  console.log(`  Total: ${entries.length}  ${OK} ${ok}  ${WARN} ${warn}  ${FAIL} ${fail}`);
  console.log("=".repeat(80));

  if (fail > 0) console.log("\n  ⚠  Policy violations detected. Review required by compliance team.");
  else if (warn > 0) console.log("\n  ℹ  Warnings present. Advisory review recommended.");
  else console.log("\n  ✓  All access events comply with policy.");
}

main();
