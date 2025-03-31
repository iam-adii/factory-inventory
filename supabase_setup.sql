-- SQL script to create tables for the inventory management system

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  threshold NUMERIC NOT NULL DEFAULT 0,
  bill_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Batch materials (junction table between batches and materials)
CREATE TABLE IF NOT EXISTS batch_materials (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, material_id)
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  username TEXT NOT NULL, -- Changed from 'user' to 'username' as 'user' is a reserved keyword
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(key, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_current_stock ON materials(current_stock);
CREATE INDEX IF NOT EXISTS idx_materials_threshold ON materials(threshold);

CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product);
CREATE INDEX IF NOT EXISTS idx_batches_date ON batches(date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

CREATE INDEX IF NOT EXISTS idx_batch_materials_batch_id ON batch_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_materials_material_id ON batch_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_material_id ON usage_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date);
CREATE INDEX IF NOT EXISTS idx_usage_logs_username ON usage_logs(username); -- Changed from 'user' to 'username'
CREATE INDEX IF NOT EXISTS idx_usage_logs_batch_id ON usage_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);