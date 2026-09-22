import React, { useState, useEffect } from 'react';
import { X, HandCoins, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Debt, DebtType, CounterpartyType } from '../../types/stock';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
}) => {
  const { companies, suppliers, clients, employees, addDebt, updateDebt } = useStock();

  const [type, setType] = useState<DebtType>(debtToEdit?.type || 'a_pagar');
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>(
    debtToEdit?.counterpartyType || 'fornecedor'
  );
  const [counterpartyName, setCounterpartyName] = useState<string>(
    debtToEdit?.counterpartyName || ''
  );
  const [counterpartyId, setCounterpartyId] = useState<string>(
    debtToEdit?.counterpartyId || ''
  );
  const [companyId, setCompanyId] = useState<string>(
    debtToEdit?.companyId || companies[0]?.id || ''
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    debtToEdit ? String(debtToEdit.totalAmount) : ''
  );
  const [dueDate, setDueDate] = useState<string>(debtToEdit?.dueDate || '');
  const [notes, setNotes] = useState<string>(debtToEdit?.notes || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debtToEdit) {
      setType(debtToEdit.type);
      setCounterpartyType(debtToEdit.counterpartyType);
      setCounterpartyName(debtToEdit.counterpartyName);
      setCounterpartyId(debtToEdit.counterpartyId || '');
      setCompanyId(debtToEdit.companyId);
      setTotalAmount(String(debtToEdit.totalAmount));
      setDueDate(debtToEdit.dueDate || '');
      setNotes(debtToEdit.notes || '');
    } else {
      setType('a_pagar');
      setCounterpartyType('fornecedor');
      setCounterpartyName('');
      setCounterpartyId('');
      setCompanyId(companies[0]?.id || '');
      setTotalAmount('');
      setDueDate('');
      setNotes('');
    }
    setError(null);
  }, [debtToEdit, isOpen, companies]);

  if (!isOpen) return null;

  // Handle counterparty selection
  const handleSelectPredefinedCounterparty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCounterpartyId(val);

    if (!val) {
      return;
    }

    if (counterpartyType === 'fornecedor') {
      const sup = suppliers.find((s) => s.id === val);
      if (sup) setCounterpartyName(sup.name);
    } else if (counterpartyType === 'cliente') {
      const cli = clients.find((c) => c.id === val);
      if (cli) setCounterpartyName(cli.name);
    } else if (counterpartyType === 'funcionario') {
      const emp = employees.find((em) => em.id === val);
      if (emp) setCounterpartyName(emp.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido superior a zero.');
      return;
    }

    if (!counterpartyName.trim()) {
      setError('Informe o nome da pessoa ou entidade contraparte.');
      return;
    }

    if (!companyId) {
      setError('Selecione a empresa associada a esta dívida.');
      return;
    }

    if (debtToEdit) {
      updateDebt(debtToEdit.id, {
        type,
        counterpartyType,
        counterpartyName: counterpartyName.trim(),
        counterpartyId: counterpartyId || undefined,
        companyId,
        totalAmount: numAmount,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        type,
        counterpartyType,
        counterpartyName: counterpartyName.trim(),
        counterpartyId: counterpartyId || undefined,
        companyId,
        totalAmount: numAmount,
        currency: 'Kz',
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div
      id="modal-debt-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-debt-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-debt-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {debtToEdit ? 'Editar Dívida' : 'Registar Nova Dívida'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Controlo de compromisso a pagar ou a receber
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Dívida */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Dívida <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-debt-type-a-pagar"
                onClick={() => {
                  setType('a_pagar');
                  if (counterpartyType === 'cliente') setCounterpartyType('fornecedor');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  type === 'a_pagar'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Conta a Pagar (Saída futura)
              </button>
              <button
                type="button"
                id="btn-debt-type-a-receber"
                onClick={() => {
                  setType('a_receber');
                  if (counterpartyType === 'fornecedor') setCounterpartyType('cliente');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  type === 'a_receber'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Conta a Receber (Entrada futura)
              </button>
            </div>
          </div>

          {/* Contraparte & Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-debt-counterparty-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Contraparte
              </label>
              <select
                id="select-debt-counterparty-type"
                value={counterpartyType}
                onChange={(e) => {
                  setCounterpartyType(e.target.value as CounterpartyType);
                  setCounterpartyId('');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
              >
                <option value="fornecedor">Fornecedor</option>
                <option value="cliente">Cliente</option>
                <option value="funcionario">Funcionário</option>
                <option value="outro">Outro / Avulso</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-predefined-counterparty" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selecionar Cadastrado (Opcional)
              </label>
              <select
                id="select-predefined-counterparty"
                value={counterpartyId}
                onChange={handleSelectPredefinedCounterparty}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
              >
                <option value="">Digitar nome manualmente...</option>
                {counterpartyType === 'fornecedor' &&
                  suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                {counterpartyType === 'cliente' &&
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                {counterpartyType === 'funcionario' &&
                  employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="input-debt-counterparty-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Entidade / Contraparte <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-debt-counterparty-name"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="Ex: Fornecedor Central, João Silva, etc."
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                required
              />
            </div>
          </div>

          {/* Empresa & Valor Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-debt-company" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Empresa do MyOffice <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-debt-company"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                required
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="input-debt-total-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total da Dívida <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  id="input-debt-total-amount"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 font-mono"
                  required
                />
                <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  Kz
                </span>
              </div>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div>
            <label htmlFor="input-debt-due-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Vencimento (Opcional)
            </label>
            <input
              type="date"
              id="input-debt-due-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
            />
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="textarea-debt-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Condições
            </label>
            <textarea
              id="textarea-debt-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fatura #300, pagamento parcelado em 2x..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-debt"
              className="px-5 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              {debtToEdit ? 'Guardar alterações' : 'Confirmar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
