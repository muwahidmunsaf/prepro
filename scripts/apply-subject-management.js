// Script to apply subject management system
// Run this with: node scripts/apply-subject-management.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySubjectManagement() {
  console.log('🔧 Applying subject management system...');
  
  try {
    // Check if the new columns already exist
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('subject, position, difficulty')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Subject management columns already exist');
      return;
    }
    
    console.log('❌ Subject management columns not found. Please run the SQL manually.');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Question Subject Management System
ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';

-- Create test subjects configuration table
CREATE TABLE IF NOT EXISTS test_subjects (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(test_id, subject_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(test_id, subject);
CREATE INDEX IF NOT EXISTS idx_questions_position ON questions(test_id, position);
CREATE INDEX IF NOT EXISTS idx_test_subjects_order ON test_subjects(test_id, display_order);

-- Add comments
COMMENT ON COLUMN questions.subject IS 'Subject/category of the question (e.g., English, Computer, General Knowledge)';
COMMENT ON COLUMN questions.position IS 'Order/position of question within its subject (1, 2, 3, etc.)';
COMMENT ON COLUMN questions.difficulty IS 'Question difficulty level (Easy, Medium, Hard)';
COMMENT ON TABLE test_subjects IS 'Configuration for subjects in each test with question counts and display order';

-- Update existing questions to have default values
UPDATE questions SET 
    subject = 'General',
    position = id,
    difficulty = 'Medium'
WHERE subject IS NULL OR position IS NULL OR difficulty IS NULL;
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Refresh your admin panel to see the new subject management features!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applySubjectManagement();
