import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

interface PositiveBadgeProps {
  label: string;
  className?: string;
}

export const PositiveBadge: React.FC<PositiveBadgeProps> = ({ label, className = '' }) => {
  return (
    <span
      className={`dm-positive-badge inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-transparent dark:border-transparent dark:text-[var(--dm-text-primary)] dark:px-1 ${className}`}
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 dark:hidden" />
      <span className="dm-positive-dot hidden dark:inline-flex w-4 h-4 rounded-full bg-[var(--dm-btn-primary-bg)] text-[var(--dm-btn-primary-text)] items-center justify-center shrink-0">
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </span>
      <span className="dark:text-[var(--dm-text-primary)] dark:font-medium">{label}</span>
    </span>
  );
};
