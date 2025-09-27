
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// FIX: The useAppContext hook is exported from 'hooks/useAppContext', not from the context file.
import { useAppContext } from '../hooks/useAppContext';
import { Logo, UserIcon } from './icons';
import * as supabaseService from '../services/supabaseService';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Array<{id:string;title:string;message:string;created_at:string;is_read:boolean}>>([]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (open && !target.closest('.notification-dropdown')) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  useEffect(() => {
    const load = async () => {
      if (!state.currentUser) return;
      try {
        // Admins should see notifications targeted to them (admin user row). If you want global admin inbox, change to undefined
        const res = await supabaseService.fetchNotifications(state.currentUser.id);
        setItems(res);
      } catch {}
    };
    load();
  }, [state.currentUser]);
  const navigate = useNavigate();

  const handleSignOut = () => {
    dispatch({ type: 'SIGN_OUT' });
    navigate('/');
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const homeLink = state.currentUser ? (state.currentUser.isAdmin ? '/admin' : '/dashboard') : '/';

  return (
    <header className="bg-slate-800 shadow-md no-print">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to={homeLink} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-bold text-white">PrepPro</span>
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-white/80 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="text-lg">{state.isDarkMode ? '☀️' : '🌙'}</span>
          </button>
          
          {state.currentUser && (
            <div className="relative notification-dropdown">
              <button onClick={async ()=>{
                  const next = !open;
                  setOpen(next);
                  if (next) {
                    const unreadIds = items.filter(i=>!i.is_read).map(i=>i.id);
                    try {
                      await supabaseService.markNotificationsRead(unreadIds);
                      setItems(prev=> prev.map(p=> ({...p, is_read: true})));
                    } catch {}
                  }
                }} title="Notifications" className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"/></svg>
                {items.some(i=>!i.is_read) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
              </button>
              {open && (
                <>
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-6rem)] overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 transform translate-x-0 sm:translate-x-0">
                    <div className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-t-xl">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"/>
                        </svg>
                        Notifications
                        {items.some(i=>!i.is_read) && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{items.filter(i=>!i.is_read).length}</span>}
                      </span>
                      <button 
                        onClick={() => setOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <div className="p-6 text-center">
                        <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"/>
                        </svg>
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="max-h-[calc(100vh-14rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto">
                        {items.map(n => (
                          <div key={n.id} className="p-4 border-b dark:border-slate-700 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors last:border-b-0">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-3 h-3 rounded-full ${n.is_read ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-900 dark:text-white font-medium leading-tight">{n.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words">{n.message}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {state.currentUser ? (
            <>
              <div className="hidden sm:flex items-center space-x-2 text-white">
                <UserIcon className="w-5 h-5" />
                <span className="text-sm md:text-base">{state.currentUser.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white font-medium p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">In</span>
              </Link>
              <Link
                to="/auth"
                state={{ isSignUp: true }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Up</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
// custom scrollbar for notifications
// This style tag affects only webkit; firefox uses default thin scrollbar
// Keeping it here local to component file for simplicity
// eslint-disable-next-line
// @ts-ignore
const style = document.createElement('style');
style.textContent = `.custom-scroll{scrollbar-width:thin; scrollbar-color:#475569 transparent;} .custom-scroll::-webkit-scrollbar{width:8px} .custom-scroll::-webkit-scrollbar-thumb{background:#475569;border-radius:8px} .custom-scroll::-webkit-scrollbar-track{background:transparent}`;
document.head && document.head.appendChild(style);

