import { supabase } from './supabaseClient';
import type { User, Category, Test, Question, TestResult, AppState } from '../types';
import type { CategoryAccess, TestAccess } from '../types';

// User Management
export async function signUpUser(userData: Omit<User, 'id'>) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      name: userData.name,
      email: userData.email,
      password: userData.password,
      is_admin: userData.isAdmin
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function signInUser(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) return null;

  return {
    id: data.id.toString(),
    name: data.name,
    email: data.email,
    password: data.password,
    isAdmin: data.is_admin
  };
}

// Admin: Users Management
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(u => ({
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    password: u.password,
    isAdmin: u.is_admin,
  }));
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name: user.name, email: user.email, password: user.password, is_admin: user.isAdmin }])
    .select()
    .single();
  if (error) throw error;
  return { id: data.id.toString(), name: data.name, email: data.email, password: data.password, isAdmin: data.is_admin };
}

export async function updateUser(user: User): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ name: user.name, email: user.email, password: user.password, is_admin: user.isAdmin })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return { id: data.id.toString(), name: data.name, email: data.email, password: data.password, isAdmin: data.is_admin };
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

// Notifications
export interface NotificationRow { id: string; user_id: string; title: string; message: string; is_read: boolean; created_at: string }
export async function fetchNotifications(userId?: string): Promise<NotificationRow[]> {
  const query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
  const { data, error } = userId ? await query.eq('user_id', userId) : await query;
  if (error) throw error;
  return (data || []).map(n => ({ id: n.id.toString(), user_id: n.user_id.toString(), title: n.title, message: n.message, is_read: !!n.is_read, created_at: n.created_at }));
}

export async function createNotification(userId: string, title: string, message: string): Promise<void> {
  const { error } = await supabase.from('notifications').insert([{ user_id: parseInt(userId), title, message }]);
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids.map(id=> parseInt(id)));
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.session.user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id.toString(),
    name: data.name,
    email: data.email,
    password: data.password,
    isAdmin: data.is_admin
  };
}

// Categories Management
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(cat => ({
    id: cat.id.toString(),
    name: cat.name
  }));
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: category.name }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    name: data.name
  };
}

