// Script to apply question ordering and categorization system
// Run this with: node scripts/apply-question-ordering.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyQuestionOrdering() {
  console.log('🔧 Applying question ordering and categorization system...');
  
  try {
    // Check if the new columns already exist
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('category, position, difficulty')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Question ordering columns already exist');
      return;
    }
    
    console.log('❌ Question ordering columns not found. Please run the SQL manually.');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    
    const sql = `
-- Add question ordering and categorization system
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_position ON questions(test_id, position);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(test_id, category);

-- Add comments
COMMENT ON COLUMN questions.category IS 'Question category/topic (e.g., English, Computer, General Knowledge)';
COMMENT ON COLUMN questions.position IS 'Order/position of question in the test (1, 2, 3, etc.)';
COMMENT ON COLUMN questions.difficulty IS 'Question difficulty level (Easy, Medium, Hard)';

-- Update existing questions to have default values
UPDATE questions SET 
    category = 'General',
    position = id,
    difficulty = 'Medium'
WHERE category IS NULL OR position IS NULL OR difficulty IS NULL;
`;
    
    console.log(sql);
    console.log('=' .repeat(80));
    
    console.log('\n🎯 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"');
    console.log('6. Refresh your admin panel to see the new question ordering features!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyQuestionOrdering();
