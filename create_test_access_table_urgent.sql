-- URGENT: Create test_access table in Supabase
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create the missing test_access table
CREATE TABLE IF NOT EXISTS test_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, test_id)
);

-- Enable Row Level Security
ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_test_access_user_test ON test_access(user_id, test_id);

-- Insert default locked status for all users and tests
INSERT INTO test_access (user_id, test_id, status)
SELECT u.id, t.id, 'locked'
FROM users u
CROSS JOIN tests t
ON CONFLICT (user_id, test_id) DO NOTHING;
