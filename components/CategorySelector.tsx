
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import type { Category, Test } from '../types';
import * as supabaseService from '../services/supabaseService';

const CategorySelector: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const user = state.currentUser;
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState<string>('');
  const navigate = useNavigate();

  const testsForCategory = selectedCategory
    ? state.tests.filter(test => test.categoryId === selectedCategory.id)
    : [];

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  if (state.categories.length === 0) {
    return (
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">No Tests Available</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Please check back later, or contact an administrator.</p>
        </div>
    );
  }

  const [banner, setBanner] = useState<string>('');
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  // DATABASE-ONLY REFRESH MECHANISM
  useEffect(() => {
    const refreshTestAccess = async () => {
      try {
        const updated = await supabaseService.fetchTestAccess();
        dispatch({ type: 'SET_TEST_ACCESS', payload: updated } as any);
      } catch (error) {
        console.error('Failed to refresh test access:', error);
      }
    };
    
    if (user) {
      refreshTestAccess();
      
      // Refresh every 3 seconds
      const interval = setInterval(refreshTestAccess, 3000);
      return () => clearInterval(interval);
    }
  }, [user, dispatch]);

  const requestAccess = async (category: Category) => {
    if (!user) return;
    if (busyIds[category.id]) return;
    setBusyIds(prev => ({ ...prev, [category.id]: true }));
    try {
      await supabaseService.upsertCategoryAccess(user.id, category.id, 'requested');
      // Notify all admins about the request
      const admins = state.users.filter(u => u.isAdmin);
      for (const admin of admins) {
        await supabaseService.createNotification(admin.id, 'Category access requested', `${user.name} requested access to ${category.name}.`);
      }
      // Refresh and update category access in global state
      const updated = await supabaseService.fetchCategoryAccess();
      dispatch({ type: 'SET_CATEGORY_ACCESS', payload: updated } as any);
      setBanner('Request sent. You will be notified when approved.');
      setTimeout(() => setBanner(''), 3000);
    } finally {
      setBusyIds(prev => { const c = { ...prev }; delete c[category.id]; return c; });
    }
  };

  const requestTestAccess = async (test: Test) => {
    if (!user) return;
    if (busyIds[test.id]) return;
    setBusyIds(prev => ({ ...prev, [test.id]: true }));
    try {
      await supabaseService.upsertTestAccess(user.id, test.id, 'requested');
      // Notify all admins about the request
      const admins = state.users.filter(u => u.isAdmin);
      for (const admin of admins) {
        await supabaseService.createNotification(admin.id, 'Test access requested', `${user.name} requested access to ${test.title}.`);
      }
      // Refresh and update test access in global state
      const updated = await supabaseService.fetchTestAccess();
      dispatch({ type: 'SET_TEST_ACCESS', payload: updated } as any);
      setBanner('Test access request sent. You will be notified when approved.');
      setTimeout(() => setBanner(''), 3000);
    } finally {
      setBusyIds(prev => { const c = { ...prev }; delete c[test.id]; return c; });
    }
  };

  const isApproved = (categoryId: string) => {
    if (!user) return false;
    const entry = state.categoryAccess?.find(a => a.userId === user.id && a.categoryId === categoryId);
    return entry?.status === 'approved';
  }
  const isRequested = (categoryId: string) => {
    if (!user) return false;
    const entry = state.categoryAccess?.find(a => a.userId === user.id && a.categoryId === categoryId);
    return entry?.status === 'requested';
  }

  // DATABASE-ONLY TEST ACCESS FUNCTIONS
  const isTestApproved = (testId: string) => {
    if (!user) return false;
    const entry = state.testAccess?.find(a => a.userId === String(user.id) && a.testId === String(testId));
    return entry?.status === 'approved';
  }
  
  const isTestRequested = (testId: string) => {
    if (!user) return false;
    const entry = state.testAccess?.find(a => a.userId === String(user.id) && a.testId === String(testId));
    return entry?.status === 'requested';
  }

  return (
    <div className="max-w-4xl mx-auto">
      {banner && (
        <div className="mb-4 rounded-lg bg-emerald-600 text-white px-4 py-3 text-sm text-center">
          {banner}
        </div>
      )}
      {!selectedCategory ? (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-xl shadow-md">
          <div className="mb-4">
            <button onClick={() => navigate(state.currentUser?.isAdmin ? '/admin' : '/dashboard')} className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back
            </button>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">Choose a Category</h1>
            <input
              type="text"
              value={query}
              onChange={(e)=> setQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {state.categories
              .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
              .map(category => {
              const approved = isApproved(category.id);
              const requested = isRequested(category.id);
              return (
                <div
                  key={category.id}
                  className={`p-4 sm:p-6 rounded-xl text-left transition-all transform border cursor-pointer ${approved ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-slate-300/50 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:shadow-sm'}`}
                  onClick={() => {
                    if (requested) return;
                    if (approved) { handleCategoryClick(category); return; }
                    if (!busyIds[category.id]) { void requestAccess(category); }
                  }}
                  onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); if (requested) return; if (approved) { handleCategoryClick(category); } else if(!busyIds[category.id]) { void requestAccess(category);} } }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">{category.name}</h2>
                    <div className="pointer-events-none">
                      {approved ? (
                        <div className="p-2 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm" title="Open">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="16" r="1"/><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M7 10V7a5 5 0 0 1 9.33-2.5"/></svg>
                        </div>
                      ) : requested ? (
                        <span className="p-2 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500 flex items-center justify-center" title="Requested">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 7.38 16.75"/><path d="M12 6v6l4 2"/><path d="M2.5 8.875a10 10 0 0 0-.5 3"/><path d="M2.83 16a10 10 0 0 0 2.43 3.4"/><path d="M4.636 5.235a10 10 0 0 1 .891-.857"/><path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/></svg>
                        </span>
                      ) : (
                        <div className={`${busyIds[category.id] ? 'bg-amber-400' : 'bg-amber-500'} p-2 rounded-lg text-white flex items-center justify-center shadow-sm`} title="Request Access">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {!approved && !requested && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">This category is locked. Request access and wait for admin approval.</p>
                  )}
                  {requested && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Request pending approval.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-xl shadow-md">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button onClick={() => setSelectedCategory(null)} className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center mr-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{selectedCategory.name} Tests</h1>
            </div>
          </div>
          {testsForCategory.length > 0 ? (
            <div className="space-y-4">
              {testsForCategory.map(test => {
                const testApproved = isTestApproved(test.id);
                const testRequested = isTestRequested(test.id);
                return (
                  <div key={test.id}>
                    <div 
                      className={`block border p-4 sm:p-6 rounded-xl transition-all cursor-pointer ${
                        testApproved 
                          ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md' 
                          : 'border-slate-300/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/30 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        if (testRequested) return;
                        if (testApproved) {
                          navigate(`/test/${test.id}/instructions`);
                          return;
                        }
                        if (!busyIds[test.id]) {
                          void requestTestAccess(test);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (testRequested) return;
                          if (testApproved) {
                            navigate(`/test/${test.id}/instructions`);
                          } else if (!busyIds[test.id]) {
                            void requestTestAccess(test);
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">{test.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{test.totalQuestions} Questions | {test.duration} Minutes</p>
                          {!testApproved && !testRequested && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">This test is locked. Request access and wait for admin approval.</p>
                          )}
                          {testRequested && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Test access request pending approval.</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="pointer-events-none">
                            {testApproved ? (
                              <div className="p-3 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm" title="Start Test">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5,3 19,12 5,21"></polygon>
                                </svg>
                              </div>
                            ) : testRequested ? (
                              <span className="p-3 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500 flex items-center justify-center" title="Requested">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2a10 10 0 0 1 7.38 16.75"/><path d="M12 6v6l4 2"/><path d="M2.5 8.875a10 10 0 0 0-.5 3"/><path d="M2.83 16a10 10 0 0 0 2.43 3.4"/><path d="M4.636 5.235a10 10 0 0 1 .891-.857"/><path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/>
                                </svg>
                              </span>
                            ) : (
                              <div className={`${busyIds[test.id] ? 'bg-amber-400' : 'bg-amber-500'} p-3 rounded-lg text-white flex items-center justify-center shadow-sm`} title="Request Access">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          {testApproved && (
                            <span className="text-indigo-600 font-semibold text-sm sm:text-base">Start Test →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No tests found in this category.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
