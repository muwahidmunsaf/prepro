-- Complete SQL script to create test_access table
-- Run this in your Supabase SQL Editor

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS test_access CASCADE;

-- Create the test_access table
CREATE TABLE test_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'requested', 'approved')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, test_id)
);

-- Enable Row Level Security
ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations (adjust for production)
CREATE POLICY "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_test_access_user_test ON test_access(user_id, test_id);
CREATE INDEX idx_test_access_status ON test_access(status);

-- Insert some sample data (optional)
-- INSERT INTO test_access (user_id, test_id, status) VALUES 
-- (1, 1, 'approved'),
-- (2, 1, 'locked'),
-- (1, 2, 'locked');

-- Verify the table was created
SELECT * FROM test_access LIMIT 5;
