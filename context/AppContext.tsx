
import React, { createContext, useReducer, Dispatch, useEffect, useState } from 'react';
import type { AppState, Action, User, CategoryAccess, TestAccess } from '../types';
import * as supabaseService from '../services/supabaseService';
import LoadingSpinner from '../components/LoadingSpinner';

// Function to get initial user from localStorage synchronously
const getInitialUser = (): User | null => {
  try {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const initialState: AppState = {
  users: [],
  categories: [],
  tests: [],
  questions: [],
  results: [],
  currentUser: getInitialUser(),
  categoryAccess: [],
  testAccess: [],
  isDarkMode: (() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  })(),
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
        return action.payload;
    case 'SIGN_IN':
      localStorage.setItem('currentUser', JSON.stringify(action.payload));
      return { ...state, currentUser: action.payload };
    case 'SIGN_OUT':
      localStorage.removeItem('currentUser');
      return { ...state, currentUser: null };
    case 'SIGN_UP': {
      // Supabase handles user creation
      const newUsers = [...state.users, action.payload];
      return { ...state, users: newUsers };
    }
    case 'ADD_USER': {
      const newUsers = [...state.users, action.payload];
      return { ...state, users: newUsers };
    }
    case 'UPDATE_USER': {
      const newUsers = state.users.map(u => u.id === action.payload.id ? action.payload : u);
      return { ...state, users: newUsers };
    }
    case 'DELETE_USER': {
      const newUsers = state.users.filter(u => u.id !== action.payload);
      return { ...state, users: newUsers };
    }
    case 'ADD_CATEGORY': {
      const newCategories = [...state.categories, action.payload];
      return { ...state, categories: newCategories };
    }
    case 'UPDATE_CATEGORY': {
        const newCategories = state.categories.map(c => c.id === action.payload.id ? action.payload : c);
        return { ...state, categories: newCategories };
    }
    case 'DELETE_CATEGORY': {
        const newCategories = state.categories.filter(c => c.id !== action.payload);
        const testsInCategory = state.tests.filter(t => t.categoryId === action.payload).map(t => t.id);
        const newTests = state.tests.filter(t => t.categoryId !== action.payload);
        const newQuestions = state.questions.filter(q => !testsInCategory.includes(q.testId));
        const newState = { ...state, categories: newCategories, tests: newTests, questions: newQuestions };
        return newState;
    }
    case 'ADD_TEST': {
      const newTests = [...state.tests, action.payload];
      return { ...state, tests: newTests };
    }
    case 'UPDATE_TEST': {
        const newTests = state.tests.map(t => t.id === action.payload.id ? action.payload : t);
        return { ...state, tests: newTests };
    }
    case 'DELETE_TEST': {
        const newTests = state.tests.filter(t => t.id !== action.payload);
        const newQuestions = state.questions.filter(q => q.testId !== action.payload);
        const newState = { ...state, tests: newTests, questions: newQuestions };
        return newState;
    }
    case 'ADD_QUESTION': {
        const newQuestions = [...state.questions, action.payload];
        return { ...state, questions: newQuestions };
    }
    case 'UPDATE_QUESTION': {
        const newQuestions = state.questions.map(q => q.id === action.payload.id ? action.payload : q);
        return { ...state, questions: newQuestions };
    }
    case 'DELETE_QUESTION': {
        const newQuestions = state.questions.filter(q => q.id !== action.payload);
        return { ...state, questions: newQuestions };
    }
    case 'BULK_ADD_QUESTIONS': {
        const newQuestions = [...state.questions, ...action.payload];
        return { ...state, questions: newQuestions };
    }
    case 'ADD_RESULT': {
        const newResults = [...state.results, action.payload];
        return { ...state, results: newResults };
    }
    case 'SET_CATEGORY_ACCESS': {
      return { ...state, categoryAccess: action.payload } as AppState;
    }
    case 'ADD_CATEGORY_ACCESS': {
      return { ...state, categoryAccess: [...state.categoryAccess, action.payload] } as AppState;
    }
    case 'UPDATE_CATEGORY_ACCESS': {
      const updated = state.categoryAccess.some(a => a.id === action.payload.id)
        ? state.categoryAccess.map(a => a.id === action.payload.id ? action.payload : a)
        : state.categoryAccess;
      return { ...state, categoryAccess: updated } as AppState;
    }
    case 'SET_TEST_ACCESS': {
      return { ...state, testAccess: action.payload };
    }
    case 'ADD_TEST_ACCESS': {
      const newAccess = [...(state.testAccess || []), action.payload];
      return { ...state, testAccess: newAccess };
    }
    case 'UPDATE_TEST_ACCESS': {
      const newAccess = (state.testAccess || []).map(a => a.id === action.payload.id ? action.payload : a);
      return { ...state, testAccess: newAccess };
    }
    case 'TOGGLE_DARK_MODE': {
      const newMode = !state.isDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      
      // Apply theme to document
      if (newMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      
      return { ...state, isDarkMode: newMode };
    }
    default:
      return state;
  }
};


export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
} | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [bootstrapped, setBootstrapped] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user from localStorage
        const currentUser = getInitialUser();

        // Apply initial dark mode
        const savedDarkMode = localStorage.getItem('darkMode');
        const isDarkMode = savedDarkMode ? JSON.parse(savedDarkMode) : true;
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }

        // Load all data from Supabase only if user is logged in
        const [categories, tests, questions, results, users, categoryAccess, testAccess] = await Promise.all([
          supabaseService.fetchCategories().catch(() => []),
          supabaseService.fetchTests().catch(() => []),
          supabaseService.fetchQuestions().catch(() => []),
          supabaseService.fetchResults().catch(() => []),
          supabaseService.fetchUsers().catch(() => []),
          supabaseService.fetchCategoryAccess().catch(() => []),
          supabaseService.fetchTestAccess().catch(() => [])
        ]);

        // Load test access from localStorage as fallback
        const localTestAccess: TestAccess[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('test_access_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data.userId && data.testId && data.status) {
                localTestAccess.push(data);
                console.log('Loaded test access from localStorage:', data);
              }
            } catch (error) {
              console.error('Error parsing localStorage test access:', error);
            }
          }
        }

        // Also check for any test access data stored in a single key
        try {
          const globalTestAccess = localStorage.getItem('global_test_access');
          if (globalTestAccess) {
            const parsed = JSON.parse(globalTestAccess);
            if (Array.isArray(parsed)) {
              localTestAccess.push(...parsed);
              console.log('Loaded global test access from localStorage:', parsed);
            }
          }
        } catch (error) {
          console.error('Error parsing global test access:', error);
        }

        // Merge database and localStorage test access
        const mergedTestAccess = [...testAccess, ...localTestAccess.filter(lt => 
          !testAccess.some(ta => ta.userId === lt.userId && ta.testId === lt.testId)
        )];

        dispatch({ 
          type: 'SET_INITIAL_DATA', 
          payload: { 
            users,
            categories,
            tests,
            questions,
            results,
            currentUser,
            categoryAccess,
            testAccess: mergedTestAccess,
            isDarkMode
          } 
        });
        setBootstrapped(true);
      } catch (error) {
        console.error("Failed to load data from Supabase", error);
        setBootstrapped(true);
      }
    };

    loadData();
  }, []);

  if (!bootstrapped) {
    return <LoadingSpinner />;
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
