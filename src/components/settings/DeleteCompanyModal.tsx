import React from 'react';
import { AlertTriangle, ShieldAlert, X, Building2, Warehouse } from 'lucide-react';
import { Company, Warehouse as WarehouseType } from '../../types/stock';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (companyId: string) => void;
  company: Company | null;
  linkedWarehouses: WarehouseType[];
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  company,
  linkedWarehouses,
}) => {
  if (!isOpen || !company) return null;

  const hasLinkedWarehouses = linkedWarehouses.length > 0;

  return (
    <div
      id="modal-delete-company-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-delete-company-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200/80 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                hasLinkedWarehouses ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {hasLinkedWarehouses ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="modal-delete-company-title" className="text-sm font-semibold text-slate-900 leading-tight">
                {hasLinkedWarehouses ? 'Eliminação Bloqueada' : 'Eliminar Empresa'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasLinkedWarehouses ? 'Validação de integridade referencial' : 'Confirmação de exclusão'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-delete-company-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {hasLinkedWarehouses ? (
            /* Bloqueio por armazéns vinculados */
            <div className="space-y-3">
              <div
                id="alert-company-has-warehouses"
                className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-medium leading-relaxed"
              >
                Esta empresa não pode ser eliminada porque possui armazéns vinculados.
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                  <span>Armazéns vinculados ({linkedWarehouses.length}):</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {linkedWarehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60"
                    >
                      <span className="font-medium text-slate-800">{wh.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{wh.type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Para eliminar esta empresa, transfira ou remova primeiro os armazéns vinculados a ela nas definições.
              </p>
            </div>
          ) : (
            /* Confirmação de remoção permitida */
            <div className="space-y-3">
              <p
                id="text-delete-company-confirmation"
                className="text-xs text-slate-700 leading-relaxed font-medium"
              >
                Tens certeza de que pretende remover esta empresa?
              </p>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-900">{company.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-6">
                  NIF: <span className="font-mono text-slate-700">{company.nif}</span> • Moeda: {company.currency}
                </div>
              </div>

              <p className="text-[11px] text-rose-600 leading-normal">
                Esta ação é irreversível e excluirá permanentemente o registo desta empresa do sistema.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            {hasLinkedWarehouses ? (
              <button
                type="button"
                id="btn-dismiss-delete-blocked"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
              >
                Entendido
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-cancel-delete-company"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-company"
                  onClick={() => {
                    onConfirmDelete(company.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  Confirmar Remoção
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
