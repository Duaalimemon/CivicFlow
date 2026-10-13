import React, { useState } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAccountSwitch?: boolean;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  isAccountSwitch = false,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await logout();
      onClose();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to terminate session on server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
    >
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h2 id="signout-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isAccountSwitch ? 'Switch User Account' : 'Sign Out of CivicFlow'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active user: <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.fullName || user?.email}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isAccountSwitch
            ? 'Switching accounts requires safely ending your current authenticated session on the server. You will be redirected to the sign-in screen to authenticate with a different profile.'
            : 'Are you sure you want to sign out? Your institutional session token will be invalidated on the server.'}
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            {isAccountSwitch ? 'Sign Out & Switch' : 'Confirm Sign Out'}
          </Button>
        </div>
      </div>
    </div>
  );
};
