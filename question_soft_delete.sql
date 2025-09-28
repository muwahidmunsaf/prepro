-- Question Soft Delete System
-- Run this SQL in your Supabase SQL Editor

-- Add soft delete columns to questions table
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
