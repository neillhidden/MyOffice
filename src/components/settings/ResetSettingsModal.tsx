import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  CheckCircle2,
  Layers,
  History,
  ShieldAlert,
  Database,
  Info,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

/**
 * NOTA DE SEGURANÇA / PERMISSÕES FUTURAS:
 * Quando o sistema de permissões do Empregado for implementado em versões futuras,
 * as ações de Reset (Zerar Histórico e Zerar Tudo) deverão ficar restritas
 * exclusivamente ao papel de Administrador.
 */

type ResetActionType = 'history' | 'all' | null;

export const ResetSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  actionType: ResetActionType;
}> = ({ isOpen, onClose, actionType }) => {
  const { resetHistory, resetAll, canResetData } = useStock();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  if (!isOpen || !actionType) return null;

  const isResetHistory = actionType === 'history';

  // Frases de confirmação obrigatórias distintas para cada ação
  const REQUIRED_PHRASE = isResetHistory ? 'ZERAR HISTÓRICO' : 'ZERAR TUDO';
  const isConfirmed = confirmationInput.trim() === REQUIRED_PHRASE;

  const handleClose = () => {
    setConfirmationInput('');
    setIsSuccess(false);
    setResetError(null);
    onClose();
  };

  const handleExecuteReset = () => {
    if (!isConfirmed || !canResetData) return;

    try {
      if (isResetHistory) resetHistory();
      else resetAll();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Não foi possível repor os dados.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  return (
    <div
      id="reset-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="reset-modal-content"
        className={`bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border transition-all ${
          isResetHistory ? 'border-amber-300' : 'border-rose-400'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 flex items-start justify-between border-b ${
            isResetHistory
              ? 'bg-amber-50/80 border-amber-100 text-amber-950'
              : 'bg-rose-50/80 border-rose-100 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isResetHistory ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isResetHistory ? (
                <History className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                  isResetHistory
                    ? 'bg-amber-200/80 text-amber-900'
                    : 'bg-rose-200/80 text-rose-900'
                }`}
              >
                Ação Crítica • Irreversível
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isResetHistory ? 'Zerar Histórico Transacional' : 'Zerar Todo o Sistema (Reset de Fábrica)'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-reset-modal"
            onClick={handleClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(resetError || !canResetData) && <p role="alert" className="px-6 py-3 text-xs text-rose-700 dark:text-rose-400">{resetError || 'Reposição bloqueada para preservar o histórico operacional e financeiro.'}</p>}
        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {isResetHistory ? 'Histórico zerado com sucesso!' : 'Sistema resetado com sucesso!'}
              </h4>
              <p className="text-xs text-slate-500">
                Os dados locais foram repostos.
              </p>
            </div>
          ) : (
            <>
              {/* Alerta de Irreversibilidade */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  isResetHistory
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                <div>
                  <strong className="font-semibold block mb-0.5">
                    Aviso Importante: Esta ação é permanente e irreversível!
                  </strong>
                  <span>
                    {isResetHistory
                      ? 'Todas as movimentações e registos operacionais passados serão eliminados permanentemente. Não será possível recuperar o histórico de transações.'
                      : 'Todos os produtos, empresas, armazéns, contactos e configurações serão eliminados. O sistema retornará ao estado de uma instalação limpa.'}
                  </span>
                </div>
              </div>

              {/* Detalhamento do que é apagado e do que permanece */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>O que será apagado:</span>
                  </span>
                  <ul className="text-slate-600 space-y-1 pl-5 list-disc text-[11px]">
                    {isResetHistory ? (
                      <>
                        <li>Todas as Movimentações de Estoque (incluindo removidas/defeitos)</li>
                        <li>Todas as Movimentações Bancárias (extratos)</li>
                        <li>Todas as Vendas e Transportes do Caixa</li>
                        <li>Todas as Notificações do sistema</li>
                        <li>Todos os eventos e apontamentos do Calendário</li>
                      </>
                    ) : (
                      <>
                        <li>Todo o histórico transacional (Estoque, Bancos, Vendas, Notificações, Calendário)</li>
                        <li>Todos os Produtos e Variações cadastradas</li>
                        <li>Todas as Empresas, Armazéns e Bancos</li>
                        <li>Todos os Contactos (Funcionários, Clientes, Fornecedores)</li>
                        <li>Todas as Listas de Compras e Agendas</li>
                      </>
                    )}
                  </ul>
                </div>

                {isResetHistory && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>O que NÃO será apagado (permanece intacto):</span>
                    </span>
                    <ul className="text-emerald-800 space-y-1 pl-5 list-disc text-[11px]">
                      <li>Produtos e Variações cadastradas (catálogo preservado)</li>
                      <li>Empresas, Armazéns e Bancos (com saldos/quantidades recalculados para zero)</li>
                      <li>Contactos (Funcionários, Clientes, Fornecedores e Afiliados)</li>
                      <li>Estrutura de Agendas e Listas de Compras</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Campo de confirmação por texto */}
              <div className="pt-2">
                <label
                  htmlFor="input-reset-confirmation"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Para confirmar, digite exatamente{' '}
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {REQUIRED_PHRASE}
                  </span>
                  :
                </label>
                <input
                  id="input-reset-confirmation"
                  type="text"
                  autoComplete="off"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={`Digite ${REQUIRED_PHRASE}`}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isSuccess && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancel-reset"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="btn-confirm-reset"
              disabled={!isConfirmed || !canResetData}
              onClick={handleExecuteReset}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-xs ${
                !isConfirmed
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : isResetHistory
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-98'
                  : 'bg-rose-700 hover:bg-rose-800 active:scale-98 animate-pulse'
              }`}
            >
              {isResetHistory ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirmar e Zerar Histórico</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar e Zerar Absolutamente Tudo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
