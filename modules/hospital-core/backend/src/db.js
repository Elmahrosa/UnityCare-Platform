const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.resolve(__dirname, "..", "data", "uch.db");
const SCHEMA_PATH = path.resolve(__dirname, "..", "schema.sql");

function initializeDatabase() {
  const dataDir = path.dirname(DB_PATH);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error(`Schema file not found at ${SCHEMA_PATH}`);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);

  console.log(`✓ Database initialized at ${DB_PATH}`);

  return db;
}

module.exports = {
  initializeDatabase,
};