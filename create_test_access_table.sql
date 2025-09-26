-- Create test_access table for PrepPro Application
-- Run this SQL in your Supabase SQL Editor

-- Test Access control table
CREATE TABLE IF NOT EXISTS test_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked', -- locked | requested | approved
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, test_id)
);

-- Enable Row Level Security
ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy to allow public access for anon users
CREATE POLICY "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_test_access_user_test ON test_access(user_id, test_id);

-- Insert some initial test access data (optional - for testing)
-- This will lock all tests for all users by default
INSERT INTO test_access (user_id, test_id, status)
SELECT u.id, t.id, 'locked'
FROM users u
CROSS JOIN tests t
WHERE NOT EXISTS (
    SELECT 1 FROM test_access ta 
    WHERE ta.user_id = u.id AND ta.test_id = t.id
)
ON CONFLICT (user_id, test_id) DO NOTHING;