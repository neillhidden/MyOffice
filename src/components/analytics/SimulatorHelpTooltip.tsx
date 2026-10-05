import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';
import { SIMULATOR_HELP_TEXTS, SimulatorHelpEntry } from './simulatorHelpTexts';

interface SimulatorHelpTooltipProps {
  helpKey?: keyof typeof SIMULATOR_HELP_TEXTS | string;
  customEntry?: SimulatorHelpEntry;
  className?: string;
}

export const SimulatorHelpTooltip: React.FC<SimulatorHelpTooltipProps> = ({
  helpKey,
  customEntry,
  className = '',
}) => {
  const entry: SimulatorHelpEntry | undefined =
    customEntry || (helpKey ? SIMULATOR_HELP_TEXTS[helpKey] : undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [isPinnedByTap, setIsPinnedByTap] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(320, window.innerWidth - 24);
    const estimatedHeight = 230;
    const margin = 12;

    // Horizontal clamping so it never overflows left or right edge
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }

    // Vertical placement: prefer below unless too close to bottom edge
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' =
      spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';

    const top = placement === 'bottom' ? rect.bottom + 8 : Math.max(margin, rect.top - 8);

    setCoords({ top, left, placement });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsPinnedByTap(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setIsPinnedByTap(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  if (!entry) return null;

  const handleMouseEnter = () => {
    clearCloseTimer();
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isPinnedByTap) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 140);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearCloseTimer();
    updatePosition();
    if (isOpen && isPinnedByTap) {
      setIsOpen(false);
      setIsPinnedByTap(false);
    } else {
      setIsOpen(true);
      setIsPinnedByTap(true);
    }
  };

  const handleFocus = () => {
    clearCloseTimer();
    updatePosition();
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && tooltipRef.current?.contains(related)) return;
    if (!isPinnedByTap) {
      setIsOpen(false);
    }
  };

  return (
    <span
      className={`inline-flex items-center align-middle select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Ajuda sobre ${entry.title}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-700 dark:text-dm-muted dark:hover:text-dm-text focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-dm-text transition-colors cursor-pointer shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={() => clearCloseTimer()}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
              width: 'min(320px, calc(100vw - 24px))',
              zIndex: 9999,
            }}
            className="bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-xl p-3.5 shadow-lg text-left text-xs leading-relaxed text-slate-700 dark:text-dm-text"
          >
            <div className="flex items-start justify-between gap-2 pb-1.5 mb-2 border-b border-slate-100 dark:border-dm-border">
              <span className="font-bold text-slate-900 dark:text-dm-text text-xs">
                {entry.title}
              </span>
              <button
                type="button"
                aria-label="Fechar ajuda"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsPinnedByTap(false);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:text-dm-muted dark:hover:text-dm-text cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <p className="text-slate-700 dark:text-dm-text">
                <strong className="font-semibold text-slate-900 dark:text-dm-text">
                  O que é:{' '}
                </strong>
                {entry.whatIs}
              </p>
              <p className="text-slate-600 dark:text-dm-muted">
                <strong className="font-semibold text-slate-800 dark:text-dm-text">
                  No cálculo:{' '}
                </strong>
                {entry.purpose}
              </p>
              <p className="text-slate-600 dark:text-dm-muted">
                <strong className="font-semibold text-slate-800 dark:text-dm-text">
                  Como usar:{' '}
                </strong>
                {entry.howToUse}
              </p>
              {entry.example && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-dm-border text-[11px] text-slate-600 dark:text-dm-muted bg-slate-50/80 dark:bg-dm-page px-2.5 py-1.5 rounded-lg">
                  <strong className="font-semibold text-slate-800 dark:text-dm-text">
                    Exemplo:{' '}
                  </strong>
                  {entry.example}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </span>
  );
};
