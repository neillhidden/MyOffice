import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { Company, CompanyCurrency, CompanyStatus } from '../../types/stock';
import { useStock } from '../../context/StockContext';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => void;
  companyToEdit?: Company | null;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyToEdit,
}) => {
  const { banks } = useStock();
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [logo, setLogo] = useState('');
  const [currency, setCurrency] = useState<CompanyCurrency>('Kz');
  const [status, setStatus] = useState<CompanyStatus>('ativa');
  const [principalBankId, setPrincipalBankId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name);
      setNif(companyToEdit.nif);
      setAddress(companyToEdit.address);
      setContact(companyToEdit.contact);
      setLogo(companyToEdit.logo || '');
      setCurrency(companyToEdit.currency);
      setStatus(companyToEdit.status);
      setPrincipalBankId(companyToEdit.principalBankId || '');
    } else {
      setName('');
      setNif('');
      setAddress('');
      setContact('');
      setLogo('');
      setCurrency('Kz');
      setStatus('ativa');
      setPrincipalBankId(banks[0]?.id || '');
    }
    setError(null);
  }, [companyToEdit, isOpen, banks]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da empresa é obrigatório.');
      return;
    }
    if (!nif.trim()) {
      setError('O NIF da empresa é obrigatório.');
      return;
    }
    if (!address.trim()) {
      setError('O endereço da empresa é obrigatório.');
      return;
    }
    if (!contact.trim()) {
      setError('O contacto (telefone / email) é obrigatório.');
      return;
    }

    onSave({
      name: name.trim(),
      nif: nif.trim(),
      address: address.trim(),
      contact: contact.trim(),
      logo: logo.trim() || undefined,
      currency,
      status,
      principalBankId: principalBankId || undefined,
    });
    onClose();
  };

  return (
    <div
      id="modal-company-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-company-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200/80 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-company-title" className="text-base font-semibold text-slate-900 leading-tight">
                {companyToEdit ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {companyToEdit ? 'Atualize as informações cadastrais da organização' : 'Cadastre uma entidade empresarial base do sistema'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-company-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              id="company-form-error"
              className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome da Empresa */}
          <div>
            <label htmlFor="company-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome da Empresa <span className="text-rose-500">*</span>
            </label>
            <input
              id="company-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Grupo MyOffice Comércio Geral & Serviços, Lda."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* NIF & Moeda Padrão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="company-nif-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIF (Identificação Fiscal) <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-nif-input"
                type="text"
                required
                value={nif}
                onChange={(e) => {
                  setNif(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex.: 5417082910"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="company-currency-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Moeda Padrão <span className="text-rose-500">*</span>
              </label>
              <select
                id="company-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CompanyCurrency)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="Kz">Kwanza (Kz)</option>
                <option value="USD">Dólar Americano (USD)</option>
              </select>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label htmlFor="company-address-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Endereço <span className="text-rose-500">*</span>
            </label>
            <input
              id="company-address-input"
              type="text"
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Edifício Vernon Corporate, 5º Andar, Av. 4 de Fevereiro, Luanda"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Contacto (Telefone / Email) */}
          <div>
            <label htmlFor="company-contact-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contacto (Telefone / Email) <span className="text-rose-500">*</span>
            </label>
            <input
              id="company-contact-input"
              type="text"
              required
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: +244 923 000 111 • geral@empresa.ao"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Status & Logótipo URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="company-status-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="company-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>

            <div>
              <label htmlFor="company-logo-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL do Logótipo <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="company-logo-input"
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Banco Principal Vinculado */}
          <div>
            <label htmlFor="company-bank-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Banco Principal de Liquidação
            </label>
            <select
              id="company-bank-select"
              value={principalBankId}
              onChange={(e) => setPrincipalBankId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            >
              <option value="">Nenhum banco selecionado</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currency}) • {b.type === 'caixa_fisico' ? 'Caixa Físico' : 'Conta Bancária'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              As vendas geradas nos armazéns desta empresa creditam automaticamente nesta conta bancária.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              id="btn-cancel-company-modal"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-company-modal"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.99]"
            >
              {companyToEdit ? 'Salvar Alterações' : 'Cadastrar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
