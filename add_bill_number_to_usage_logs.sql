-- Add bill_number column to usage_logs table
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS bill_number TEXT;

-- Create an index for the new column
CREATE INDEX IF NOT EXISTS idx_usage_logs_bill_number ON usage_logs(bill_number);