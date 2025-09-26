-- Complete Database Setup for PrepPro Application
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Tests Table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL, -- Store user answers here
    questions JSONB NOT NULL, -- Store questions snapshot for review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Category Access control
CREATE TABLE IF NOT EXISTS category_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked', -- locked | requested | approved
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, category_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Test Access control
CREATE TABLE IF NOT EXISTS test_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked', -- locked | requested | approved
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, test_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies to allow public access for anon users
-- Allow all for users (adjust for production)
CREATE POLICY IF NOT EXISTS "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for tests" ON tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for test_results" ON test_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on category_access" ON category_access FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tests_category_id ON tests(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_category_access_user_cat ON category_access(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_test_access_user_test ON test_access(user_id, test_id);

-- Insert initial admin user
INSERT INTO users (name, email, password, is_admin) 
VALUES ('Admin', 'admin@preppro.com', 'password', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert initial sample user
INSERT INTO users (name, email, password, is_admin) 
VALUES ('John Doe', 'user@preppro.com', 'password', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Insert initial categories
INSERT INTO categories (name) VALUES ('Programming') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Mathematics') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('General Knowledge') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Computer') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('English') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('PPSC') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('GK') ON CONFLICT (name) DO NOTHING;

-- Insert initial test access data (lock all tests for all users by default)
INSERT INTO test_access (user_id, test_id, status)
SELECT u.id, t.id, 'locked'
FROM users u
CROSS JOIN tests t
WHERE NOT EXISTS (
    SELECT 1 FROM test_access ta 
    WHERE ta.user_id = u.id AND ta.test_id = t.id
)
ON CONFLICT (user_id, test_id) DO NOTHING;
