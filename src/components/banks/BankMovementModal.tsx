import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, PlusCircle, MinusCircle, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { BankMovementType } from '../../types/stock';
import { formatCurrencyValue } from '../../utils/formatters';

interface BankMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBankId?: string | null;
}

export const BankMovementModal: React.FC<BankMovementModalProps> = ({
  isOpen,
  onClose,
  preSelectedBankId,
}) => {
  const {
    banks,
    companies,
    recordBankMovement,
    getBankBalance,
    getCompanyForBank,
    isCompanyDisabled,
    isBankOperationBlocked,
  } = useStock();

  // No operation preselected by default (Rule 1 & Rule 7)
  const [type, setType] = useState<BankMovementType | ''>('');
  const [bankId, setBankId] = useState<string>('');
  const [destinationBankId, setDestinationBankId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset all fields clean whenever modal opens (Rule 7 & 9)
  useEffect(() => {
    if (isOpen) {
      setType('');
      setBankId(preSelectedBankId || '');
      setDestinationBankId('');
      setAmount('');
      setReason('');
      setReference('');
      setResponsible('');
      setDate(new Date().toISOString().slice(0, 16));
      setErrors({});
    }
  }, [isOpen, preSelectedBankId]);

  // Operational banks: strictly exclude banks of disabled companies from selectors
  const operationalBanks = React.useMemo(() => {
    return banks.filter((b) => {
      if (b.id === 'bank-kianda') {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }
      const comp = getCompanyForBank(b.id);
      if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;
      return true;
    });
  }, [banks, companies, getCompanyForBank, isCompanyDisabled]);

  if (!isOpen) return null;

  const currentBank = banks.find((b) => b.id === bankId);
  const currentBalance = currentBank ? getBankBalance(currentBank.id) : 0;
  const currentBankBlock = isBankOperationBlocked(bankId);
  const destBankBlock = destinationBankId ? isBankOperationBlocked(destinationBankId) : { blocked: false };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!type) {
      errs.type = 'Selecione o tipo de operação (Entrada, Saída, Transferência ou Ajuste).';
    }

    if (!bankId) {
      errs.bankId = 'Selecione a conta bancária.';
    } else {
      const blockCheck = isBankOperationBlocked(bankId);
      if (blockCheck.blocked) {
        errs.bankId = blockCheck.message || 'Empresa parada — serviços indisponíveis.';
      }
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      errs.amount = 'O montante é obrigatório.';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Insira um montante válido superior a zero.';
    }

    if (!reason.trim()) {
      errs.reason = 'A descrição do motivo é obrigatória para conformidade e auditoria.';
    }

    if (type === 'transferencia') {
      if (!destinationBankId) {
        errs.destinationBankId = 'Selecione a conta de destino para a transferência.';
      } else if (destinationBankId === bankId) {
        errs.destinationBankId = 'A conta de destino não pode ser igual à conta de origem.';
      } else {
        const destCheck = isBankOperationBlocked(destinationBankId);
        if (destCheck.blocked) {
          errs.destinationBankId = destCheck.message || 'Empresa parada — serviços indisponíveis.';
        }
      }

      if (numAmount > currentBalance) {
        errs.amount = `Saldo insuficiente. Saldo disponível na conta de origem: ${formatCurrencyValue(
          currentBalance,
          currentBank?.currency || 'Kz'
        )}.`;
      }
    } else if (type === 'saida' && numAmount > currentBalance) {
      errs.amount = `Saldo insuficiente. Saldo disponível: ${formatCurrencyValue(
        currentBalance,
        currentBank?.currency || 'Kz'
      )}.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numAmount = parseFloat(amount);

    try {
      if (type === 'transferencia') {
        const destBank = banks.find((b) => b.id === destinationBankId);
        recordBankMovement({
          bankId,
          destinationBankId,
          type: 'saida',
          amount: numAmount,
          reason: `Transferência enviada para ${destBank?.name || 'outra conta'}: ${reason.trim()}`,
          reference: reference.trim() || undefined,
          responsible: responsible.trim() || 'Administrador',
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        });

        recordBankMovement({
          bankId: destinationBankId,
          type: 'entrada',
          amount: numAmount,
          reason: `Transferência recebida de ${currentBank?.name || 'outra conta'}: ${reason.trim()}`,
          reference: reference.trim() || undefined,
          responsible: responsible.trim() || 'Administrador',
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        });

        onClose();
        return;
      }

      if (type) {
        recordBankMovement({
          bankId,
          type,
          amount: numAmount,
          reason: reason.trim(),
          reference: reference.trim() || undefined,
          responsible: responsible.trim() || 'Administrador',
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        bankId: err.message || 'Empresa parada — serviços indisponíveis.',
      }));
    }
  };

  return (
    <div
      id="modal-bank-movement-overlay"
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-bank-movement-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200/80 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-bank-mov-title" className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                Nova Movimentação Bancária
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registo contabilístico de entrada, despesa, transferência ou ajuste
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-bank-movement-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector (No pre-selected option: Rule 1) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Operação <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id="btn-mov-type-entrada"
                onClick={() => {
                  setType('entrada');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'entrada'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 dark:ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                id="btn-mov-type-saida"
                onClick={() => {
                  setType('saida');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'saida'
                    ? 'border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-1 ring-rose-600 dark:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <MinusCircle className={`w-4 h-4 ${type === 'saida' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Saída</span>
              </button>

              <button
                type="button"
                id="btn-mov-type-transferencia"
                onClick={() => {
                  setType('transferencia');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'transferencia'
                    ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-1 ring-sky-600 dark:ring-sky-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <ArrowLeftRight className={`w-4 h-4 ${type === 'transferencia' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Transf.</span>
              </button>

              <button
                type="button"
                id="btn-mov-type-ajuste"
                onClick={() => {
                  setType('ajuste');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'ajuste'
                    ? 'border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600 dark:ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <SlidersHorizontal className={`w-4 h-4 ${type === 'ajuste' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Ajuste</span>
              </button>
            </div>
            {errors.type && (
              <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.type}</span>
              </p>
            )}
          </div>

          {/* Account Selection */}
          <div className={type === 'transferencia' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5' : ''}>
            <div>
              <label htmlFor="mov-bank-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {type === 'transferencia' ? 'Conta de Origem' : 'Conta Bancária'} <span className="text-rose-500">*</span>
              </label>
              <select
                id="mov-bank-select"
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value);
                  if (errors.bankId) setErrors((prev) => ({ ...prev, bankId: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                  errors.bankId
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                }`}
              >
                <option value="">Selecione a conta bancária...</option>
                {operationalBanks.map((b) => {
                  const comp = getCompanyForBank(b.id);
                  const isStopped = comp?.status === 'parada';
                  return (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={isStopped}
                      className={isStopped ? 'text-slate-400 bg-slate-100 dark:bg-slate-800' : ''}
                    >
                      {b.name} ({b.currency}){isStopped ? ' — [PARADA - Serviços indisponíveis]' : ` • Saldo: ${formatCurrencyValue(getBankBalance(b.id), b.currency)}`}
                    </option>
                  );
                })}
              </select>
              {errors.bankId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.bankId}</span>
                </p>
              )}
              {currentBankBlock.blocked && !errors.bankId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{currentBankBlock.message || 'Empresa parada — serviços indisponíveis.'}</span>
                </p>
              )}
            </div>

            {type === 'transferencia' && (
              <div>
                <label htmlFor="mov-dest-bank-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Conta de Destino <span className="text-rose-500">*</span>
                </label>
                <select
                  id="mov-dest-bank-select"
                  value={destinationBankId}
                  onChange={(e) => {
                    setDestinationBankId(e.target.value);
                    if (errors.destinationBankId) setErrors((prev) => ({ ...prev, destinationBankId: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 ${
                    errors.destinationBankId || destBankBlock.blocked
                      ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                  }`}
                >
                  <option value="">Selecione a conta de destino...</option>
                  {operationalBanks
                    .filter((b) => b.id !== bankId)
                    .map((b) => {
                      const comp = getCompanyForBank(b.id);
                      const isStopped = comp?.status === 'parada';
                      return (
                        <option
                          key={b.id}
                          value={b.id}
                          disabled={isStopped}
                          className={isStopped ? 'text-slate-400 bg-slate-100 dark:bg-slate-800' : ''}
                        >
                          {b.name} ({b.currency}){isStopped ? ' — [PARADA - Serviços indisponíveis]' : ` • Saldo: ${formatCurrencyValue(getBankBalance(b.id), b.currency)}`}
                        </option>
                      );
                    })}
                </select>
                {errors.destinationBankId && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.destinationBankId}</span>
                  </p>
                )}
                {destBankBlock.blocked && !errors.destinationBankId && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{destBankBlock.message || 'Empresa parada — serviços indisponíveis.'}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Montante & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="mov-amount-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor ({currentBank?.currency || 'Kz'}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="mov-amount-input"
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-colors font-medium ${
                  errors.amount
                    ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="mov-date-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data & Hora
              </label>
              <input
                id="mov-date-input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Motivo / Descrição */}
          <div>
            <label htmlFor="mov-reason-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo / Descrição <span className="text-rose-500">*</span>
            </label>
            <input
              id="mov-reason-input"
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="Ex.: Depósito de vendas diárias ou Pagamento de fornecedor"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-colors ${
                errors.reason
                  ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-400'
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.reason}</span>
              </p>
            )}
          </div>

          {/* Documento / Referência & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="mov-ref-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ref. / Nº Documento <span className="text-slate-400 dark:text-slate-500 font-normal">(Opcional)</span>
              </label>
              <input
                id="mov-ref-input"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex.: BPO-9821 / Recibo #44"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="mov-resp-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Responsável
              </label>
              <input
                id="mov-resp-input"
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Administrador"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-bank-movement"
              disabled={currentBankBlock.blocked || destBankBlock.blocked}
              title={currentBankBlock.blocked ? currentBankBlock.message : destBankBlock.blocked ? destBankBlock.message : undefined}
              className={`px-5 py-2 text-xs font-medium rounded-xl shadow-xs transition-colors ${
                currentBankBlock.blocked || destBankBlock.blocked
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer'
              }`}
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
