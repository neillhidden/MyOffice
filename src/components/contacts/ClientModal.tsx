import React, { useState, useEffect } from 'react';
import { X, UserRound, Building2, Phone, Mail, MapPin, FileText, AlignLeft, AlertTriangle } from 'lucide-react';
import { Client } from '../../types/client';
import { useStock } from '../../context/StockContext';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { addClient, updateClient } = useStock();

  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'empresa'>('individual');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDiscardConfirm(false);
      if (clientToEdit) {
        setName(clientToEdit.name || '');
        setType(clientToEdit.type || 'individual');
        setDocument(clientToEdit.document || '');
        setPhone(clientToEdit.phone || '');
        setWhatsapp(clientToEdit.whatsapp || '');
        setEmail(clientToEdit.email || '');
        setAddress(clientToEdit.address || '');
        setStatus(clientToEdit.status || 'ativo');
        setNotes(clientToEdit.notes || '');
      } else {
        setName('');
        setType('individual');
        setDocument('');
        setPhone('');
        setWhatsapp('');
        setEmail('');
        setAddress('');
        setStatus('ativo');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, clientToEdit]);

  const hasDirtyData = React.useMemo(() => {
    if (clientToEdit) {
      return (
        name !== (clientToEdit.name || '') ||
        type !== (clientToEdit.type || 'individual') ||
        document !== (clientToEdit.document || '') ||
        phone !== (clientToEdit.phone || '') ||
        whatsapp !== (clientToEdit.whatsapp || '') ||
        email !== (clientToEdit.email || '') ||
        address !== (clientToEdit.address || '') ||
        notes !== (clientToEdit.notes || '')
      );
    }
    return Boolean(
      name.trim() ||
      document.trim() ||
      phone.trim() ||
      whatsapp.trim() ||
      email.trim() ||
      address.trim() ||
      notes.trim()
    );
  }, [clientToEdit, name, type, document, phone, whatsapp, email, address, notes]);

  const handleRequestClose = () => {
    if (hasDirtyData) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }
    if (!phone.trim()) {
      setError('O contacto de telefone é obrigatório.');
      return;
    }

    try {
      if (clientToEdit) {
        updateClient(clientToEdit.id, {
          name: name.trim(),
          type,
          document: document.trim() || undefined,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      } else {
        addClient({
          name: name.trim(),
          type,
          document: document.trim() || undefined,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar dados do cliente.');
    }
  };

  return (
    <div
      id="modal-client-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-client-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <UserRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cadastro de clientes e compradores para integração com Caixa e Vendas
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-client-modal"
            onClick={handleRequestClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Discard changes confirmation dialog */}
        {showDiscardConfirm && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Descartar alterações?</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Tem dados preenchidos no formulário. Se fechar agora, as informações não salvas serão perdidas.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50"
              >
                Continuar a editar
              </button>
              <button
                type="button"
                id="btn-confirm-discard-client"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Descartar e fechar
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Tipo de Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Cliente
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-client-type-individual"
                onClick={() => setType('individual')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'individual'
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <UserRound className="w-3.5 h-3.5" />
                <span>Pessoa Particular</span>
              </button>

              <button
                type="button"
                id="btn-client-type-empresa"
                onClick={() => setType('empresa')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'empresa'
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa / Entidade</span>
              </button>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="client-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {type === 'empresa' ? 'Razão Social / Nome da Empresa' : 'Nome Completo'} <span className="text-rose-500">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'empresa' ? 'Ex.: Tech Angola Lda' : 'Ex.: Ana Sousa'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Documento (NIF / BI) */}
            <div>
              <label htmlFor="client-document" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'empresa' ? 'NIF da Empresa' : 'NIF / BI / Identificação'} <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="client-document"
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder={type === 'empresa' ? '5412984129' : '003291823LA042'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="client-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone Principal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="client-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex.: +244 923 111 222"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp (campo separado) */}
            <div>
              <label htmlFor="client-whatsapp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp <span className="text-slate-400 font-normal">(Campo separado)</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="client-whatsapp"
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex.: +244 923 111 222"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="client-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="client-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado
              </label>
              <select
                id="client-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label htmlFor="client-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endereço / Local de Entrega <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="client-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex.: Rua Rainha Ginga, Edifício Sky Center, Luanda"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Será sugerido automaticamente como destino quando a venda solicitar Transporte.
            </p>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="client-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas Adicionais <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                id="client-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferências, horário de entrega habitual, etc."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-client"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-all shadow-xs"
            >
              {clientToEdit ? 'Salvar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
