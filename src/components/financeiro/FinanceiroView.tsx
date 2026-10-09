import { BusinessDocumentsView } from './BusinessDocumentsView';
import React from 'react';
import { Landmark, ArrowLeftRight, HandCoins, FileText } from 'lucide-react';
import { FinanceiroSubmodule } from '../layout/Sidebar';
import { BankView } from '../banks/BankView';
import { LancamentosView } from './LancamentosView';
import { DividasView } from './DividasView';

interface FinanceiroViewProps {
  activeSubmodule: FinanceiroSubmodule;
  onSelectSubmodule: (sub: FinanceiroSubmodule) => void;
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  activeSubmodule = 'Contas',
  onSelectSubmodule,
  externalSearchQuery,
  onExternalSearchChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Submodule Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="subnav-financeiro-contas-tab"
            onClick={() => onSelectSubmodule('Contas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeSubmodule === 'Contas'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Contas</span>
          </button>

          <button
            type="button"
            id="subnav-financeiro-lancamentos-tab"
            onClick={() => onSelectSubmodule('Lançamentos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeSubmodule === 'Lançamentos'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Lançamentos</span>
          </button>

          <button
            type="button"
            id="subnav-financeiro-dividas-tab"
            onClick={() => onSelectSubmodule('Dívidas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeSubmodule === 'Dívidas'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Dívidas</span>
          </button>
          <button type="button" id="subnav-financeiro-documentos-tab" onClick={() => onSelectSubmodule('Documentos')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${activeSubmodule === 'Documentos' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}><FileText className="w-3.5 h-3.5"/><span>Extratos e documentos</span></button>
        </div>
      </div>

      {/* Submodule View Content */}
      <div>
        {activeSubmodule === 'Documentos' && <BusinessDocumentsView />}
        {activeSubmodule === 'Contas' && <BankView />}
        {activeSubmodule === 'Lançamentos' && (
          <LancamentosView
            externalSearchQuery={externalSearchQuery}
            onExternalSearchChange={onExternalSearchChange}
          />
        )}
        {activeSubmodule === 'Dívidas' && <DividasView />}
      </div>
    </div>
  );
};