export async function updateCategory(category: Category): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: category.name })
    .eq('id', category.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    name: data.name
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Tests Management
export async function fetchTests(): Promise<Test[]> {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('deleted', false) // Only fetch non-deleted tests
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(test => ({
    id: test.id.toString(),
    categoryId: test.category_id.toString(),
    title: test.title,
    duration: test.duration,
    totalQuestions: test.total_questions
  }));
}

export async function createTest(testData: Omit<Test, 'id'>): Promise<Test> {
  const { data, error } = await supabase
    .from('tests')
    .insert([{
      category_id: parseInt(testData.categoryId),
      title: testData.title,
      duration: testData.duration,
      total_questions: testData.totalQuestions
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    categoryId: data.category_id.toString(),
    title: data.title,
    duration: data.duration,
    totalQuestions: data.total_questions
  };
}

export async function updateTest(test: Test): Promise<Test> {
  const { data, error } = await supabase
    .from('tests')
    .update({
      category_id: parseInt(test.categoryId),
      title: test.title,
      duration: test.duration,
      total_questions: test.totalQuestions
    })
    .eq('id', test.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    categoryId: data.category_id.toString(),
    title: data.title,
    duration: data.duration,
    totalQuestions: data.total_questions
  };
}

export async function deleteTest(id: string): Promise<void> {
  // Use soft delete to preserve user test results and performance data
  const { error } = await supabase
    .from('tests')
    .update({ 
      deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw error;
}

// Questions Management
export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(q => ({
    id: q.id.toString(),
    testId: q.test_id.toString(),
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer,
    subject: q.subject || 'General',
    position: q.position || 1,
    difficulty: q.difficulty || 'Medium'
  }));
}

export async function fetchQuestionsByTestId(testId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('position', { ascending: true });

  if (error) throw error;

  return data.map(q => ({
    id: q.id.toString(),
    testId: q.test_id.toString(),
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer,
    subject: q.subject || 'General',
    position: q.position || 1,
    difficulty: q.difficulty || 'Medium'
  }));
}

export async function createQuestion(question: Omit<Question, 'id'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert([{
      test_id: parseInt(question.testId),
      question_text: question.questionText,
      options: question.options,
      correct_answer: question.correctAnswer,
      subject: question.subject || 'General',
      position: question.position || 1,
      difficulty: question.difficulty || 'Medium'
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    testId: data.test_id.toString(),
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer,
    category: data.category || 'General',
    position: data.position || 1,
    difficulty: data.difficulty || 'Medium'
  };
}

export async function updateQuestion(question: Question): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update({
      question_text: question.questionText,
      options: question.options,
      correct_answer: question.correctAnswer,
      subject: question.subject || 'General',
      position: question.position || 1,
      difficulty: question.difficulty || 'Medium'
    })
    .eq('id', question.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    testId: data.test_id.toString(),
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer,
    category: data.category || 'General',
    position: data.position || 1,
    difficulty: data.difficulty || 'Medium'
  };
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createMultipleQuestions(questions: Omit<Question, 'id'>[]): Promise<Question[]> {
  const questionsArray = questions.map(q => ({
    test_id: parseInt(q.testId),
    question_text: q.questionText,
    options: q.options,
    correct_answer: q.correctAnswer
  }));

  const { data, error } = await supabase
    .from('questions')
    .insert(questionsArray)
    .select();

  if (error) throw error;

  return data.map(q => ({
    id: q.id.toString(),
    testId: q.test_id.toString(),
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer
  }));
}

// Results Management
export async function fetchResults(): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(result => ({
    id: result.id.toString(),
    userId: result.user_id.toString(),
    testId: result.test_id.toString(),
    score: result.score,
    totalQuestions: result.total_questions,
    answers: result.answers,
    questions: result.questions || [],
    date: result.created_at
  }));
}

export async function createResult(result: Omit<TestResult, 'id'>): Promise<TestResult> {
  const { data, error } = await supabase
    .from('test_results')
    .insert([{
      user_id: parseInt(result.userId),
      test_id: parseInt(result.testId),
      score: result.score,
      total_questions: result.totalQuestions,
      answers: result.answers,
      questions: result.questions
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    userId: data.user_id.toString(),
    testId: data.test_id.toString(),
    score: data.score,
    totalQuestions: data.total_questions,
    answers: data.answers,
    questions: data.questions || [],
    date: data.created_at
  };
}

export async function fetchResultsByUserId(userId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(result => ({
    id: result.id.toString(),
    userId: result.user_id.toString(),
    testId: result.test_id.toString(),
    score: result.score,
    totalQuestions: result.total_questions,
    answers: result.answers,
    questions: result.questions || [],
    date: result.created_at
  }));
}

// Category Access (Lock/Request/Approve)
export async function fetchCategoryAccess(): Promise<CategoryAccess[]> {
  const { data, error } = await supabase.from('category_access').select('*');
  if (error) throw error;
  return (data || []).map(a => ({ id: a.id.toString(), userId: a.user_id.toString(), categoryId: a.category_id.toString(), status: a.status, updatedAt: a.updated_at }));
}

export async function upsertCategoryAccess(userId: string, categoryId: string, status: CategoryAccess['status']): Promise<CategoryAccess> {
  const { data, error } = await supabase
    .from('category_access')
    .upsert({ user_id: parseInt(userId), category_id: parseInt(categoryId), status }, { onConflict: 'user_id,category_id' })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id.toString(), userId: data.user_id.toString(), categoryId: data.category_id.toString(), status: data.status, updatedAt: data.updated_at };
}

// DATABASE-ONLY TEST ACCESS MANAGEMENT
export async function fetchTestAccess(): Promise<TestAccess[]> {
  try {
    const { data, error } = await supabase.from('test_access').select('*');
    if (error) {
      console.error('Error fetching test access:', error);
      throw error;
    }
    
    const result = (data || []).map(a => ({ 
      id: a.id.toString(), 
      userId: a.user_id.toString(), 
      testId: a.test_id.toString(), 
      status: a.status, 
      updatedAt: a.updated_at 
    }));
    
    return result;
  } catch (error) {
    console.error('Failed to fetch test access:', error);
    // Return empty array if database fails
    return [];
  }
}

export async function upsertTestAccess(userId: string, testId: string, status: TestAccess['status']): Promise<TestAccess> {
  try {
    const { data, error } = await supabase
      .from('test_access')
      .upsert({ 
        user_id: parseInt(userId), 
        test_id: parseInt(testId), 
        status 
      }, { 
        onConflict: 'user_id,test_id' 
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting test access:', error);
      throw error;
    }
    
    const result = { 
      id: data.id.toString(), 
      userId: data.user_id.toString(), 
      testId: data.test_id.toString(), 
      status: data.status, 
      updatedAt: data.updated_at 
    };
    
    return result;
  } catch (error) {
    console.error('Failed to upsert test access:', error);
    throw error;
  }
}

// Question Count by Subject
export async function fetchQuestionCountBySubject(testId: string, subjectName: string): Promise<number> {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('test_id', testId)
    .eq('subject', subjectName);

  if (error) throw error;
  return count || 0;
}

// Question Usage Tracking
export async function trackQuestionUsage(userId: string, questionId: string, testId: string, subjectName: string): Promise<void> {
  const { error } = await supabase
    .from('question_usage')
    .upsert({
      user_id: parseInt(userId),
      question_id: parseInt(questionId),
      test_id: parseInt(testId),
      subject_name: subjectName,
      used_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,question_id,test_id'
    });

  if (error) throw error;
}

export async function getUsedQuestionIds(userId: string, testId: string, subjectName: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('question_usage')
    .select('question_id')
    .eq('user_id', userId)
    .eq('test_id', testId)
    .eq('subject_name', subjectName);

  if (error) throw error;
  return data.map(item => item.question_id.toString());
}

export async function getUnusedQuestions(userId: string, testId: string, subjectName: string): Promise<Question[]> {
  // Get all questions for this test and subject
  const allQuestions = await fetchQuestionsByTestId(testId);
  const subjectQuestions = allQuestions.filter(q => q.subject === subjectName);
  
  // Get used question IDs
  const usedQuestionIds = await getUsedQuestionIds(userId, testId, subjectName);
  
  // Return questions that haven't been used
  return subjectQuestions.filter(q => !usedQuestionIds.includes(q.id));
}

// Test Subject Management
export async function fetchTestSubjects(testId: string): Promise<TestSubject[]> {
  const { data, error } = await supabase
    .from('test_subjects')
    .select('*')
    .eq('test_id', testId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return data.map(subject => ({
    id: subject.id.toString(),
    testId: subject.test_id.toString(),
    subjectName: subject.subject_name,
    questionCount: subject.question_count,
    displayOrder: subject.display_order,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at
  }));
}

export async function createTestSubject(testId: string, subjectName: string, questionCount: number, displayOrder: number): Promise<TestSubject> {
  const { data, error } = await supabase
    .from('test_subjects')
    .insert([{
      test_id: parseInt(testId),
      subject_name: subjectName,
      question_count: questionCount,
      display_order: displayOrder
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    testId: data.test_id.toString(),
    subjectName: data.subject_name,
    questionCount: data.question_count,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateTestSubject(id: string, updates: Partial<TestSubject>): Promise<TestSubject> {
  const { data, error } = await supabase
    .from('test_subjects')
    .update({
      subject_name: updates.subjectName,
      question_count: updates.questionCount,
      display_order: updates.displayOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    testId: data.test_id.toString(),
    subjectName: data.subject_name,
    questionCount: data.question_count,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deleteTestSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from('test_subjects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderTestSubjects(testId: string, subjectOrders: {id: string, displayOrder: number}[]): Promise<void> {
  const updates = subjectOrders.map(item => 
    supabase
      .from('test_subjects')
      .update({ display_order: item.displayOrder })
      .eq('id', item.id)
      .eq('test_id', testId)
  );

  const results = await Promise.all(updates);
  
  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }
}
