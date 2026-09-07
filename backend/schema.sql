-- Schema for CyberVault Password Manager & Financial System

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  master_password_hash VARCHAR(255) NOT NULL,
  encryption_salt VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: add encryption_salt to installations created before it existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS encryption_salt VARCHAR(64);

CREATE TABLE IF NOT EXISTS vault_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'PASSWORD', 'BANK_ACCOUNT', 'CARD', 'NOTE'
  title VARCHAR(255) NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  account_holder VARCHAR(255),
  pin VARCHAR(255),
  username VARCHAR(255),
  password_encrypted TEXT,
  website_url TEXT,
  card_number VARCHAR(100),
  card_expiry VARCHAR(20),
  card_cvv VARCHAR(20),
  notes_encrypted TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'NOTE',
  amount DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_assets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_type VARCHAR(50) NOT NULL, -- 'LIQUID', 'LOCKED', 'PHYSICAL_RECEIVABLE'
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) DEFAULT 0,
  sub_category VARCHAR(100),
  note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  total_net_worth_excl DECIMAL(15, 2) DEFAULT 0,
  total_net_worth_incl DECIMAL(15, 2) DEFAULT 0,
  total_liquid DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_snapshot_items (
  id SERIAL PRIMARY KEY,
  snapshot_id INTEGER REFERENCES financial_snapshots(id) ON DELETE CASCADE,
  category_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) DEFAULT 0,
  sub_category VARCHAR(100),
  note TEXT
);
