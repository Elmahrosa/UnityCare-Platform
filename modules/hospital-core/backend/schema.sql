-- UCH Sovereign Core Database Schema
-- SQLite3 compatible

CREATE TABLE IF NOT EXISTS nda_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  requester_email TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_nda_email ON nda_requests(email);
CREATE INDEX IF NOT EXISTS idx_nda_status ON nda_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposits_email ON deposits(requester_email);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
