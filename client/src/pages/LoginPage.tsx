import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Building2,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const { login, register, isAuthenticated, isLoading: isAuthLoading, user: authUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'official'>('citizen');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect immediately to role-specific dashboard
  if (isAuthLoading) {
    return (
      <div
        className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-brand-cyan animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Verifying CivicFlow Authorization...
        </p>
      </div>
    );
  }

  if (isAuthenticated && authUser) {
    if (authUser.role === 'CIVIC_OFFICIAL' || authUser.role === 'ADMINISTRATOR') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/my-complaints" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (isRegister && password.length < 8) {
      setError('Registration password must be at least 8 characters.');
      return;
    } else if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const fullName = email.split('@')[0].replace(/[._]/g, ' ');
        const user = await register({ email, password, fullName });
        if (user.role === 'CIVIC_OFFICIAL' || user.role === 'ADMINISTRATOR') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/my-complaints', { replace: true });
        }
      } else {
        const user = await login(email, password);
        if (user.role === 'CIVIC_OFFICIAL' || user.role === 'ADMINISTRATOR') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/my-complaints', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = (role: 'citizen' | 'official') => {
    setSelectedRole(role);
    if (role === 'citizen') {
      setEmail('alex.rivera@community.org');
      setPassword('citizen1234');
    } else {
      setEmail('a.pendelton@cityfix.gov');
      setPassword('director2026');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-teal text-slate-950 font-black shadow-lg shadow-brand-cyan/20 mb-2">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {isRegister ? 'Create CivicFlow Account' : 'Sign in to CivicFlow'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Public Citizen Registration (CITIZEN role enforced)'
              : 'Smart Municipal Complaint Triage System'}
          </p>
        </div>

        {/* Demo Fast-Select Role Cards (Development Mode Only) */}
        {import.meta.env.DEV && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              One-Click Demo Profiles (Development Only)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('citizen')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'citizen'
                    ? 'border-brand-cyan bg-cyan-500/10 dark:bg-brand-cyan/10 ring-1 ring-brand-cyan text-brand-teal dark:text-brand-cyan'
                    : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-400 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <User className="h-3.5 w-3.5" />
                  <span>Alex Rivera</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Community Citizen</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoFill('official')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'official'
                    ? 'border-brand-cyan bg-cyan-500/10 dark:bg-brand-cyan/10 ring-1 ring-brand-cyan text-brand-teal dark:text-brand-cyan'
                    : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-400 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Dir. Pendelton</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Roads Directorate</p>
              </button>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@organization.gov"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {isRegister ? 'Register Citizen Account' : 'Authenticate & Enter'}
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Want to register a new citizen?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
