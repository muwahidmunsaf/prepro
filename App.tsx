import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import CategorySelector from './components/CategorySelector';
import TestInstructions from './components/TestInstructions';
import TestScreen from './components/TestScreen';
import ResultsPage from './components/ResultsPage';

const PrivateRoute: React.FC<{ children: React.ReactElement; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { state } = useAppContext();
  if (!state.currentUser) {
    return <Navigate to="/" />;
  }
  if (adminOnly && !state.currentUser.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    return <PrivateRoute adminOnly={true}>{children}</PrivateRoute>;
}

const AppRoutes = () => {
    // Supabase-backed app: no mock seeding
    const { state } = useAppContext();

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
                <Routes>
                    <Route path="/" element={!state.currentUser ? <LandingPage /> : <Navigate to={state.currentUser.isAdmin ? "/admin" : "/dashboard"} />} />
                    <Route path="/auth" element={!state.currentUser ? <AuthForm /> : <Navigate to={state.currentUser.isAdmin ? "/admin" : "/dashboard"} />} />
                    
                    <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
                    <Route path="/tests" element={<PrivateRoute><CategorySelector /></PrivateRoute>} />
                    <Route path="/test/:testId/instructions" element={<PrivateRoute><TestInstructions /></PrivateRoute>} />
                    <Route path="/test/:testId" element={<PrivateRoute><TestScreen /></PrivateRoute>} />
                    <Route path="/results/:resultId" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
                    
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
};

const App = () => (
    <AppProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AppProvider>
);

export default App;