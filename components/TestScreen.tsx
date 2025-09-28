import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import * as supabaseService from '../services/supabaseService';
import Timer from './Timer';
import type { Question, UserAnswer } from '../types';

const QUESTIONS_PER_PAGE = 25;

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const TestScreen: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const [isPaused, setIsPaused] = useState(false);
  const [hasLeftPage, setHasLeftPage] = useState(false);
  const [endedForCheating, setEndedForCheating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);
  const [showConfirm, setShowConfirm] = useState<{title:string;message:string;onConfirm:()=>void;onCancel:()=>void} | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [stableQuestions, setStableQuestions] = useState<Question[]>([]);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  const test = useMemo(() => state.tests.find(t => t.id === testId), [state.tests, testId]);

  // Load test subjects when component mounts
  useEffect(() => {
    const loadTestSubjects = async () => {
      if (testId && (!state.testSubjects || state.testSubjects.length === 0)) {
        try {
          const subjects = await supabaseService.fetchTestSubjects(testId);
          dispatch({ type: 'SET_TEST_SUBJECTS', payload: subjects } as any);
        } catch (error) {
          console.error('Failed to load test subjects:', error);
        }
      }
    };
    
    loadTestSubjects();
  }, [testId, state.testSubjects, dispatch]);
  
  // Use stable questions order - only shuffle once on first load, not on resume
  const testQuestions = useMemo(() => {
    if (!test || stableQuestions.length > 0) return stableQuestions;
    
    // Get all questions for this test
    const allQuestions = state.questions.filter(q => q.testId === testId);
    
    // Get subjects for this test in order
    const testSubjects = state.testSubjects?.filter(s => s.testId === testId) || [];
    const sortedSubjects = testSubjects.sort((a, b) => a.displayOrder - b.displayOrder);
    
    console.log('Test subjects found:', testSubjects);
    console.log('Sorted subjects:', sortedSubjects);
    console.log('All questions for test:', allQuestions.length);
    
    let orderedQuestions: Question[] = [];
    
    // For each subject in order, get questions and shuffle them
    for (const subject of sortedSubjects) {
      const subjectQuestions = allQuestions.filter(q => q.subject === subject.subjectName);
      const shuffledSubjectQuestions = shuffleArray(subjectQuestions);
      
      // Take only the target number of questions for this subject
      const questionsToTake = Math.min(subject.questionCount, shuffledSubjectQuestions.length);
      const selectedQuestions = shuffledSubjectQuestions.slice(0, questionsToTake);
      
      console.log(`Subject: ${subject.subjectName}, Found: ${subjectQuestions.length}, Taking: ${questionsToTake}`);
      
      orderedQuestions = [...orderedQuestions, ...selectedQuestions];
    }
    
    console.log('Final ordered questions:', orderedQuestions.length);
    console.log('First 5 questions subjects:', orderedQuestions.slice(0, 5).map(q => q.subject));
    
    // If no subjects configured, fall back to old behavior
    if (sortedSubjects.length === 0) {
      const shuffled = shuffleArray(allQuestions).slice(0, test.totalQuestions);
      setStableQuestions(shuffled);
      return shuffled;
    }
    
    setStableQuestions(orderedQuestions);
    return orderedQuestions;
  }, [state.questions, state.testSubjects, testId, test, stableQuestions]);

  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() => {
    const key = state.currentUser ? `pp_session_${state.currentUser.id}_${testId}` : '';
    if (key) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.userAnswers)) {
            setTimeLeft(parsed.timeLeft);
            // Restore stable questions order from saved session
            if (parsed.stableQuestions) {
              setStableQuestions(parsed.stableQuestions);
            }
            return parsed.userAnswers as UserAnswer[];
          }
        }
      } catch {}
    }
    return testQuestions.map(q => ({ questionId: q.id, selectedAnswer: null }));
  });
  const [currentPage, setCurrentPage] = useState(0);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Tab switching and visibility protection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused) {
        // Auto-end on tab switch without confirmation (only if not paused)
        setHasLeftPage(true);
        setEndedForCheating(true);
      }
    };

    const handleBlur = () => {
      if (!isPaused) {
        // Auto-end on blur without confirmation (only if not paused)
        setHasLeftPage(true);
        setEndedForCheating(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Leaving the page will cancel your test. Are you sure?';
      return 'Leaving the page will cancel your test. Are you sure?';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPaused]);

  // Persist session when paused or on interval
  useEffect(() => {
    if (!state.currentUser || !testId || endedForCheating) return;
    const key = `pp_session_${state.currentUser.id}_${testId}`;
    const payload = { userAnswers, timeLeft, stableQuestions, endedForCheating, isPaused };
    try { localStorage.setItem(key, JSON.stringify(payload)); } catch {}
  }, [userAnswers, timeLeft, stableQuestions, endedForCheating, isPaused, state.currentUser, testId]);

  // Clear persisted session on successful submit or end
  const clearSession = useCallback(() => {
    if (!state.currentUser || !testId) return;
    const key = `pp_session_${state.currentUser.id}_${testId}`;
    try { localStorage.removeItem(key); } catch {}
  }, [state.currentUser, testId]);

  // Clear session when test ends due to cheating
  useEffect(() => {
    if (endedForCheating) {
      clearSession();
      // Also clear the paused state
      setIsPaused(false);
      setIsPausedByUser(false);
    }
  }, [endedForCheating, clearSession]);

  // Auto-submit on timer completion
  useEffect(() => {
    const checkTimer = () => {
      // Timer auto-submission is handled in Timer component
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!state.currentUser || !test) return;

    setShowSubmitConfirm(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (!state.currentUser || !test) return;

    let score = 0;
    userAnswers.forEach(answer => {
      const question = testQuestions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedAnswer) {
        score++;
      }
    });

    try {
      const resultData = {
      userId: state.currentUser.id,
      testId: test.id,
      score,
      totalQuestions: testQuestions.length,
      answers: userAnswers,
      questions: testQuestions,
      date: new Date().toISOString(),
    };

      const newResult = await supabaseService.createResult(resultData);
      dispatch({ type: 'ADD_RESULT', payload: newResult });
      clearSession();
      navigate(`/results/${newResult.id}`);
      // Scroll to top after navigation
      setTimeout(() => window.scrollTo(0, 0), 100);
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  }, [state.currentUser, test, userAnswers, testQuestions, dispatch, navigate, clearSession]);

  if (!test) return <div className="text-white">Test not found.</div>;
  if (testQuestions.length === 0) return <div className="text-white">This test has no questions.</div>;
  // If the user left the page, show termination overlay instead of rendering test

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setUserAnswers(prev =>
      prev.map(ans =>
        ans.questionId === questionId ? { ...ans, selectedAnswer: optionIndex } : ans
      )
    );
  };

  const totalPages = Math.ceil(testQuestions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const currentQuestions = testQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto relative p-4 sm:p-6">
        {(isPaused || endedForCheating || showConfirm || showSubmitConfirm) && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
                    {showSubmitConfirm ? (
                        <>
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">Submit Test?</h2>
                          <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">Are you sure you want to end and submit the test?</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={()=>{ confirmSubmit(); setShowSubmitConfirm(false); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Submit</button>
                            <button onClick={()=> setShowSubmitConfirm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors">Cancel</button>
                          </div>
                        </>
                    ) : showConfirm ? (
                        <>
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">{showConfirm.title}</h2>
                          <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">{showConfirm.message}</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={()=>{ showConfirm.onConfirm(); setShowConfirm(null); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">End Test</button>
                            <button onClick={()=>{ setShowConfirm(null); setIsPaused(false); }} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors">Continue</button>
                          </div>
                        </>
                    ) : endedForCheating ? (
                        <>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-500 mb-3">Test Ended</h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">Due to tab/window switching, your test has been ended.</p>
                            <button onClick={() => { navigate('/dashboard'); window.scrollTo(0, 0); }} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Go to Dashboard</button>
                        </>
                    ) : (
                        <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">Test Paused</h2>
                            <div className="flex flex-col gap-3">
                              <button onClick={() => { setIsPaused(false); setIsPausedByUser(false); }} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Resume Test</button>
                              <button onClick={() => { navigate('/dashboard'); window.scrollTo(0, 0); }} className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Go to Dashboard</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
        <div className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ${(isPaused || endedForCheating || showConfirm || showSubmitConfirm) ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{test.title}</h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <Timer duration={test.duration} onTimeUp={confirmSubmit} isPaused={isPaused || !!showConfirm || showSubmitConfirm} initialSeconds={timeLeft} onTick={setTimeLeft} />
                        {!endedForCheating && (
                          <button onClick={() => { 
                            setIsPaused(true); 
                            setIsPausedByUser(true);
                            // Immediately save session when paused
                            if (state.currentUser && testId) {
                              const key = `pp_session_${state.currentUser.id}_${testId}`;
                              const payload = { userAnswers, timeLeft, stableQuestions, endedForCheating: false, isPaused: true };
                              try { localStorage.setItem(key, JSON.stringify(payload)); } catch {}
                            }
                          }} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm sm:text-base transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Pause
                          </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Total Questions: {testQuestions.length}</span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Duration: {test.duration} minutes</span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Page {currentPage + 1} of {totalPages}</span>
                </div>
            </div>

            <div className="space-y-8">
            {currentQuestions.map((q, index) => (
                <div key={q.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex items-start gap-3 mb-4">
                    <span className="bg-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full flex-shrink-0">
                        {startIndex + index + 1}
                    </span>
                    <p className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed">
                        {q.questionText}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option, optIndex) => {
                    const userAnswer = userAnswers.find(a => a.questionId === q.id);
                    const isSelected = userAnswer?.selectedAnswer === optIndex;
                    return (
                        <button
                        key={optIndex}
                        onClick={() => handleAnswerSelect(q.id, optIndex)}
                        className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-200 ${
                            isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                        >
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                                isSelected 
                                ? 'bg-indigo-500 border-indigo-500 text-white' 
                                : 'border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-400'
                            }`}>
                                {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{option}</span>
                        </div>
                        </button>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2 order-2 sm:order-1">
                        {currentPage > 0 && (
                        <button onClick={() => setCurrentPage(p => p - 1)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-6 rounded-lg text-sm sm:text-base transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Previous
                        </button>
                        )}
                        {currentPage < totalPages - 1 && (
                        <button onClick={() => setCurrentPage(p => p + 1)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg text-sm sm:text-base transition-colors flex items-center gap-2">
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                        )}
                    </div>
                    
                    <div className="text-center order-1 sm:order-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage + 1} of {totalPages}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {userAnswers.filter(a => a.selectedAnswer !== null).length} of {testQuestions.length} answered
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-sm sm:text-base transition-colors order-3 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        End & Submit Test
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TestScreen;