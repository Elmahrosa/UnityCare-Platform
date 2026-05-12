const { randomUUID } = require("crypto");

let db = null;

function setDatabase(database) {
  db = database;
}

function requireDatabase() {
  if (!db) {
    throw new Error("Database not initialized for NDA store");
  }
}

function create(payload) {
  requireDatabase();

  const now = new Date().toISOString();
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO nda_requests (
      id,
      full_name,
      email,
      organization,
      message,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    payload.contactName || "",
    payload.email || "",
    payload.organizationName || "",
    payload.useCase || "",
    "pending",
    now,
    now
  );

  return {
    id,
    contactName: payload.contactName || "",
    email: payload.email || "",
    organizationName: payload.organizationName || "",
    useCase: payload.useCase || "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

function list() {
  requireDatabase();

  const rows = db
    .prepare("SELECT * FROM nda_requests ORDER BY created_at DESC")
    .all();

  return rows.map((row) => ({
    id: row.id,
    contactName: row.full_name,
    email: row.email,
    organizationName: row.organization,
    useCase: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function updateStatus(id, status) {
  requireDatabase();

  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM nda_requests WHERE id = ?")
    .get(id);

  if (!existing) return null;

  db.prepare(
    "UPDATE nda_requests SET status = ?, updated_at = ? WHERE id = ?"
  ).run(status, now, id);

  const updated = db
    .prepare("SELECT * FROM nda_requests WHERE id = ?")
    .get(id);

  return {
    id: updated.id,
    contactName: updated.full_name,
    email: updated.email,
    organizationName: updated.organization,
    useCase: updated.message,
    status: updated.status,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

module.exports = {
  setDatabase,
  create,
  list,
  updateStatus,
};