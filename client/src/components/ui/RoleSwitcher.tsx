import React from 'react';
import { ShieldCheck, User, Check, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchRole } = useApp();
  const { user: authUser } = useAuth();

  // Role Switcher Visibility: Only verified Administrators can view and preview perspectives
  if (authUser?.role !== 'ADMINISTRATOR') {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-dark-card/90 border border-slate-300 dark:border-dark-border rounded-xl text-xs">
      <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]" title="Administrator UI Perspective Preview">
        <Eye className="h-3 w-3" />
        <span className="hidden md:inline">Preview:</span>
      </div>
      <button
        type="button"
        onClick={() => switchRole('citizen')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
          currentUser.role === 'citizen'
            ? 'bg-white dark:bg-slate-800 text-brand-teal dark:text-brand-cyan shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Preview Citizen View (UI preview only; does not change account credentials or authorization)"
      >
        <User className="h-3.5 w-3.5" />
        <span>Citizen View</span>
        {currentUser.role === 'citizen' && <Check className="h-3 w-3 ml-0.5 text-brand-teal dark:text-brand-cyan" />}
      </button>

      <button
        type="button"
        onClick={() => switchRole('official')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
          currentUser.role === 'official'
            ? 'bg-white dark:bg-slate-800 text-brand-teal dark:text-brand-cyan shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Return to Municipal Staff Cockpit"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Staff View</span>
        {currentUser.role === 'official' && <Check className="h-3 w-3 ml-0.5 text-brand-teal dark:text-brand-cyan" />}
      </button>
    </div>
  );
};
