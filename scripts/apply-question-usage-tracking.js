// Script to apply question usage tracking system
// Run this with: node scripts/apply-question-usage-tracking.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyQuestionUsageTracking() {
  console.log('🔧 Applying question usage tracking system...');
  
  try {
    // Check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('question_usage')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Question usage tracking table already exists');
      return;
    }
    
    console.log('❌ Question usage tracking table not found. Please run the SQL manually.');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Question Usage Tracking System
CREATE TABLE IF NOT EXISTS question_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, question_id, test_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_usage_user_test ON question_usage(user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_question_usage_subject ON question_usage(user_id, test_id, subject_name);
CREATE INDEX IF NOT EXISTS idx_question_usage_used_at ON question_usage(used_at);

-- Add comments
COMMENT ON TABLE question_usage IS 'Tracks which questions each user has seen in each test to enable smart rotation';
COMMENT ON COLUMN question_usage.user_id IS 'User who used the question';
COMMENT ON COLUMN question_usage.question_id IS 'Question that was used';
COMMENT ON COLUMN question_usage.test_id IS 'Test where the question was used';
COMMENT ON COLUMN question_usage.subject_name IS 'Subject of the question for rotation tracking';
COMMENT ON COLUMN question_usage.used_at IS 'When the question was last used by this user';
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Smart question rotation will be enabled!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyQuestionUsageTracking();
