// Script to fix question test association
// This script will help identify and fix questions that are not properly associated with the correct test ID

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestionAssociation() {
  console.log('🔍 Checking question associations...');
  
  // Check all questions for the "computer" subject
  const { data: computerQuestions, error: computerError } = await supabase
    .from('questions')
    .select('id, test_id, subject, question_text')
    .eq('subject', 'computer')
    .eq('deleted', false);
  
  if (computerError) {
    console.error('Error fetching computer questions:', computerError);
    return;
  }
  
  console.log(`📊 Found ${computerQuestions.length} questions with subject "computer"`);
  
  // Group by test_id
  const questionsByTest = computerQuestions.reduce((acc, q) => {
    const testId = q.test_id;
    if (!acc[testId]) {
      acc[testId] = [];
    }
    acc[testId].push(q);
    return acc;
  }, {});
  
  console.log('📋 Questions grouped by test_id:');
  Object.entries(questionsByTest).forEach(([testId, questions]) => {
    console.log(`  Test ID ${testId}: ${questions.length} questions`);
  });
  
  // Check what test ID 25 should be
  const { data: test25, error: testError } = await supabase
    .from('tests')
    .select('id, title, total_questions')
    .eq('id', 25);
  
  if (testError) {
    console.error('Error fetching test 25:', testError);
    return;
  }
  
  if (test25 && test25.length > 0) {
    console.log(`✅ Test 25: "${test25[0].title}" (${test25[0].total_questions} questions)`);
  } else {
    console.log('❌ Test 25 not found');
  }
  
  // Check if there are questions for test 25
  const questionsForTest25 = questionsByTest['25'] || [];
  console.log(`📝 Questions currently associated with test 25: ${questionsForTest25.length}`);
  
  // Find the test with the most computer questions
  const testWithMostQuestions = Object.entries(questionsByTest)
    .sort(([,a], [,b]) => b.length - a.length)[0];
  
  if (testWithMostQuestions) {
    const [testId, questions] = testWithMostQuestions;
    console.log(`🎯 Test ${testId} has the most computer questions: ${questions.length}`);
    
    if (testId !== '25' && questions.length > 100) {
      console.log(`⚠️  This might be the issue! Questions are associated with test ${testId} instead of test 25`);
      console.log('💡 You may need to update the test_id for these questions');
    }
  }
}

async function fixQuestionAssociation(targetTestId = 25) {
  console.log(`🔧 Fixing question associations for test ${targetTestId}...`);
  
  // Find all computer questions not associated with the target test
  const { data: computerQuestions, error: computerError } = await supabase
    .from('questions')
    .select('id, test_id, subject')
    .eq('subject', 'computer')
    .neq('test_id', targetTestId)
    .eq('deleted', false);
  
  if (computerError) {
    console.error('Error fetching computer questions:', computerError);
    return;
  }
  
  if (computerQuestions.length === 0) {
    console.log('✅ All computer questions are already associated with the correct test');
    return;
  }
  
  console.log(`📝 Found ${computerQuestions.length} computer questions not associated with test ${targetTestId}`);
  
  // Update the test_id for these questions
  const questionIds = computerQuestions.map(q => q.id);
  
  const { error: updateError } = await supabase
    .from('questions')
    .update({ test_id: targetTestId })
    .in('id', questionIds);
  
  if (updateError) {
    console.error('Error updating questions:', updateError);
    return;
  }
  
  console.log(`✅ Successfully updated ${questionIds.length} questions to be associated with test ${targetTestId}`);
  
  // Verify the update
  const { data: updatedQuestions, error: verifyError } = await supabase
    .from('questions')
    .select('id, test_id, subject')
    .eq('subject', 'computer')
    .eq('test_id', targetTestId)
    .eq('deleted', false);
  
  if (verifyError) {
    console.error('Error verifying update:', verifyError);
    return;
  }
  
  console.log(`✅ Verification: ${updatedQuestions.length} computer questions are now associated with test ${targetTestId}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting question association check...\n');
  
  await checkQuestionAssociation();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Uncomment the line below to automatically fix the associations
  // await fixQuestionAssociation(25);
  
  console.log('\n💡 To fix the associations, uncomment the fixQuestionAssociation(25) line and run again');
}

main().catch(console.error);
