// Script to apply question soft delete system
// Run this with: node scripts/apply-question-soft-delete.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyQuestionSoftDelete() {
  console.log('🔧 Applying question soft delete system...');
  
  try {
    // Check if the columns already exist
    const { data: existingColumns, error: checkError } = await supabase
      .from('questions')
      .select('deleted, deleted_at')
      .limit(1);
    
    if (!checkError && existingColumns.length > 0) {
      console.log('✅ Question soft delete columns already exist');
      return;
    }
    
    console.log('❌ Question soft delete columns not found. Please run the SQL manually.');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Question Soft Delete System
ALTER TABLE questions ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_deleted ON questions(deleted);

-- Add comments
COMMENT ON COLUMN questions.deleted IS 'Soft delete flag. When TRUE, the question is considered deleted but data is preserved for user history.';
COMMENT ON COLUMN questions.deleted_at IS 'Timestamp when the question was soft deleted.';

-- Update existing questions to have default values
UPDATE questions SET
    deleted = FALSE,
    deleted_at = NULL
WHERE deleted IS NULL;
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Question soft delete will be enabled!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyQuestionSoftDelete();
