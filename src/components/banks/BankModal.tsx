import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { Bank, BankType, CompanyCurrency } from '../../types/stock';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => void;
  bankToEdit?: Bank | null;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bankToEdit,
}) => {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [type, setType] = useState<BankType>('corrente');
  const [currency, setCurrency] = useState<CompanyCurrency>('Kz');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bankToEdit) {
      setName(bankToEdit.name);
      setAccountNumber(bankToEdit.accountNumber || '');
      setIban(bankToEdit.iban || '');
      setType(bankToEdit.type);
      setCurrency(bankToEdit.currency);
      setStatus(bankToEdit.status);
      setNotes(bankToEdit.notes || '');
    } else {
      setName('');
      setAccountNumber('');
      setIban('');
      setType('corrente');
      setCurrency('Kz');
      setStatus('ativa');
      setNotes('');
    }
    setError(null);
  }, [bankToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do banco ou conta é obrigatório.');
      return;
    }

    onSave({
      name: name.trim(),
      accountNumber: accountNumber.trim() || undefined,
      iban: iban.trim() || undefined,
      type,
      currency,
      status,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      id="modal-bank-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-bank-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-bank-title" className="text-base font-semibold text-slate-900 leading-tight">
                {bankToEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {bankToEdit
                  ? 'Atualize os dados cadastrais da instituição financeira'
                  : 'Cadastre um banco ou caixa para gerir os recebimentos e despesas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-bank-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome do Banco */}
          <div>
            <label htmlFor="bank-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome do Banco / Conta <span className="text-rose-500">*</span>
            </label>
            <input
              id="bank-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Banco Angolano de Investimentos (BAI)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Tipo de Conta & Moeda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="bank-type-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Conta <span className="text-rose-500">*</span>
              </label>
              <select
                id="bank-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as BankType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Conta Poupança</option>
                <option value="caixa_fisico">Caixa Físico / Numerário</option>
                <option value="banco_padrao">Banco padrão da empresa</option>
                <option value="carteira_digital">Carteira Digital</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="bank-currency-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Moeda <span className="text-rose-500">*</span>
              </label>
              <select
                id="bank-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CompanyCurrency)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="Kz">Kz (Kwanza Angolano)</option>
                <option value="USD">USD (Dólar Americano)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          {/* Número de Conta & IBAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="bank-acc-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Número de Conta <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="bank-acc-input"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ex.: 0004.0000.12345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="bank-iban-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                IBAN <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="bank-iban-input"
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="AO06.0040.0000.1234.5678.9012.3"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="bank-status-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estado da Conta <span className="text-rose-500">*</span>
            </label>
            <select
              id="bank-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ativa' | 'inativa')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            >
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="bank-notes-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observações Internas <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="bank-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Conta principal para liquidação de vendas no TPA Multicaixa"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors resize-none"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Regra de Integridade:</span> O saldo inicial ou alterações de capital nunca são definidos aqui. O saldo é sempre o reflexo estrito das Movimentações Bancárias registradas.
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              id="btn-cancel-bank-modal"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-bank-modal"
              className="px-5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            >
              {bankToEdit ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
