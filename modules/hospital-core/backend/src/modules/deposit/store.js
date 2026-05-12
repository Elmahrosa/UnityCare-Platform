const { randomUUID } = require("crypto");

let db = null;

function setDatabase(database) {
  db = database;
}

function requireDatabase() {
  if (!db) {
    throw new Error("Database not initialized for deposit store");
  }
}

function createDeposit(payload = {}) {
  requireDatabase();

  const now = new Date().toISOString();
  const depositId = randomUUID();

  db.prepare(`
    INSERT INTO deposits (
      id,
      requester_email,
      amount,
      currency,
      status,
      reference,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    depositId,
    payload.email || "",
    5000,
    "USD",
    "pending",
    null,
    now,
    now
  );

  return {
    depositId,
    email: payload.email || "",
    amount: 5000,
    currency: "USD",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

function listDeposits() {
  requireDatabase();

  const rows = db
    .prepare("SELECT * FROM deposits ORDER BY created_at DESC")
    .all();

  return rows.map((row) => ({
    depositId: row.id,
    email: row.requester_email,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reference: row.reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function markPaid(depositId, reference) {
  requireDatabase();

  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM deposits WHERE id = ?")
    .get(depositId);

  if (!existing) return null;

  db.prepare(
    "UPDATE deposits SET status = ?, reference = ?, updated_at = ? WHERE id = ?"
  ).run("paid", reference || null, now, depositId);

  const updated = db
    .prepare("SELECT * FROM deposits WHERE id = ?")
    .get(depositId);

  return {
    depositId: updated.id,
    email: updated.requester_email,
    amount: updated.amount,
    currency: updated.currency,
    status: updated.status,
    reference: updated.reference,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

module.exports = {
  setDatabase,
  createDeposit,
  listDeposits,
  markPaid,
};