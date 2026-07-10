import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-4">
        {/* Loading Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin"></div>
          <Brain className="w-6 h-6 text-brand-accent absolute animate-pulse" />
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold animate-pulse">
          Securing Session...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and save original path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role violations back to generic dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
