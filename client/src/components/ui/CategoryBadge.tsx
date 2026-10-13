import React from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Droplets,
  Trash2,
  Radio,
  HelpCircle
} from 'lucide-react';
import { ComplaintCategory } from '../../types';

interface CategoryBadgeProps {
  category: ComplaintCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
  size = 'md',
}) => {
  const meta: Record<
    ComplaintCategory,
    { icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    'Roads': {
      icon: <AlertTriangle className="h-3 w-3" />,
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800/60',
    },
    'Street Lighting': {
      icon: <Lightbulb className="h-3 w-3" />,
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-300 dark:border-cyan-800/60',
    },
    'Water Supply': {
      icon: <Droplets className="h-3 w-3" />,
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800/60',
    },
    'Sanitation': {
      icon: <Trash2 className="h-3 w-3" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800/60',
    },
    'Traffic Signals': {
      icon: <Radio className="h-3 w-3" />,
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800/60',
    },
  };

  const item = meta[category] || {
    icon: <HelpCircle className="h-3 w-3" />,
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border ${item.bg} ${item.text} ${item.border} ${sizeClasses}`}
    >
      {showIcon && item.icon}
      {category}
    </span>
  );
};
