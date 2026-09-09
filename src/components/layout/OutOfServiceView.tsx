import React from 'react';
import { Construction, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface OutOfServiceViewProps {
  moduleName: string;
  onGoToEstoque: () => void;
}

export const OutOfServiceView: React.FC<OutOfServiceViewProps> = ({
  moduleName,
  onGoToEstoque,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Construction className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-2">
        {moduleName}
      </h2>

      <p className="text-slate-500 max-w-md text-sm mb-6 leading-relaxed">
        Esta área ainda não está disponível nesta versão do MyOffice. A estrutura foi
        mantida para facilitar expansões futuras do sistema.
      </p>

      <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 max-w-md text-left mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Módulo Ativo: Estoque
        </div>
        <p className="text-xs text-slate-600 leading-normal">
          O módulo Estoque está 100% funcional com os submódulos: Armazém,
          Movimentação, Análise de produtos, Lista de compras e Defeituoso.
        </p>
      </div>

      <button
        type="button"
        id="btn-return-estoque"
        onClick={onGoToEstoque}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Estoque
      </button>
    </div>
  );
};
