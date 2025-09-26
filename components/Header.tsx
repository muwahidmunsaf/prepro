
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });
  
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
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    // Force apply the theme immediately
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Apply initial dark mode on component mount
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const initialMode = saved ? JSON.parse(saved) : true;
    setIsDarkMode(initialMode);
    
    if (initialMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

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
          <span className="text-xl font-bold text-white">PrepPro</span>
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-white/80 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="text-lg sm:text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
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
                }} title="Notifications" className="relative text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"/></svg>
                {items.some(i=>!i.is_read) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"/>}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto custom-scroll bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  <div className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700">Notifications</div>
                  {items.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">No notifications</div>
                  ) : items.map(n => (
                    <div key={n.id} className="p-3 border-b dark:border-slate-700 flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-1 ${n.is_read ? 'text-green-500' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white font-medium">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {state.currentUser ? (
            <>
              <div className="flex items-center space-x-2 text-white">
                <UserIcon className="w-5 h-5" />
                <span>{state.currentUser.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                to="/auth"
                state={{ isSignUp: true }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Up
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

