-- Fix for test_access table
-- Run this in your Supabase SQL Editor

-- Check if test_access table exists, if not create it
CREATE TABLE IF NOT EXISTS test_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked', -- locked | requested | approved
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, test_id)
);

-- Enable RLS
ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY IF NOT EXISTS "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_test_access_user_test ON test_access(user_id, test_id);
