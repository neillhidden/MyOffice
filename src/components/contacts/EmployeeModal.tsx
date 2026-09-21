import React, { useState, useEffect } from 'react';
import { X, User, Building2, Phone, Briefcase, Calendar as CalendarIcon, MapPin, Shield } from 'lucide-react';
import { Employee } from '../../types/employee';
import { useStock } from '../../context/StockContext';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { companies, addEmployee, updateEmployee } = useStock();

  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [accessPermissions] = useState<'basico' | 'gerente' | 'administrador'>('basico');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setName(employeeToEdit.name || '');
        setCompanyId(employeeToEdit.companyId || (companies[0]?.id ?? ''));
        setPhone(employeeToEdit.phone || '');
        setRole(employeeToEdit.role || '');
        setBirthDate(employeeToEdit.birthDate || '');
        setAddress(employeeToEdit.address || '');
        setStatus(employeeToEdit.status || 'ativo');
      } else {
        setName('');
        setCompanyId(companies[0]?.id || '');
        setPhone('');
        setRole('');
        setBirthDate('');
        setAddress('');
        setStatus('ativo');
      }
      setError(null);
    }
  }, [isOpen, employeeToEdit, companies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do funcionário é obrigatório.');
      return;
    }
    if (!companyId) {
      setError('A associação a uma empresa é obrigatória.');
      return;
    }
    if (!phone.trim()) {
      setError('O contacto (telefone / WhatsApp) é obrigatório.');
      return;
    }

    try {
      if (employeeToEdit) {
        updateEmployee(employeeToEdit.id, {
          name: name.trim(),
          companyId,
          phone: phone.trim(),
          role: role.trim() || undefined,
          birthDate: birthDate || undefined,
          address: address.trim() || undefined,
          status,
          accessPermissions,
        });
      } else {
        addEmployee({
          name: name.trim(),
          companyId,
          phone: phone.trim(),
          role: role.trim() || undefined,
          birthDate: birthDate || undefined,
          address: address.trim() || undefined,
          status,
          accessPermissions,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar dados do funcionário.');
    }
  };

  return (
    <div
      id="modal-employee-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-employee-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {employeeToEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gestão da equipa e colaboradores da empresa
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-employee-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
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
            <label htmlFor="emp-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Carlos Mendes"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          {/* Empresa (Obrigatória) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="emp-company" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Empresa <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Definições / Empresas</span>
            </div>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                id="emp-company"
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                {companies
                  .filter((c) => c.status !== 'desativada')
                  .map((c) => (
                    <option key={c.id} value={c.id} disabled={c.status === 'parada'}>
                      {c.name} {c.status === 'parada' ? '(Parada)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contacto */}
            <div>
              <label htmlFor="emp-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contacto (WhatsApp / Tel.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="emp-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex.: +244 923 111 222"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Cargo / Função */}
            <div>
              <label htmlFor="emp-role" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Função <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="emp-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex.: Gerente de Vendas"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Data de Nascimento (para o Calendário / Aniversários) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="emp-birthdate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data de Nascimento
                </label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Agenda Calendário</span>
              </div>
              <div className="relative">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="emp-birthdate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="emp-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado
              </label>
              <select
                id="emp-status"
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
            <label htmlFor="emp-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endereço / Residência <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="emp-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex.: Rua Comandante Valódia, Luanda"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Permissões de Acesso (Reservado para o futuro) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Permissões de Acesso
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                Futuro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Nesta versão o controlo de acessos por perfil está desativado. Todos os operadores têm acesso padrão ao sistema.
            </p>
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
              id="btn-save-employee"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-all shadow-xs"
            >
              {employeeToEdit ? 'Salvar Alterações' : 'Criar Funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
