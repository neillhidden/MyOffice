import React, { useState, useEffect } from 'react';
import { X, Warehouse as WarehouseIcon, AlertCircle } from 'lucide-react';
import { Warehouse, WarehouseType, WarehouseStatus, Company } from '../../types/stock';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (whData: Omit<Warehouse, 'id'>) => void;
  warehouseToEdit?: Warehouse | null;
  companies: Company[];
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  warehouseToEdit,
  companies,
}) => {
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [type, setType] = useState<WarehouseType>('armazem');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<WarehouseStatus>('ativo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (warehouseToEdit) {
      setName(warehouseToEdit.name);
      setCompanyId(warehouseToEdit.companyId || companies[0]?.id || '');
      setType(warehouseToEdit.type);
      setAddress(warehouseToEdit.address);
      setManager(warehouseToEdit.manager);
      setContact(warehouseToEdit.contact);
      setStatus(warehouseToEdit.status);
    } else {
      setName('');
      setCompanyId(companies[0]?.id || '');
      setType('armazem');
      setAddress('');
      setManager('');
      setContact('');
      setStatus('ativo');
    }
    setError(null);
  }, [warehouseToEdit, isOpen, companies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do armazém é obrigatório.');
      return;
    }
    if (!companyId) {
      setError('A seleção de uma Empresa é obrigatória.');
      return;
    }
    if (!address.trim()) {
      setError('O endereço é obrigatório.');
      return;
    }
    if (!manager.trim()) {
      setError('O responsável é obrigatório.');
      return;
    }
    if (!contact.trim()) {
      setError('O contacto é obrigatório.');
      return;
    }

    onSave({
      name: name.trim(),
      companyId,
      type,
      address: address.trim(),
      manager: manager.trim(),
      contact: contact.trim(),
      status,
    });
    onClose();
  };

  return (
    <div
      id="modal-warehouse-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-warehouse-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200/80 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-warehouse-title" className="text-base font-semibold text-slate-900 leading-tight">
                {warehouseToEdit ? 'Editar Armazém' : 'Novo Armazém / Loja'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Localização física de estoque vinculada a uma Empresa
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-warehouse-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              id="warehouse-form-error"
              className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome do Armazém */}
          <div>
            <label htmlFor="warehouse-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome do Armazém / Loja <span className="text-rose-500">*</span>
            </label>
            <input
              id="warehouse-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Armazém Central - Viana"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Empresa Proprietária (OBRIGATÓRIO) */}
          <div>
            <label htmlFor="warehouse-company-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Empresa Proprietária <span className="text-rose-500">*</span>
            </label>
            <select
              id="warehouse-company-select"
              required
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            >
              <option value="" disabled>
                Selecione a empresa proprietária
              </option>
              {companies.map((c) => {
                const statusLabel =
                  c.status === 'ativa' ? 'Ativa' : c.status === 'parada' ? 'Parada' : 'Desativada';
                const isDesativada = c.status === 'desativada';
                return (
                  <option key={c.id} value={c.id} disabled={isDesativada && !warehouseToEdit}>
                    {c.name} ({statusLabel}) • NIF: {c.nif}
                    {isDesativada ? ' — Indisponível para novos armazéns' : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Cada armazém pertence obrigatoriamente a exatamente uma Empresa cadastrada em Definições.
            </p>
          </div>

          {/* Tipo & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="warehouse-type-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Local <span className="text-rose-500">*</span>
              </label>
              <select
                id="warehouse-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as WarehouseType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="armazem">Armazém Logístico</option>
                <option value="loja_fisica">Loja Física / Ponto de Venda</option>
              </select>
            </div>

            <div>
              <label htmlFor="warehouse-status-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="warehouse-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as WarehouseStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label htmlFor="warehouse-address-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Endereço Físico <span className="text-rose-500">*</span>
            </label>
            <input
              id="warehouse-address-input"
              type="text"
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Polo Industrial de Viana, Km 25, Luanda"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Responsável & Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="warehouse-manager-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Responsável / Gerente <span className="text-rose-500">*</span>
              </label>
              <input
                id="warehouse-manager-input"
                type="text"
                required
                value={manager}
                onChange={(e) => {
                  setManager(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex.: Mateus Gaspar"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="warehouse-contact-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contacto <span className="text-rose-500">*</span>
              </label>
              <input
                id="warehouse-contact-input"
                type="text"
                required
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex.: +244 923 881 200"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              id="btn-cancel-warehouse-modal"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-warehouse-modal"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.99]"
            >
              {warehouseToEdit ? 'Salvar Alterações' : 'Cadastrar Armazém'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
