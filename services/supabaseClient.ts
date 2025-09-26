import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkugvrvydpmgumnlrnbs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Schema Helper - Create tables on first setup
export async function initializeDatabase() {
  // We'll create the tables programmatically to ensure they exist
  // Note: The actual table creation will be done via Supabase dashboard or SQL
  console.log('Initializing database schema...')
  
  // Return supabase client for use in operations
  return supabase
}
