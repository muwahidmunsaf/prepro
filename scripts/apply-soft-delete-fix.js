// Script to apply the soft delete fix to the database
// Run this with: node scripts/apply-soft-delete-fix.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySoftDeleteFix() {
  console.log('🔧 Applying soft delete fix to preserve user test results...');
  
  try {
    // Check if the deleted column already exists
    const { data: existingTests, error: checkError } = await supabase
      .from('tests')
      .select('deleted')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Soft delete columns already exist in tests table');
      return;
    }
    
    console.log('❌ Soft delete columns not found. Please run the SQL manually.');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Add soft delete columns to tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tests_deleted ON tests(deleted);

-- Update foreign key constraint to prevent cascade delete
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_test_id_fkey;
ALTER TABLE test_results 
ADD CONSTRAINT test_results_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE RESTRICT;

-- Add comments
COMMENT ON COLUMN tests.deleted IS 'Soft delete flag. When TRUE, the test is considered deleted but data is preserved for user history.';
COMMENT ON COLUMN tests.deleted_at IS 'Timestamp when the test was soft deleted.';
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Test deleting a test - user results should be preserved!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applySoftDeleteFix();
