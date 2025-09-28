-- Add question ordering and categorization system
-- Run this SQL in your Supabase SQL Editor

-- Add category field to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Add position/order field to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;

-- Add difficulty level (optional)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';

-- Create index for better performance when ordering questions
CREATE INDEX IF NOT EXISTS idx_questions_position ON questions(test_id, position);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(test_id, category);

-- Add comments to explain the new fields
COMMENT ON COLUMN questions.category IS 'Question category/topic (e.g., English, Computer, General Knowledge)';
COMMENT ON COLUMN questions.position IS 'Order/position of question in the test (1, 2, 3, etc.)';
COMMENT ON COLUMN questions.difficulty IS 'Question difficulty level (Easy, Medium, Hard)';

-- Update existing questions to have default values
UPDATE questions SET 
    category = 'General',
    position = id,
    difficulty = 'Medium'
WHERE category IS NULL OR position IS NULL OR difficulty IS NULL;
