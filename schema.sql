-- Run this once in Cloudflare dashboard: Workers & Pages > D1 > your
-- database > Console tab. Paste this whole file and click "Execute".
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('available', 'needed')),
  medicine TEXT NOT NULL,
  strength TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  expiry TEXT,
  pharmacy_name TEXT NOT NULL,
  region TEXT NOT NULL,
  contact_whatsapp TEXT,
  contact_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
