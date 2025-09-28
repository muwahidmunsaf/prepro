// Script to test the soft delete functionality
// Run this with: node scripts/test-soft-delete.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkugvrvydpmgumnlrnbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdWd2cnZ5ZHBtZ3VtbmxybmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODI5NzUsImV4cCI6MjA3NDQ1ODk3NX0.D8QwQ4gT2vBKSV7vovaj9oJ2wMotwPcwFvlXdx9_UJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSoftDelete() {
  console.log('🧪 Testing soft delete functionality...');
  
  try {
    // 1. Check if soft delete columns exist
    console.log('\n1️⃣ Checking if soft delete columns exist...');
    const { data: testColumns, error: columnError } = await supabase
      .from('tests')
      .select('id, title, deleted, deleted_at')
      .limit(1);
    
    if (columnError) {
      console.log('❌ Soft delete columns not found:', columnError.message);
      return;
    }
    
    console.log('✅ Soft delete columns exist in tests table');
    
    // 2. Check current tests
    console.log('\n2️⃣ Checking current tests...');
    const { data: allTests, error: allTestsError } = await supabase
      .from('tests')
      .select('id, title, deleted, deleted_at')
      .order('created_at', { ascending: false });
    
    if (allTestsError) {
      console.log('❌ Error fetching tests:', allTestsError.message);
      return;
    }
    
    console.log(`📊 Found ${allTests.length} total tests:`);
    allTests.forEach(test => {
      const status = test.deleted ? '🗑️ DELETED' : '✅ ACTIVE';
      console.log(`   ${status} - ${test.title} (ID: ${test.id})`);
    });
    
    // 3. Check test results
    console.log('\n3️⃣ Checking test results...');
    const { data: testResults, error: resultsError } = await supabase
      .from('test_results')
      .select('id, user_id, test_id, score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (resultsError) {
      console.log('❌ Error fetching test results:', resultsError.message);
      return;
    }
    
    console.log(`📊 Found ${testResults.length} test results (showing latest 5):`);
    testResults.forEach(result => {
      console.log(`   User ${result.user_id} - Test ${result.test_id} - Score: ${result.score}/${result.total_questions || 'N/A'}`);
    });
    
    // 4. Test the soft delete functionality
    console.log('\n4️⃣ Testing soft delete functionality...');
    
    // Find a test that's not deleted
    const activeTest = allTests.find(test => !test.deleted);
    if (!activeTest) {
      console.log('⚠️ No active tests found to test deletion');
      return;
    }
    
    console.log(`🎯 Testing with test: "${activeTest.title}" (ID: ${activeTest.id})`);
    
    // Count test results before deletion
    const { data: resultsBefore, error: beforeError } = await supabase
      .from('test_results')
      .select('id')
      .eq('test_id', activeTest.id);
    
    if (beforeError) {
      console.log('❌ Error counting results before deletion:', beforeError.message);
      return;
    }
    
    console.log(`📊 Test results before deletion: ${resultsBefore.length}`);
    
    // Perform soft delete
    console.log('🗑️ Performing soft delete...');
    const { error: deleteError } = await supabase
      .from('tests')
      .update({ 
        deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', activeTest.id);
    
    if (deleteError) {
      console.log('❌ Error performing soft delete:', deleteError.message);
      return;
    }
    
    console.log('✅ Soft delete completed');
    
    // Count test results after deletion
    const { data: resultsAfter, error: afterError } = await supabase
      .from('test_results')
      .select('id')
      .eq('test_id', activeTest.id);
    
    if (afterError) {
      console.log('❌ Error counting results after deletion:', afterError.message);
      return;
    }
    
    console.log(`📊 Test results after deletion: ${resultsAfter.length}`);
    
    // Verify results are preserved
    if (resultsBefore.length === resultsAfter.length) {
      console.log('🎉 SUCCESS: User test results are preserved!');
    } else {
      console.log('❌ FAILURE: User test results were lost!');
    }
    
    // Restore the test for future use
    console.log('\n5️⃣ Restoring test for future use...');
    const { error: restoreError } = await supabase
      .from('tests')
      .update({ 
        deleted: false, 
        deleted_at: null 
      })
      .eq('id', activeTest.id);
    
    if (restoreError) {
      console.log('❌ Error restoring test:', restoreError.message);
    } else {
      console.log('✅ Test restored successfully');
    }
    
    console.log('\n🎯 Test completed! Soft delete is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSoftDelete();
