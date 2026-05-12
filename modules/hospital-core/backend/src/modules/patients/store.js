const fs = require("fs");
const path = require("path");
const { randomUUID, createHmac } = require("crypto");

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "patients.json");
const HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || "dev-only";

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "[]", "utf8");
}

function readAll() {
  ensureFile();
  try { return JSON.parse(fs.readFileSync(FILE_PATH, "utf8").trim() || "[]"); }
  catch { return []; }
}

function writeAll(items) {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
}

function sign(record) {
  return createHmac("sha256", HMAC_SECRET).update(JSON.stringify(record)).digest("hex");
}

function list() { return readAll(); }

function findById(patientId) {
  return readAll().find((p) => p.patientId === patientId) || null;
}

function create(payload) {
  const now = new Date().toISOString();
  const record = {
    patientId: "PT-" + randomUUID().slice(0, 8).toUpperCase(),
    ...payload,
    registrationDate: now,
    createdAt: now,
    updatedAt: now,
  };
  record.signature = sign(record);
  const items = readAll();
  items.push(record);
  writeAll(items);
  return record;
}

function update(patientId, payload) {
  const items = readAll();
  const idx = items.findIndex((p) => p.patientId === patientId);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...payload, updatedAt: new Date().toISOString() };
  updated.signature = sign({ ...updated, signature: undefined });
  items[idx] = updated;
  writeAll(items);
  return updated;
}

module.exports = { list, findById, create, update };
