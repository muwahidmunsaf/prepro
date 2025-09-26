
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// FIX: The useAppContext hook is exported from 'hooks/useAppContext', not from the context file.
import { useAppContext } from '../hooks/useAppContext';
import { UserIcon, ChevronRightIcon } from './icons';

const UserDashboard: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const { currentUser } = state;

  if (!currentUser) return null;

  // Detect paused session (only show for paused, not ended tests)
  const pausedSession = (() => {
    try {
      const keyPrefix = `pp_session_${currentUser.id}_`;
      const test = state.tests.find(t => {
        const saved = localStorage.getItem(`${keyPrefix}${t.id}`);
        if (!saved) return false;
        const parsed = JSON.parse(saved);
        // Only show if it's a valid paused session (has timeLeft and userAnswers)
        // and the session hasn't been cleared (which happens when test ends)
        // Also check that it's not an ended session (timeLeft should be > 0)
        return parsed && parsed.timeLeft > 0 && Array.isArray(parsed.userAnswers) && !parsed.endedForCheating;
      });
      if (!test) return null;
      return { testId: test.id, title: test.title };
    } catch { return null; }
  })();

  const userResults = state.results
    .filter(result => result.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTestTitle = (testId: string) => state.tests.find(t => t.id === testId)?.title || 'Unknown Test';

  // Calculate performance metrics
  const totalAttempts = userResults.length;
  const averageScore = totalAttempts > 0 
    ? Math.round(userResults.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0) / totalAttempts)
    : 0;
  const passedTests = userResults.filter(result => (result.score / result.totalQuestions) * 100 >= 70).length;
  const passRate = totalAttempts > 0 ? Math.round((passedTests / totalAttempts) * 100) : 0;
  const bestScore = totalAttempts > 0 
    ? Math.max(...userResults.map(result => Math.round((result.score / result.totalQuestions) * 100)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl mb-6 sm:mb-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-lg sm:text-2xl font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2">Welcome back, {currentUser.name}!</h1>
              <p className="text-slate-600 dark:text-slate-300 flex items-center text-sm sm:text-base lg:text-lg">
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 
                {currentUser.email}
              </p>
            </div>
          </div>
          <Link 
              to="/tests"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
          >
              Start New Test
          </Link>
        </div>
      </div>

      {pausedSession && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-300 dark:border-amber-700 p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">⏸️</span>
              </div>
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-semibold text-lg">Test Paused</p>
                <p className="text-amber-700 dark:text-amber-300">You have a paused test: <span className="font-medium">{pausedSession.title}</span></p>
              </div>
            </div>
            <button 
              onClick={handleResumeTest} 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Performance Cards */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Attempts</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-2xl border border-green-200 dark:border-green-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Average Score</p>
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">{averageScore}%</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Pass Rate</p>
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{passRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-2xl border border-orange-200 dark:border-orange-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Best Score</p>
                <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">{bestScore}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🏆</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Your Test History</h2>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm sm:text-base">📊</span>
          </div>
        </div>
        {userResults.length > 0 ? (
          <div className="space-y-4">
            {userResults.map(result => {
              const percentage = Math.round((result.score / result.totalQuestions) * 100);
              const isPassed = percentage >= 70;
              return (
                <div 
                  key={result.id} 
                  className="border border-slate-200 dark:border-slate-700 p-4 sm:p-6 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-indigo-300 dark:hover:border-indigo-600"
                  onClick={() => navigate(`/results/${result.id}`)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                        isPassed 
                          ? 'bg-gradient-to-br from-green-400 to-green-600' 
                          : 'bg-gradient-to-br from-red-400 to-red-600'
                      }`}>
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {isPassed ? '✓' : '✗'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {getTestTitle(result.testId)}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                          Taken on: {new Date(result.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className={`text-xl sm:text-2xl font-bold ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                          {percentage}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          {result.score}/{result.totalQuestions} correct
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">You haven't completed any tests yet.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Start your first test to see your results here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
