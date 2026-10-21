import React from 'react';

export interface EmptyStateProps {
  id?: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    id?: string;
    variant?: 'primary' | 'secondary';
  };
  children?: React.ReactNode;
  className?: string;
  minHeight?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  title,
  description,
  icon: Icon,
  action,
  children,
  className = '',
  minHeight,
}) => {
  return (
    <div
      id={id}
      className={`rounded-xl border border-dashed border-slate-200 dark:border-dm-border bg-slate-50/60 dark:bg-dm-surface/50 p-6 sm:p-8 text-center flex flex-col items-center justify-center ${
        minHeight || ''
      } ${className}`}
    >
      {Icon && (
        <div className="mb-3 p-2.5 rounded-full bg-slate-100 dark:bg-dm-elevated text-slate-400 dark:text-dm-muted">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-dm-text">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          id={action.id}
          onClick={action.onClick}
          className={`mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
            action.variant === 'secondary'
              ? 'border border-slate-200 dark:border-dm-border text-slate-700 dark:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dm-btn-primary shadow-2xs'
          }`}
        >
          {action.label}
        </button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
