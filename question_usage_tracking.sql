-- Question Usage Tracking System
-- Run this SQL in your Supabase SQL Editor

-- Create table to track which questions each user has seen
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
