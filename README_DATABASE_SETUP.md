# Database Setup for PrepPro

## Issue
The test access functionality is not working because the `test_access` table doesn't exist in your Supabase database. The category access works because that table exists, but the test access table is missing.

## Solution
You need to run the SQL script in your Supabase database to create the missing table.

## Steps to Fix

### 1. Go to Supabase Dashboard
- Open your Supabase project dashboard
- Go to the SQL Editor

### 2. Run the SQL Script
Copy and paste this SQL code into the SQL Editor and run it:

```sql
-- Create test_access table for PrepPro Application
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

-- Insert initial test access data (lock all tests for all users by default)
INSERT INTO test_access (user_id, test_id, status)
SELECT u.id, t.id, 'locked'
FROM users u
CROSS JOIN tests t
WHERE NOT EXISTS (
    SELECT 1 FROM test_access ta 
    WHERE ta.user_id = u.id AND ta.test_id = t.id
)
ON CONFLICT (user_id, test_id) DO NOTHING;
```

### 3. Verify the Table
After running the SQL, you should see:
- A new `test_access` table in your database
- All existing tests will be locked for all users by default
- The test access functionality will work properly

### 4. Test the Functionality
- Go to Admin Panel → Users → Category Access for any user
- Expand a category to see tests
- Try toggling test access (Lock/Unlock)
- The success message should no longer mention localStorage

## Alternative: Complete Database Reset
If you want to start fresh with all tables properly set up, you can run the `complete_database_setup.sql` file instead, which creates all tables from scratch.

## Files Created
- `create_test_access_table.sql` - Just the test_access table
- `complete_database_setup.sql` - All tables with sample data
- `README_DATABASE_SETUP.md` - This instruction file
