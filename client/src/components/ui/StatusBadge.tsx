import React from 'react';
import { ComplaintPriority, ComplaintStatus } from '../../types';

export interface StatusBadgeProps {
  status?: ComplaintStatus | string;
  priority?: ComplaintPriority | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'md' }) => {
  // If priority is passed instead of status, render priority badge
  if (priority && !status) {
    return <PriorityBadge priority={priority as ComplaintPriority} size={size} />;
  }

  const normalizedStatus = (status || 'Submitted') as ComplaintStatus;

  const styles: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    Submitted: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
    },
    RECEIVED: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
    },
    Categorized: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500',
      border: 'border-purple-300 dark:border-purple-800',
    },
    TRIAGED: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500',
      border: 'border-purple-300 dark:border-purple-800',
    },
    Assigned: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
      border: 'border-blue-300 dark:border-blue-800',
    },
    DISPATCHED: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
      border: 'border-blue-300 dark:border-blue-800',
    },
    'In Progress': {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 animate-pulse',
      border: 'border-amber-300 dark:border-amber-800',
    },
    IN_PROGRESS: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 animate-pulse',
      border: 'border-amber-300 dark:border-amber-800',
    },
    Resolved: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      border: 'border-emerald-300 dark:border-emerald-800',
    },
    RESOLVED: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      border: 'border-emerald-300 dark:border-emerald-800',
    },
  };

  const style = styles[normalizedStatus] || styles.Submitted;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {normalizedStatus}
    </span>
  );
};

export interface PriorityBadgeProps {
  priority?: ComplaintPriority | string;
  score?: number;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority = 'Medium', score, size = 'md' }) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    Low: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-800',
    },
    LOW: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-800',
    },
    Medium: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-800',
    },
    ELEVATED: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-800',
    },
    High: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-800',
    },
    CRITICAL: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-800',
    },
    Urgent: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400 font-semibold',
      border: 'border-rose-400 dark:border-rose-800 shadow-sm shadow-rose-500/10',
    },
    CATASTROPHIC: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400 font-semibold',
      border: 'border-rose-400 dark:border-rose-800 shadow-sm shadow-rose-500/10',
    },
  };

  const style = styles[priority] || styles.Medium;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className="font-medium">{priority}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono text-[10px]">({score})</span>
      )}
    </span>
  );
};
