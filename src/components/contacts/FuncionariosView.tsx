import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Search,
  Pencil,
  Trash2,
  Cake,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Employee } from '../../types/employee';
import { EmployeeModal } from './EmployeeModal';

export const FuncionariosView: React.FC = () => {
  const { employees, companies, deleteEmployee, isCompanyDisabled } = useStock();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Deletion state & feedback
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Exclude employees belonging to disabled companies
      if (emp.companyId === 'comp-kianda') {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }
      const comp = companies.find((c) => c.id === emp.companyId);
      if (comp && (comp.status === 'desativada' || isCompanyDisabled(comp.id))) return false;

      if (selectedCompanyId !== 'todas' && emp.companyId !== selectedCompanyId) return false;
      if (selectedStatus !== 'todos' && emp.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchPhone = emp.phone?.toLowerCase().includes(q) || false;
        const matchRole = emp.role?.toLowerCase().includes(q) || false;
        const matchAddress = emp.address?.toLowerCase().includes(q) || false;
        return matchName || matchPhone || matchRole || matchAddress;
      }
      return true;
    });
  }, [employees, selectedCompanyId, selectedStatus, searchTerm, companies, isCompanyDisabled]);

  // Birthday checks
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentDay = new Date().getDate();

  const isBirthdaySoon = (birthDateStr?: string): boolean => {
    if (!birthDateStr) return false;
    const parts = birthDateStr.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      return month === currentMonth;
    }
    return false;
  };

  const isTodayBirthday = (birthDateStr?: string): boolean => {
    if (!birthDateStr) return false;
    const parts = birthDateStr.split('-');
    if (parts.length >= 3) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return month === currentMonth && day === currentDay;
    }
    return false;
  };

  const formatBirthDate = (dateStr?: string): string => {
    if (!dateStr) return 'Não informada';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;
    const result = deleteEmployee(employeeToDelete.id);
    if (result.success) {
      setActionFeedback({ type: 'success', message: `Funcionário "${employeeToDelete.name}" eliminado com sucesso.` });
      setEmployeeToDelete(null);
    } else {
      setActionFeedback({ type: 'error', message: result.message || 'Erro ao eliminar funcionário.' });
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Contactos • Funcionários
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Equipa de colaboradores, vínculos empresariais e aniversários para o calendário
          </p>
        </div>

        {/* User Instruction: Add buttons should not have a '+' icon */}
        <button
          type="button"
          id="btn-add-employee"
          onClick={handleOpenAdd}
          className="flex items-center justify-center px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.99]"
        >
          Novo Funcionário
        </button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Funcionários</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {employees.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Colaboradores registados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Funcionários Ativos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {employees.filter((e) => e.status === 'ativo').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Disponíveis para vendas e operação</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Aniversários no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {employees.filter((e) => isBirthdaySoon(e.birthDate)).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sincronizado com o Calendário</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="input-search-employees"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou cargo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Company Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Empresa:</span>
            <select
              id="select-filter-company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              <option value="todas">Todas as Empresas</option>
              {companies
                .filter((c) => {
                  if (c.id === 'comp-kianda') {
                    return !isCompanyDisabled('comp-kianda') && c.status !== 'desativada';
                  }
                  return c.status !== 'desativada' && !isCompanyDisabled(c.id);
                })
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Estado:</span>
            <select
              id="select-filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Funcionário</th>
                <th className="py-2.5 px-3">Empresa</th>
                <th className="py-2.5 px-3">Cargo / Função</th>
                <th className="py-2.5 px-3">Contacto</th>
                <th className="py-2.5 px-3">Nascimento</th>
                <th className="py-2.5 px-3">Endereço</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum funcionário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const company = companies.find((c) => c.id === emp.companyId);
                  const isToday = isTodayBirthday(emp.birthDate);
                  const isMonth = isBirthdaySoon(emp.birthDate);
                  const cleanPhone = emp.phone?.replace(/\D/g, '') || '';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name with initials avatar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {emp.name}
                            </span>
                            {emp.accessPermissions && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                Acesso: {emp.accessPermissions}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {company ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {company.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Não atribuída</span>
                        )}
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {emp.role ? (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {emp.role}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {emp.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-slate-700 dark:text-slate-300">{emp.phone}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0.5 ml-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Data de Nascimento */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatBirthDate(emp.birthDate)}
                          </span>
                          {isToday ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                              <Cake className="w-2.5 h-2.5" />
                              Hoje!
                            </span>
                          ) : isMonth ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-medium inline-flex items-center gap-0.5">
                              <Cake className="w-2.5 h-2.5" />
                              Este mês
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Endereço */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={emp.address}>
                        {emp.address ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {emp.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {emp.status === 'ativo' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* User Instruction: Action buttons (Edit/Delete) should be icon-only */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            id={`btn-edit-employee-${emp.id}`}
                            onClick={() => handleOpenEdit(emp)}
                            title="Editar funcionário"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            id={`btn-delete-employee-${emp.id}`}
                            onClick={() => setEmployeeToDelete(emp)}
                            title="Eliminar funcionário"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
      />

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div
          id="modal-delete-employee-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="modal-delete-employee-card"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Eliminar Funcionário
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deseja realmente remover "{employeeToDelete.name}"?
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-delete-employee-modal"
                onClick={() => setEmployeeToDelete(null)}
                aria-label="Fechar"
                title="Fechar"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              O sistema verifica automaticamente se o funcionário possui histórico associado a vendas, movimentações ou entregas antes de permitir a eliminação.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-employee"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
              >
                Confirmar Eliminação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
