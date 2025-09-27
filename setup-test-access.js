// Script to create test_access table in Supabase
// Run this with: node setup-test-access.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration (from supabaseClient.ts)
const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAccessTable() {
  console.log('🚀 Starting test_access table creation...');
  
  try {
    // First, let's check if the table already exists
    console.log('📋 Checking if test_access table exists...');
    const { data: existingTable, error: checkError } = await supabase
      .from('test_access')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ test_access table already exists!');
      return;
    }
    
    console.log('❌ test_access table does not exist. Creating it...');
    
    // Since we can't create tables directly with the client,
    // we'll provide the SQL that needs to be run in Supabase dashboard
    console.log('\n📝 Please run this SQL in your Supabase Dashboard → SQL Editor:');
    console.log('=' .repeat(80));
    console.log(`
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
`);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Come back and test the approval flow!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
createTestAccessTable();
