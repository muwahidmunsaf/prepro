// Script to create test_access table in Supabase
// Run this with: npm run create-table

import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAccessTable() {
  console.log('🚀 Creating test_access table...');
  
  try {
    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('test_access')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ test_access table already exists!');
      return;
    }
    
    console.log('❌ test_access table does not exist.');
    console.log('\n📝 Please run this SQL in your Supabase Dashboard → SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Create test_access table
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
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Quick Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Test the approval flow!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestAccessTable();
