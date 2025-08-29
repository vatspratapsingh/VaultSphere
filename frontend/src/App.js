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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
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
                       <ProtectedRoute allowedRoles={['food']}>
                         <FoodCompanyDashboard />
                       </ProtectedRoute>
                     }
                   />
                   <Route
                     path="/it-company"
                     element={
                       <ProtectedRoute allowedRoles={['it']}>
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
                 </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
