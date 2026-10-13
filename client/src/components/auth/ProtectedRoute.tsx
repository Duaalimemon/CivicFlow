import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4" role="status" aria-live="polite">
        <div className="h-10 w-10 border-3 border-brand-teal dark:border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
          Verifying CivicFlow Authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Normalize role matching across both frontend and backend role string representations
  const normalizedUserRole = user.role.toLowerCase().replace('civic_', '').replace('administrator', 'admin');
  const isAuthorized = !allowedRoles || allowedRoles.some(allowed => {
    const normAllowed = allowed.toLowerCase().replace('civic_', '').replace('administrator', 'admin');
    return normAllowed === normalizedUserRole || (allowed === 'official' && user.role === 'ADMINISTRATOR');
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="p-8 rounded-2xl glass-panel shadow-xl text-center max-w-md space-y-4 border border-amber-500/30">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Staff Access Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This operational cockpit is restricted to verified Municipal Officials. You are currently in <span className="font-semibold text-brand-teal dark:text-brand-cyan">{normalizedUserRole}</span> mode.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In as Official
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Back to Overview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
