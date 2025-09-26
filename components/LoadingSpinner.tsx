import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center relative z-10">
        {/* Logo with enhanced animation */}
        <div className="mb-12">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300 animate-pulse">
            <svg className="w-12 h-12 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-6 mb-2">PrepPro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Job Test Preparation</p>
        </div>

        {/* Loading text */}
        <div className="mb-8">
          <p className="text-slate-600 dark:text-slate-300 text-xl font-semibold mb-2">Loading your dashboard...</p>
        </div>
        
        {/* Enhanced Progress dots */}
        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce shadow-lg"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Additional professional touches */}
        <div className="mt-12 text-slate-400 dark:text-slate-500 text-sm">
          <p>Preparing your personalized learning experience...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
