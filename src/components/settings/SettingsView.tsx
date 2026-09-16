import React, { useState, useMemo } from 'react';
import {
  Building2,
  Warehouse as WarehouseIcon,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Company, Warehouse } from '../../types/stock';
import { CompanyModal } from './CompanyModal';
import { DeleteCompanyModal } from './DeleteCompanyModal';
import { WarehouseModal } from './WarehouseModal';

export const SettingsView: React.FC = () => {
  const {
    companies,
    warehouses,
    addCompany,
    updateCompany,
    deleteCompany,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'empresas' | 'armazens'>('empresas');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativa' | 'inativa'>('all');

  // Company Modals State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  // Delete Company Modal State
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Warehouse Modals State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(null);

  // Filtering Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nif.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contact.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  // Filtering Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const company = companies.find((c) => c.id === w.companyId);
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [warehouses, companies, searchQuery]);

  // Handlers for Company
  const handleOpenNewCompany = () => {
    setCompanyToEdit(null);
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setCompanyToEdit(company);
    setIsCompanyModalOpen(true);
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCompany = (
    data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (companyToEdit) {
      updateCompany(companyToEdit.id, data);
    } else {
      addCompany(data);
    }
  };

  const handleConfirmDeleteCompany = (companyId: string) => {
    deleteCompany(companyId);
    setCompanyToDelete(null);
  };

  // Handlers for Warehouse
  const handleOpenNewWarehouse = () => {
    setWarehouseToEdit(null);
    setIsWarehouseModalOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setWarehouseToEdit(warehouse);
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = (data: Omit<Warehouse, 'id'>) => {
    if (warehouseToEdit) {
      updateWarehouse(warehouseToEdit.id, data);
    } else {
      addWarehouse(data);
    }
  };

  // Helper: warehouses linked to a company
  const getLinkedWarehouses = (companyId: string) => {
    return warehouses.filter((w) => w.companyId === companyId);
  };

  return (
    <div id="settings-view-container" className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 id="settings-view-title" className="text-xl font-bold text-slate-900 tracking-tight">
            Definições do Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurações de base da organização e entidades operacionais
          </p>
        </div>

        {/* Tab switcher: Empresas / Armazéns */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            id="tab-btn-companies"
            onClick={() => setActiveTab('empresas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'empresas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas ({companies.length})</span>
          </button>
          <button
            type="button"
            id="tab-btn-warehouses"
            onClick={() => setActiveTab('armazens')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'armazens'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <WarehouseIcon className="w-3.5 h-3.5" />
            <span>Armazéns & Lojas ({warehouses.length})</span>
          </button>
        </div>
      </div>

      {/* TAB: EMPRESAS */}
      {activeTab === 'empresas' && (
        <div id="section-companies-management" className="space-y-4">
          {/* Top Bar with Description & Action Button */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <span>Gestão de Empresas</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Entidades legais e fiscais referenciadas por Armazém, Estoque e outros módulos do sistema.
              </p>
            </div>

            {/* Botão "Adicionar" (sem ícone "+", só o texto) */}
            <button
              type="button"
              id="btn-add-company"
              onClick={handleOpenNewCompany}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto shrink-0"
            >
              <span>Adicionar</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-companies"
                  type="text"
                  placeholder="Pesquisar por nome, NIF ou morada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                id="select-company-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ativa' | 'inativa')}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">Todos os Status ({companies.length})</option>
                <option value="ativa">Ativas ({companies.filter((c) => c.status === 'ativa').length})</option>
                <option value="inativa">Inativas ({companies.filter((c) => c.status === 'inativa').length})</option>
              </select>
            </div>
          </div>

          {/* Companies List / Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-companies" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">NIF</th>
                    <th className="py-3 px-4">Contacto & Endereço</th>
                    <th className="py-3 px-4">Moeda</th>
                    <th className="py-3 px-4">Armazéns Vinculados</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhuma empresa encontrada com os critérios informados.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((comp) => {
                      const linked = getLinkedWarehouses(comp.id);
                      return (
                        <tr
                          key={comp.id}
                          id={`row-company-${comp.id}`}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          {/* Nome da Empresa & Logótipo */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {comp.logo ? (
                                <img
                                  src={comp.logo}
                                  alt={comp.name}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                  {comp.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 block line-clamp-1">
                                  {comp.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Cadastrada em {new Date(comp.createdAt).toLocaleDateString('pt-PT')}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* NIF */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                            {comp.nif}
                          </td>

                          {/* Contacto & Endereço */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-0.5">
                              <p className="text-slate-800 font-medium truncate">{comp.contact}</p>
                              <p className="text-[11px] text-slate-400 truncate">{comp.address}</p>
                            </div>
                          </td>

                          {/* Moeda Padrão */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-semibold text-[11px]">
                              {comp.currency}
                            </span>
                          </td>

                          {/* Armazéns Vinculados */}
                          <td className="py-3.5 px-4">
                            {linked.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">
                                Nenhum armazém vinculado
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {linked.map((wh) => (
                                  <span
                                    key={wh.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200/60"
                                    title={wh.address}
                                  >
                                    <WarehouseIcon className="w-2.5 h-2.5 text-blue-600" />
                                    {wh.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Status: ativa / inativa */}
                          <td className="py-3.5 px-4">
                            {comp.status === 'ativa' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Inativa
                              </span>
                            )}
                          </td>

                          {/* Ações: Editar (só ícone) e Eliminar (só ícone caixa de lixo) */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* Editar (só ícone de lápis) */}
                              <button
                                type="button"
                                id={`btn-edit-company-${comp.id}`}
                                onClick={() => handleEditCompany(comp)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar empresa"
                                aria-label={`Editar ${comp.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Eliminar (só ícone caixa de lixo) */}
                              <button
                                type="button"
                                id={`btn-delete-company-${comp.id}`}
                                onClick={() => handleDeleteClick(comp)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar empresa"
                                aria-label={`Eliminar ${comp.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* TAB: ARMAZÉNS & LOJAS */}
      {activeTab === 'armazens' && (
        <div id="section-warehouses-management" className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-slate-700" />
                <span>Gestão de Armazéns & Lojas</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Localizações físicas onde o estoque é armazenado. Cada armazém pertence obrigatoriamente a uma Empresa.
              </p>
            </div>

            <button
              type="button"
              id="btn-add-warehouse"
              onClick={handleOpenNewWarehouse}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto shrink-0"
            >
              <span>Adicionar Armazém</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-warehouses" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Armazém / Loja</th>
                    <th className="py-3 px-4">Empresa Proprietária</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Endereço</th>
                    <th className="py-3 px-4">Responsável & Contacto</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredWarehouses.map((wh) => {
                    const comp = companies.find((c) => c.id === wh.companyId);
                    return (
                      <tr key={wh.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                              <WarehouseIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-slate-900">{wh.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {comp ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="font-medium text-slate-800">{comp.name}</span>
                            </div>
                          ) : (
                            <span className="text-rose-500 text-[11px] font-medium">
                              Empresa não associada
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 capitalize">
                          {wh.type === 'loja_fisica' ? 'Loja Física' : 'Armazém'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {wh.address}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800">{wh.manager}</p>
                          <p className="text-[11px] text-slate-400">{wh.contact}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          {wh.status === 'ativo' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Inativo
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              id={`btn-edit-warehouse-${wh.id}`}
                              onClick={() => handleEditWarehouse(wh)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar armazém"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-warehouse-${wh.id}`}
                              onClick={() => deleteWarehouse(wh.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar armazém"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Company Create/Edit Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
      />

      {/* Company Delete Modal with Constraint Check */}
      <DeleteCompanyModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteCompany}
        company={companyToDelete}
        linkedWarehouses={companyToDelete ? getLinkedWarehouses(companyToDelete.id) : []}
      />

      {/* Warehouse Create/Edit Modal */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        onSave={handleSaveWarehouse}
        warehouseToEdit={warehouseToEdit}
        companies={companies}
      />
    </div>
  );
};
