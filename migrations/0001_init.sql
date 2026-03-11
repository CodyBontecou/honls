-- Users table (for NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER,
  image TEXT,
  password TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Accounts table (for NextAuth OAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);

-- Sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

-- Verification tokens (for NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  min_age INTEGER,
  max_age INTEGER,
  sort_order INTEGER DEFAULT 0
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  division_id TEXT NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  date_of_birth TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  status TEXT DEFAULT 'pending'
);

-- Seed divisions
INSERT INTO divisions (id, name, slug, description, min_age, max_age, sort_order) VALUES
  ('28252d84-9760-4ea4-8c89-519ca2d39648', 'Under 12', 'u12', 'Young groms 11 years and under showing the future of bodyboarding', NULL, 11, 1),
  ('6a141a54-7f73-4527-8cbc-609ed7ed007d', 'Under 18', 'u18', 'Junior division for competitors 12-17 years old', 12, 17, 2),
  ('eb60995d-5951-41b3-b913-6c7d3c2f01d0', 'Adult Prone', 'adult', 'Open division for all adults 18+', 18, NULL, 3),
  ('b0e04128-a5d6-4fcf-bcb5-86d4e1d7e140', 'Drop Knee', 'dropknee', 'DK specialists riding with one knee up', NULL, NULL, 4),
  ('5e459855-5c5f-48c4-8473-ccb1f9d1d49f', 'Stand Up', 'standup', 'Full stand-up bodyboarding division', NULL, NULL, 5);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_division_id ON registrations(division_id);
