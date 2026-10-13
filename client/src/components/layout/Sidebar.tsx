import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  ClipboardList,
  MapPin,
  BarChart3,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home,
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

import { SignOutConfirmModal } from '../ui/SignOutConfirmModal';

interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isAccountSwitch, setIsAccountSwitch] = useState(false);
  const { currentUser, resetDemoData, complaints } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Calculate live badge counts
  const openCount = complaints.filter(c => c.status !== 'Resolved').length;
  const urgentCount = complaints.filter(c => c.priority === 'Urgent' && c.status !== 'Resolved').length;

  const citizenLinks = [
    { to: '/', label: 'Overview', icon: <Home className="h-5 w-5" /> },
    { to: '/report', label: 'File Complaint', icon: <PlusCircle className="h-5 w-5" />, highlight: true },
    { to: '/my-complaints', label: 'My Complaints', icon: <ClipboardList className="h-5 w-5" />, badge: openCount },
    { to: '/map', label: 'Live City Map', icon: <MapPin className="h-5 w-5" /> },
  ];

  const officialLinks = [
    { to: '/admin', label: 'Executive Cockpit', icon: <BarChart3 className="h-5 w-5" /> },
    { to: '/admin/complaints', label: 'Triage Queue', icon: <Layers className="h-5 w-5" />, badge: urgentCount > 0 ? `${urgentCount} Urgent` : `${openCount}` },
    { to: '/map', label: 'Geospatial Radar', icon: <MapPin className="h-5 w-5" /> },
    { to: '/my-complaints', label: 'Citizen View', icon: <ClipboardList className="h-5 w-5" /> },
  ];

  const links = currentUser.role === 'official' ? officialLinks : citizenLinks;

  const handleLinkClick = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r
          bg-slate-900/95 dark:bg-dark-canvas/95 backdrop-blur-xl border-slate-800 dark:border-dark-border
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className={`relative flex items-center h-16 border-b border-slate-800 dark:border-dark-border ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-teal text-slate-950 font-black shadow-md shadow-brand-cyan/25 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 truncate">
                  CivicFlow
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">Smart Complaint Triage</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center transition-colors ${
              isCollapsed
                ? 'absolute -right-3 top-5 z-50 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 shadow-md text-slate-300 hover:text-white hover:bg-slate-700'
                : 'h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Role Indicator Card */}
        <div className="px-3 pt-3">
          <div className={`p-2.5 rounded-xl border border-slate-800 dark:border-dark-border/80 bg-slate-950/40 ${isCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-cyan/40"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                  <div className="flex items-center gap-1 text-[11px] text-brand-teal dark:text-brand-cyan font-medium">
                    {!isAuthenticated ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        Guest
                      </span>
                    ) : currentUser.role === 'official' ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Official
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Resident
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {currentUser.role === 'official' ? 'Municipal Operations' : 'Citizen Services'}
            </div>
          )}

          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={handleLinkClick}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                ${isActive
                  ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-teal/10 text-brand-cyan font-semibold border border-brand-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
              title={isCollapsed ? link.label : undefined}
            >
              <span className="shrink-0">{link.icon}</span>
              {!isCollapsed && (
                <span className="flex-1 truncate">{link.label}</span>
              )}
              {!isCollapsed && link.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                  typeof link.badge === 'string' && link.badge.includes('Urgent')
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions: Auth State & Reset Demo Data */}
        <div className="p-3 border-t border-slate-800 dark:border-dark-border space-y-1.5">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsAccountSwitch(false);
                  setShowSignOutModal(true);
                }}
                className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title="Sign out of CivicFlow"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Sign Out</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAccountSwitch(true);
                  setShowSignOutModal(true);
                }}
                className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 border border-transparent hover:border-brand-cyan/20 transition-all ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title="Switch to another user account (safely signs out first)"
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Switch Account</span>}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-brand-cyan hover:bg-brand-cyan/10 border border-brand-cyan/20 transition-all ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Sign in to CivicFlow"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign In</span>}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all demo complaints and state back to default seed dataset?')) {
                resetDemoData();
              }
            }}
            className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Reset to clean initial state"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Reset Demo Data</span>}
          </button>
        </div>
      </aside>

      <SignOutConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        isAccountSwitch={isAccountSwitch}
      />
    </>
  );
};
