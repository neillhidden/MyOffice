import React from 'react';
import {
  X,
  FileEdit,
  Trash2,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { ProductDraft } from '../../types/stock';
import { formatDateTime, formatKwanza } from '../../utils/formatters';

interface DraftsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeDraft: (draft: ProductDraft) => void;
}

export const DraftsListModal: React.FC<DraftsListModalProps> = ({
  isOpen,
  onClose,
  onResumeDraft,
}) => {
  const { productDrafts, deleteProductDraft } = useStock();

  if (!isOpen) return null;

  const getConditionLabel = (cond?: string) => {
    switch (cond) {
      case 'novo':
        return 'Novo';
      case 'novo_usado':
        return 'Novo e usado';
      case 'usado':
        return 'Usado';
      case 'troca':
        return 'Troca';
      default:
        return 'Não especificado';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Produtos Não Concluídos (Rascunhos)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {productDrafts.length === 1
                  ? '1 registo pendente guardado'
                  : `${productDrafts.length} registos pendentes guardados`}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-drafts-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-white dark:bg-slate-900">
          {productDrafts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-3">
                <FileEdit className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum rascunho guardado</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Ao registar um novo produto, use o botão "Guardar rascunho" para guardar o progresso e retomar a qualquer momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {productDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {draft.mainImage ? (
                      <img
                        src={draft.mainImage}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                        <FileEdit className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {draft.name || 'Produto sem título'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium">
                          {draft.category || 'Sem categoria'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {getConditionLabel(draft.condition)}
                        </span>
                        {typeof draft.salePrice === 'number' && draft.salePrice > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                              {formatKwanza(draft.salePrice)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Guardado em {formatDateTime(draft.savedAt)}
                        </span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Parou no Passo {draft.currentStep || 1} de 3
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      title="Eliminar rascunho"
                      aria-label="Eliminar rascunho"
                      onClick={() => deleteProductDraft(draft.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onResumeDraft(draft);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Continuar registo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Os rascunhos são armazenados localmente no navegador.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
