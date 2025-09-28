
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Test {
  id: string;
  categoryId: string;
  title: string;
  duration: number; // in minutes
  totalQuestions: number;
}

export interface Question {
  id: string;
  testId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  category?: string;
  position?: number;
  difficulty?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number | null;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalQuestions: number;
  answers: UserAnswer[];
  questions: Question[]; // Storing questions for review and printing
  date: string;
}

export interface CategoryAccess {
  id: string;
  userId: string;
  categoryId: string;
  status: 'locked' | 'requested' | 'approved';
  updatedAt?: string;
}

export interface TestAccess {
  id: string;
  userId: string;
  testId: string;
  status: 'locked' | 'requested' | 'approved';
  updatedAt?: string;
}

export type AppState = {
  users: User[];
  categories: Category[];
  tests: Test[];
  questions: Question[];
  results: TestResult[];
  currentUser: User | null;
  categoryAccess?: CategoryAccess[];
  testAccess?: TestAccess[];
  isDarkMode: boolean;
};

export type Action =
  | { type: 'SET_INITIAL_DATA'; payload: AppState }
  | { type: 'SIGN_IN'; payload: User }
  | { type: 'SIGN_OUT' }
  | { type: 'SIGN_UP'; payload: User }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_TEST'; payload: Test }
  | { type: 'UPDATE_TEST'; payload: Test }
  | { type: 'DELETE_TEST'; payload: string }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'UPDATE_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'BULK_ADD_QUESTIONS'; payload: Question[] }
  | { type: 'ADD_RESULT'; payload: TestResult }
  | { type: 'SET_CATEGORY_ACCESS'; payload: CategoryAccess[] }
  | { type: 'ADD_CATEGORY_ACCESS'; payload: CategoryAccess }
  | { type: 'UPDATE_CATEGORY_ACCESS'; payload: CategoryAccess }
  | { type: 'SET_TEST_ACCESS'; payload: TestAccess[] }
  | { type: 'ADD_TEST_ACCESS'; payload: TestAccess }
  | { type: 'UPDATE_TEST_ACCESS'; payload: TestAccess }
  | { type: 'TOGGLE_DARK_MODE' };
