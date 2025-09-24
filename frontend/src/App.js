import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminDashboard from './components/dashboards/AdminDashboard';
import FoodCompanyDashboard from './components/dashboards/FoodCompanyDashboard';
import ITCompanyDashboard from './components/dashboards/ITCompanyDashboard';
import TasksDashboard from './components/TasksDashboard';
import Home from './components/Home';
import FriendsList from './components/FriendsList';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'user:', user, 'allowedRoles:', allowedRoles);
  console.log('User role:', user?.role, 'Type:', typeof user?.role);
  console.log('Allowed roles:', allowedRoles, 'Includes user role:', allowedRoles?.includes(user?.role));
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log('User role not allowed, redirecting to unauthorized');
    console.log('User role:', user?.role, 'Allowed roles:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('Access granted, rendering children');
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/food-company"
              element={
                <ProtectedRoute allowedRoles={['food', 'client']}>
                  <FoodCompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/it-company"
              element={
                <ProtectedRoute allowedRoles={['it', 'client']}>
                  <ITCompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <FriendsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-300 mb-4">You don't have permission to access this page.</p>
                    <button 
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
