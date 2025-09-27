// Automated script to create test_access table using Supabase REST API
// This will attempt to create the table directly

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTableViaRPC() {
  console.log('🚀 Attempting to create test_access table via RPC...');
  
  try {
    // Try to create the table using a custom RPC function
    const { data, error } = await supabase.rpc('create_test_access_table');
    
    if (error) {
      console.log('❌ RPC method not available. Using manual approach...');
      return false;
    }
    
    console.log('✅ Table created successfully via RPC!');
    return true;
    
  } catch (error) {
    console.log('❌ RPC method failed:', error.message);
    return false;
  }
}

async function insertTestData() {
  console.log('📊 Inserting test access data...');
  
  try {
    // First, let's get all users and tests
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');
    
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('id');
    
    if (usersError || testsError) {
      console.log('❌ Could not fetch users or tests:', usersError || testsError);
      return;
    }
    
    console.log(`📋 Found ${users.length} users and ${tests.length} tests`);
    
    // Create test access entries for all user-test combinations
    const testAccessEntries = [];
    for (const user of users) {
      for (const test of tests) {
        testAccessEntries.push({
          user_id: user.id,
          test_id: test.id,
          status: 'locked'
        });
      }
    }
    
    if (testAccessEntries.length > 0) {
      const { error: insertError } = await supabase
        .from('test_access')
        .upsert(testAccessEntries, { onConflict: 'user_id,test_id' });
      
      if (insertError) {
        console.log('❌ Error inserting test access data:', insertError);
      } else {
        console.log(`✅ Inserted ${testAccessEntries.length} test access entries!`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error inserting test data:', error.message);
  }
}

async function main() {
  console.log('🎯 Automated Table Creation Script');
  console.log('=====================================');
  
  // First, check if table exists
  const { data, error } = await supabase
    .from('test_access')
    .select('id')
    .limit(1);
  
  if (!error) {
    console.log('✅ test_access table already exists!');
    await insertTestData();
    return;
  }
  
  console.log('❌ test_access table does not exist.');
  console.log('\n🔧 Since I cannot create tables directly via the API,');
  console.log('   please run the SQL manually in your Supabase dashboard.');
  console.log('\n📝 Copy this SQL and run it in Supabase → SQL Editor:');
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
  
  console.log('\n🎯 After running the SQL:');
  console.log('1. Come back here and run: npm run create-table');
  console.log('2. It will verify the table exists and insert data');
  console.log('3. Then test the approval flow in your app!');
}

main();
