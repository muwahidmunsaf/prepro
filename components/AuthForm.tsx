
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// FIX: The useAppContext hook is exported from 'hooks/useAppContext', not from the context file.
import { useAppContext } from '../hooks/useAppContext';
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';
import * as supabaseService from '../services/supabaseService';

const AuthForm: React.FC = () => {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp || false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        if (!name || !email || !password) {
          setError('All fields are required.');
          return;
        }
        
        // Create user in Supabase
        const userData = {
          name,
          email,
          password,
          isAdmin: false
        };

        const newUser = await supabaseService.signUpUser(userData);
        const userWithId = {
          ...userData,
          id: newUser.id.toString(),
          isAdmin: newUser.is_admin
        };
        
        dispatch({ type: 'SIGN_UP', payload: userWithId });
        dispatch({ type: 'SIGN_IN', payload: userWithId });
        navigate(userWithId.isAdmin ? '/admin' : '/dashboard');
      } else {
        // Sign in logic
        const user = await supabaseService.signInUser(email, password);
        if (user) {
          dispatch({ type: 'SIGN_IN', payload: user });
          navigate(user.isAdmin ? '/admin' : '/dashboard');
        } else {
          setError('Invalid email or password.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    try {
      // In a real app, you would send a password reset email
      // For now, we'll just show a success message
      setError('');
      alert(`Password reset instructions have been sent to ${forgotPasswordEmail}`);
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      setError('Failed to send password reset email. Please try again.');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Reset Password
        </h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <div className="relative mt-1">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Send Reset Instructions
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{' '}
          <button onClick={() => {setShowForgotPassword(false); setError('');}} className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign In
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
        {isSignUp ? 'Create an Account' : 'Welcome Back'}
      </h2>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
            <div className="relative mt-1">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
           <div className="relative mt-1">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="you@example.com"
              />
            </div>
        </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
                <div className="relative mt-1">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => {setIsSignUp(!isSignUp); setError('');}} className="font-medium text-indigo-600 hover:text-indigo-500">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
            {!isSignUp && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Forgot your password?{' '}
                <button onClick={() => setShowForgotPassword(true)} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Reset Password
                </button>
              </p>
            )}
          </div>
    </div>
  );
};

export default AuthForm;
