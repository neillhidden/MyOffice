import React, { useState, useEffect } from 'react';
import { X, Truck, Phone, Mail, MapPin, Globe, AlignLeft } from 'lucide-react';
import { Supplier } from '../../types/stock';
import { useStock } from '../../context/StockContext';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

const DEFAULT_PLATFORMS = [
  '1688',
  'Taobao',
  'Alibaba',
  'AliExpress',
  'Amazon',
  'Temu',
  'eBay',
  'Shein',
  'Fornecedor Local (Angola)',
  'Importação Direta',
  'Distribuidor Oficial',
];

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const { addSupplier, updateSupplier, suppliers } = useStock();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [platform, setPlatform] = useState('1688');
  const [customPlatform, setCustomPlatform] = useState('');
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Collect all known platforms from existing suppliers
  const knownPlatforms = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_PLATFORMS);
    suppliers.forEach((s) => {
      if (s.platform) set.add(s.platform);
    });
    return Array.from(set);
  }, [suppliers]);

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setName(supplierToEdit.name || '');
        setContact(supplierToEdit.contact || '');
        setEmail(supplierToEdit.email || '');
        setAddress(supplierToEdit.address || '');
        setStatus(supplierToEdit.status || 'ativo');
        setNotes(supplierToEdit.notes || '');

        const existingPlatform = supplierToEdit.platform || '';
        if (knownPlatforms.includes(existingPlatform)) {
          setPlatform(existingPlatform);
          setIsCustomPlatform(false);
          setCustomPlatform('');
        } else if (existingPlatform) {
          setPlatform('__custom__');
          setIsCustomPlatform(true);
          setCustomPlatform(existingPlatform);
        } else {
          setPlatform(knownPlatforms[0] || '1688');
          setIsCustomPlatform(false);
          setCustomPlatform('');
        }
      } else {
        setName('');
        setContact('');
        setEmail('');
        setAddress('');
        setPlatform('1688');
        setIsCustomPlatform(false);
        setCustomPlatform('');
        setStatus('ativo');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, supplierToEdit, knownPlatforms]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do fornecedor é obrigatório.');
      return;
    }
    if (!contact.trim()) {
      setError('O contacto (telefone / WhatsApp) é obrigatório.');
      return;
    }

    const finalPlatform = isCustomPlatform
      ? customPlatform.trim()
      : platform === '__custom__'
      ? customPlatform.trim()
      : platform;

    try {
      if (supplierToEdit) {
        updateSupplier(supplierToEdit.id, {
          name: name.trim(),
          contact: contact.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          platform: finalPlatform || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      } else {
        addSupplier({
          name: name.trim(),
          contact: contact.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          platform: finalPlatform || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar dados do fornecedor.');
    }
  };

  return (
    <div
      id="modal-supplier-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="modal-supplier-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {supplierToEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cadastro de fornecedores de produtos, canais de importação e plataformas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label htmlFor="sup-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Fornecedor / Razão Social <span className="text-rose-500">*</span>
            </label>
            <input
              id="sup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Guangzhou Electronics Co. ou Fornecedor Luanda Sul"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contacto */}
            <div>
              <label htmlFor="sup-contact" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contacto (WhatsApp / Tel.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="sup-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+86 138 0000 0000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="sup-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="sup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendas@fornecedor.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Plataforma (Flexible list logic like Fontes in Lista de compras) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="sup-platform-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plataforma de Origem
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Origem da mercadoria</span>
            </div>
            <div className="space-y-1.5">
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  id="sup-platform-select"
                  value={isCustomPlatform ? '__custom__' : platform}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomPlatform(true);
                      setPlatform('__custom__');
                    } else {
                      setIsCustomPlatform(false);
                      setPlatform(val);
                      setCustomPlatform('');
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                >
                  {knownPlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">+ Outra plataforma personalizada...</option>
                </select>
              </div>

              {isCustomPlatform && (
                <input
                  id="sup-platform-custom-input"
                  type="text"
                  required
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="Digite o nome da plataforma / canal..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Endereço */}
            <div>
              <label htmlFor="sup-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endereço / Localização <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="sup-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Cidade, Província ou País"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="sup-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado
              </label>
              <select
                id="sup-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="sup-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas Adicionais <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                id="sup-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condições de frete, prazos médios de entrega, WeChat ID, etc."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-supplier"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-all shadow-xs"
            >
              {supplierToEdit ? 'Salvar Alterações' : 'Criar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
