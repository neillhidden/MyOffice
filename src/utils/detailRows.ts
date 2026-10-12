import type { HTMLAttributes } from 'react';

/** Keep nested actions and text selection independent from opening a record. */
export function detailRowProps(open: () => void): HTMLAttributes<HTMLTableRowElement> {
  return {
    tabIndex: 0,
    onClick(event) {
      if ((event.target as HTMLElement).closest('button,a,input,select,textarea,label') || window.getSelection()?.toString()) return;
      open();
    },
    onKeyDown(event) {
      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        open();
      }
    },
  };
}
