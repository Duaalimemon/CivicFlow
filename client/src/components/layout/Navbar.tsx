import React, { useState } from 'react';
import { Menu, Search, Sun, Moon, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from '../ui/RoleSwitcher';
import { NotificationsPopover } from '../ui/NotificationsPopover';
import { Button } from '../ui/Button';
import { SignOutConfirmModal } from '../ui/SignOutConfirmModal';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const { theme, toggleTheme, setIsSearchOpen, currentUser } = useApp();
  const { isAuthenticated } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-dark-canvas/80 backdrop-blur-xl border-b border-slate-200 dark:border-dark-border">
      {/* Left side: Mobile menu toggle + Global search trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card lg:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border hover:border-brand-teal dark:hover:border-brand-cyan transition-all w-48 sm:w-64"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <span className="truncate">Search tracking ID or keyword...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Role Switcher + Notifications + Theme Toggle + Quick CTA + Auth Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher (visible exclusively to verified Administrators) */}
        <RoleSwitcher />

        {/* Notifications Popover */}
        <NotificationsPopover />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card transition-colors border border-transparent hover:border-slate-300 dark:hover:border-dark-border"
          aria-label="Toggle dark/light theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </button>

        {/* Primary Action Button */}
        {currentUser.role === 'citizen' ? (
          <Button
            size="sm"
            onClick={() => navigate('/report')}
            leftIcon={<Plus className="h-4 w-4" />}
            className="hidden sm:inline-flex"
          >
            File Complaint
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/complaints')}
            className="hidden sm:inline-flex"
          >
            Manage Queue
          </Button>
        )}

        {/* Auth Action: Sign In when logged out, Sign Out when authenticated */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-dark-card transition-colors border border-transparent hover:border-slate-300 dark:border-dark-border"
            aria-label="Sign out"
            title="Sign out of CivicFlow"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex"
          >
            Sign In
          </Button>
        )}
      </div>

      <SignOutConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </header>
  );
};
