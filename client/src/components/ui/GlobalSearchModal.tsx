import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, complaints, currentUser } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = query.trim() === ''
    ? complaints.slice(0, 5)
    : complaints.filter(c =>
        c.trackingId.toLowerCase().includes(query.toLowerCase()) ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.location.address.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (complaintId: string) => {
    setIsSearchOpen(false);
    if (currentUser.role === 'official') {
      navigate(`/admin/complaints/${complaintId}`);
    } else {
      navigate(`/my-complaints`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl glass-panel shadow-2xl border border-slate-300 dark:border-dark-border overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-dark-border">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search complaints by ID (e.g. CF-2026-8942), title, road, or category..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching municipal complaints found for <span className="font-semibold text-slate-700 dark:text-slate-300">"{query}"</span>.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {query.trim() === '' ? 'Recent Active Reports' : `Matching Results (${filtered.length})`}
              </div>
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-card transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-cyan">
                        {item.trackingId}
                      </span>
                      <CategoryBadge category={item.category} size="sm" />
                      <PriorityBadge priority={item.priority} score={item.priorityScore} size="sm" />
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-teal dark:group-hover:text-brand-cyan">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="truncate max-w-xs">{item.location.address}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-dark-border text-[11px] text-slate-500">
          <span>Navigate with mouse or click result</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
