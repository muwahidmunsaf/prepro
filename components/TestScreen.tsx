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
  
  // Use stable questions order - only shuffle once on first load, not on resume
  const testQuestions = useMemo(() => {
    if (!test || stableQuestions.length > 0) return stableQuestions;
    const allQuestions = state.questions.filter(q => q.testId === testId);
    const shuffled = shuffleArray(allQuestions).slice(0, test.totalQuestions);
    setStableQuestions(shuffled);
    return shuffled;
  }, [state.questions, testId, test, stableQuestions]);

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
    <div className="max-w-5xl mx-auto relative">
        {(isPaused || endedForCheating || showConfirm || showSubmitConfirm) && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex flex-col items-center justify-center z-50">
                {showSubmitConfirm ? (
                    <>
                      <h2 className="text-3xl font-bold text-white mb-2">Submit Test?</h2>
                      <p className="text-slate-200 mb-6 text-center max-w-md">Are you sure you want to end and submit the test?</p>
                      <div className="flex gap-3">
                        <button onClick={()=>{ confirmSubmit(); setShowSubmitConfirm(false); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">Submit</button>
                        <button onClick={()=> setShowSubmitConfirm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-6 rounded-lg">Cancel</button>
                      </div>
                    </>
                ) : showConfirm ? (
                    <>
                      <h2 className="text-3xl font-bold text-white mb-2">{showConfirm.title}</h2>
                      <p className="text-slate-200 mb-6 text-center max-w-md">{showConfirm.message}</p>
                      <div className="flex gap-3">
                        <button onClick={()=>{ showConfirm.onConfirm(); setShowConfirm(null); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">End Test</button>
                        <button onClick={()=>{ setShowConfirm(null); setIsPaused(false); }} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-6 rounded-lg">Continue</button>
                      </div>
                    </>
                ) : endedForCheating ? (
                    <>
                        <h2 className="text-4xl font-bold text-red-500 mb-2">Test Ended</h2>
                        <p className="text-white text-lg mb-6">Due to tab/window switching, your test has been ended.</p>
                        <button onClick={() => { navigate('/dashboard'); window.scrollTo(0, 0); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg">Go to Dashboard</button>
                    </>
                ) : (
                    <>
                <h2 className="text-4xl font-bold text-white mb-4">Test Paused</h2>
                        <div className="flex gap-3">
                          <button onClick={() => { setIsPaused(false); setIsPausedByUser(false); }} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg">Resume Test</button>
                          <button onClick={() => { navigate('/dashboard'); window.scrollTo(0, 0); }} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg text-lg">Go to Dashboard</button>
                        </div>
                    </>
                )}
            </div>
        )}
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg ${(isPaused || endedForCheating || showConfirm || showSubmitConfirm) ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{test.title}</h1>
                <div className="flex items-center space-x-4">
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
                      }} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Pause</button>
                    )}
                </div>
            </div>

            <div>
            {currentQuestions.map((q, index) => (
                <div key={q.id} className="mb-8">
                <p className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4">
                    {startIndex + index + 1}. {q.questionText}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((option, optIndex) => {
                    const userAnswer = userAnswers.find(a => a.questionId === q.id);
                    const isSelected = userAnswer?.selectedAnswer === optIndex;
                    return (
                        <button
                        key={optIndex}
                        onClick={() => handleAnswerSelect(q.id, optIndex)}
                        className={`w-full text-left p-3 border rounded-lg transition-colors ${
                            isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500'
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                        >
                        <span className="font-medium text-slate-700 dark:text-slate-200">{String.fromCharCode(65 + optIndex)}. {option}</span>
                        </button>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex space-x-2">
                    {currentPage > 0 && (
                    <button onClick={() => setCurrentPage(p => p - 1)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">
                        Previous
                    </button>
                    )}
                    {currentPage < totalPages - 1 && (
                    <button onClick={() => setCurrentPage(p => p + 1)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">
                        Next
                    </button>
                    )}
                </div>
                
                <p className="text-sm text-slate-500">Page {currentPage + 1} of {totalPages}</p>

                <button
                    onClick={handleSubmit}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                    End & Submit Test
                </button>
            </div>
        </div>
    </div>
  );
};

export default TestScreen;