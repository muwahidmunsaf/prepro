-- Question Subject Management System
-- Run this SQL in your Supabase SQL Editor

-- Add subject field to questions table
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
