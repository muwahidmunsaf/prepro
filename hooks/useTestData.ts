import { useEffect } from 'react';
import type { User, Category, Test, Question, AppState } from '../types';
import { useAppContext } from './useAppContext';

const useTestData = () => {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    const isDataSeeded = localStorage.getItem('appDataSeeded');
    if (isDataSeeded || (state.users && state.users.length > 0)) {
      return;
    }

    const storedData = localStorage.getItem('appData');
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);
            if (parsedData.users && parsedData.users.length > 0) {
                return;
            }
        } catch (e) {
            console.error("Error parsing stored appData", e);
        }
    }


    console.log("Seeding initial test data as localStorage is empty.");

    // USERS
    const adminUser: User = { id: 'user-admin', name: 'Admin', email: 'admin@preppro.com', password: 'password', isAdmin: true };
    const regularUser: User = { id: 'user-1', name: 'John Doe', email: 'user@preppro.com', password: 'password', isAdmin: false };
    const users: User[] = [adminUser, regularUser];

    // CATEGORIES
    const cat1: Category = { id: 'cat-1', name: 'Frontend Development' };
    const cat2: Category = { id: 'cat-2', name: 'Backend Development' };
    const cat3: Category = { id: 'cat-3', name: 'Project Management' };
    const categories: Category[] = [cat1, cat2, cat3];

    // TESTS
    const test1: Test = { id: 'test-1', categoryId: cat1.id, title: 'React Basics', duration: 10, totalQuestions: 5 };
    const test2: Test = { id: 'test-2', categoryId: cat2.id, title: 'Node.js Fundamentals', duration: 15, totalQuestions: 5 };
    const test3: Test = { id: 'test-3', categoryId: cat3.id, title: 'Agile Methodologies', duration: 5, totalQuestions: 3 };
    const tests: Test[] = [test1, test2, test3];

    // QUESTIONS
    const questions: Question[] = [
      // React Basics
      { id: 'q-1-1', testId: test1.id, questionText: 'What is JSX?', options: ['A JavaScript syntax extension', 'A templating engine', 'A CSS preprocessor', 'A database query language'], correctAnswer: 0 },
      { id: 'q-1-2', testId: test1.id, questionText: 'Which hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 1 },
      { id: 'q-1-3', testId: test1.id, questionText: 'What does "props" stand for in React?', options: ['Properties', 'Proposals', 'Prototypes', 'Procedures'], correctAnswer: 0 },
      { id: 'q-1-4', testId: test1.id, questionText: 'How do you pass data from a parent to a child component?', options: ['Using state', 'Using context', 'Using props', 'Using refs'], correctAnswer: 2 },
      { id: 'q-1-5', testId: test1.id, questionText: 'What is the virtual DOM?', options: ['A direct representation of the DOM', 'A backup of the DOM', 'A copy of the DOM kept in memory', 'A new browser feature'], correctAnswer: 2 },
      
      // Node.js Fundamentals
      { id: 'q-2-1', testId: test2.id, questionText: 'What is Node.js?', options: ['A frontend framework', 'A JavaScript runtime environment', 'A database', 'A web browser'], correctAnswer: 1 },
      { id: 'q-2-2', testId: test2.id, questionText: 'Which module is used for handling file operations in Node.js?', options: ['http', 'url', 'fs', 'path'], correctAnswer: 2 },
      { id: 'q-2-3', testId: test2.id, questionText: 'What is NPM?', options: ['Node Package Manager', 'Node Project Manager', 'New Project Manager', 'Network Protocol Manager'], correctAnswer: 0 },
      { id: 'q-2-4', testId: test2.id, questionText: 'Which of the following is a core module in Node.js?', options: ['express', 'lodash', 'http', 'react'], correctAnswer: 2 },
      { id: 'q-2-5', testId: test2.id, questionText: 'What is the purpose of `package.json`?', options: ['To list project dependencies', 'To define project scripts', 'To store project metadata', 'All of the above'], correctAnswer: 3 },

      // Agile Methodologies
      { id: 'q-3-1', testId: test3.id, questionText: 'What is a "sprint" in Scrum?', options: ['A quick meeting', 'A project phase', 'A time-boxed period for work', 'A final project review'], correctAnswer: 2 },
      { id: 'q-3-2', testId: test3.id, questionText: 'Who is responsible for the product backlog?', options: ['The Scrum Master', 'The Development Team', 'The Product Owner', 'The Stakeholders'], correctAnswer: 2 },
      { id: 'q-3-3', testId: test3.id, questionText: 'What is a daily stand-up meeting for?', options: ['To assign tasks for the day', 'For the team to synchronize activities', 'To report progress to managers', 'To discuss project roadblocks in detail'], correctAnswer: 1 },
    ];

    const seededData: AppState = {
      users,
      categories,
      tests,
      questions,
      currentUser: null,
      results: [],
    };
    
    localStorage.setItem('appData', JSON.stringify(seededData));
    localStorage.setItem('appDataSeeded', 'true');
    
    dispatch({ type: 'SET_INITIAL_DATA', payload: seededData });

  }, [dispatch, state.users]);
};

export default useTestData;
