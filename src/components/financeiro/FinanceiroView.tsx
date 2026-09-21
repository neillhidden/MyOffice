import React from 'react';
import { Landmark, ArrowLeftRight, HandCoins } from 'lucide-react';
import { FinanceiroSubmodule } from '../layout/Sidebar';
import { BankView } from '../banks/BankView';
import { LancamentosView } from './LancamentosView';
import { DividasView } from './DividasView';

interface FinanceiroViewProps {
  activeSubmodule: FinanceiroSubmodule;
  onSelectSubmodule: (sub: FinanceiroSubmodule) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  activeSubmodule = 'Contas',
  onSelectSubmodule,
}) => {
  return (
    <div className="space-y-6">
      {/* Submodule Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="subnav-financeiro-contas-tab"
            onClick={() => onSelectSubmodule('Contas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeSubmodule === 'Contas'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Dívidas</span>
          </button>
        </div>
      </div>

      {/* Submodule View Content */}
      <div>
        {activeSubmodule === 'Contas' && <BankView />}
        {activeSubmodule === 'Lançamentos' && <LancamentosView />}
        {activeSubmodule === 'Dívidas' && <DividasView />}
      </div>
    </div>
  );
};
