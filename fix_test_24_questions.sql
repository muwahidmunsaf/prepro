-- Fix test ID 24 to have 100 questions instead of 44
-- Run this in your Supabase SQL editor

UPDATE tests 
SET total_questions = 100 
WHERE id = 24;

-- Verify the update
SELECT id, title, total_questions, duration 
FROM tests 
WHERE id = 24;
