const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjQ4NzEsImV4cCI6MjA1MDkwMDg3MX0.8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8Qj8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAccessTable() {
  try {
    console.log('Creating test_access table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS test_access (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'locked',
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(user_id, test_id)
        );
        
        ALTER TABLE test_access ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow all operations on test_access" ON test_access FOR ALL USING (true) WITH CHECK (true);
        
        CREATE INDEX IF NOT EXISTS idx_test_access_user_test ON test_access(user_id, test_id);
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    
    console.log('✅ test_access table created successfully!');
    
    // Insert default data
    console.log('Inserting default test access data...');
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO test_access (user_id, test_id, status)
        SELECT u.id, t.id, 'locked'
        FROM users u
        CROSS JOIN tests t
        ON CONFLICT (user_id, test_id) DO NOTHING;
      `
    });
    
    if (insertError) {
      console.error('Error inserting data:', insertError);
    } else {
      console.log('✅ Default test access data inserted!');
    }
    
  } catch (error) {
    console.error('Failed to create table:', error);
  }
}

createTestAccessTable();
