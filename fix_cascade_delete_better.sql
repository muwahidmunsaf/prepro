-- Better solution: Add a 'deleted' flag to tests instead of actually deleting them
-- This preserves all relationships and user data

-- Add a 'deleted' column to the tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add a 'deleted_at' timestamp for audit purposes
ALTER TABLE tests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create an index for better performance when filtering out deleted tests
CREATE INDEX IF NOT EXISTS idx_tests_deleted ON tests(deleted);

-- Add a comment to explain the soft delete approach
COMMENT ON COLUMN tests.deleted IS 'Soft delete flag. When TRUE, the test is considered deleted but data is preserved for user history.';
COMMENT ON COLUMN tests.deleted_at IS 'Timestamp when the test was soft deleted.';

-- Update the existing foreign key constraint to prevent cascade delete
-- This ensures test results are never deleted when tests are "deleted"
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_test_id_fkey;
ALTER TABLE test_results 
ADD CONSTRAINT test_results_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE RESTRICT;
