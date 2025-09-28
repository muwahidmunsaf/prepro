-- Fix cascade delete issue to preserve user test results
-- Run this SQL in your Supabase SQL Editor

-- First, drop the existing foreign key constraint
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_test_id_fkey;

-- Add the foreign key constraint back without CASCADE
-- This will preserve test results even when tests are deleted
ALTER TABLE test_results 
ADD CONSTRAINT test_results_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL;

-- However, since test_id is NOT NULL, we need to change it to allow NULL
-- This way, if a test is deleted, the test_id becomes NULL but the result is preserved
ALTER TABLE test_results ALTER COLUMN test_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN test_results.test_id IS 'References the test that was taken. Can be NULL if the original test was deleted but we want to preserve the user''s performance record.';
