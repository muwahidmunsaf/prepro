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
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Questions Management
export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(q => ({
    id: q.id.toString(),
    testId: q.test_id.toString(),
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer
  }));
}

export async function fetchQuestionsByTestId(testId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId);

  if (error) throw error;

  return data.map(q => ({
    id: q.id.toString(),
    testId: q.test_id.toString(),
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer
  }));
}

export async function createQuestion(question: Omit<Question, 'id'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert([{
      test_id: parseInt(question.testId),
      question_text: question.questionText,
      options: question.options,
      correct_answer: question.correctAnswer
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id.toString(),
    testId: data.test_id.toString(),
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer
  };
}

export async function updateQuestion(question: Question): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update({
      question_text: question.questionText,
      options: question.options,
      correct_answer: question.correctAnswer
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
    correctAnswer: data.correct_answer
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
      console.error('DATABASE: Error fetching test access:', error);
      throw error;
    }
    
    const result = (data || []).map(a => ({ 
      id: a.id.toString(), 
      userId: a.user_id.toString(), 
      testId: a.test_id.toString(), 
      status: a.status, 
      updatedAt: a.updated_at 
    }));
    
    console.log('DATABASE: Fetched test access:', result);
    return result;
  } catch (error) {
    console.error('DATABASE: Failed to fetch test access:', error);
    // Return empty array if database fails
    return [];
  }
}

export async function upsertTestAccess(userId: string, testId: string, status: TestAccess['status']): Promise<TestAccess> {
  try {
    console.log('DATABASE: Upserting test access:', { userId, testId, status });
    
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
      console.error('DATABASE: Error upserting test access:', error);
      throw error;
    }
    
    const result = { 
      id: data.id.toString(), 
      userId: data.user_id.toString(), 
      testId: data.test_id.toString(), 
      status: data.status, 
      updatedAt: data.updated_at 
    };
    
    console.log('DATABASE: Successfully upserted test access:', result);
    return result;
  } catch (error) {
    console.error('DATABASE: Failed to upsert test access:', error);
    throw error;
  }
}
