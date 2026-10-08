import { AppearanceSettings } from './AppearanceSettings';
import { BusinessCategories } from './BusinessCategories';
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
  RotateCcw,
  Database,
  History,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Company, Warehouse } from '../../types/stock';
import { CompanyModal } from './CompanyModal';
import { DeleteCompanyModal } from './DeleteCompanyModal';
import { WarehouseModal } from './WarehouseModal';
import { ResetSettingsModal } from './ResetSettingsModal';
import { PositiveBadge } from '../common/PositiveBadge';

export const SettingsView: React.FC<{onCreateProduct: (category: string, subcategory?: string) => void; onViewProduct: (id: string) => void}> = ({onCreateProduct, onViewProduct}) => {
  const {
    canResetData,
    companies,
    warehouses,
    banks,
    addCompany,
    updateCompany,
    deleteCompany,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'empresas' | 'armazens' | 'reset' | 'aparencia' | 'categorias' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativa' | 'desativada' | 'parada'>('all');

  // Reset Modal State
  const [resetActionType, setResetActionType] = useState<'history' | 'all' | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
      <div>
        <h1 id="settings-view-title" className="text-xl font-bold text-slate-900 dark:text-dm-text tracking-tight">
          {activeTab === 'empresas' ? 'Empresas' : activeTab === 'armazens' ? 'Armazéns e lojas' : activeTab === 'categorias' ? 'Categorias e produtos' : activeTab === 'aparencia' ? 'Aparência' : activeTab === 'reset' ? 'Gestão de dados' : 'Definições do Sistema'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
          {activeTab ? 'Definições do Sistema' : 'Gere as empresas, os locais de operação e os dados do MyOffice.'}
        </p>
      </div>

      {!activeTab && (<nav aria-label="Categorias de definições" className="space-y-2">
        {([
          { key: 'empresas', id: 'tab-btn-companies', icon: Building2, title: 'Empresas', description: 'Gerir os dados, a moeda e o estado de cada empresa.', status: `${companies.length} registadas` },
          { key: 'armazens', id: 'tab-btn-warehouses', icon: WarehouseIcon, title: 'Armazéns e lojas', description: 'Organizar os locais de operação, os responsáveis e as empresas associadas.', status: `${warehouses.length} locais` },
          { key: 'categorias', id: 'tab-btn-categories', icon: Layers, title: 'Categorias e produtos', description: 'Organizar categorias, subcategorias e produtos do catálogo.', status: 'Catálogo' },
          { key: 'aparencia', id: 'tab-btn-appearance', icon: Layers, title: 'Aparência', description: 'Modo claro, anoitecer ou tema do dispositivo.', status: 'Home e Business' },
          { key: 'reset', id: 'tab-btn-reset', icon: RotateCcw, title: 'Gestão de dados', description: 'Consultar as opções de reposição e a proteção do histórico.', status: canResetData ? 'Reposição disponível' : 'Histórico protegido' },
        ] as const).map(({ key, id, icon: Icon, title, description, status }) => (
          <button
            key={key}
            type="button"
            id={id}
            onClick={() => { setActiveTab(key); setSearchQuery(''); }}
            className="group w-full min-h-[76px] flex items-center gap-4 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 dark:border-dm-border dark:bg-dm-surface dark:hover:bg-dm-elevated px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-dm-muted"
          >
            <Icon aria-hidden="true" className="w-5 h-5 shrink-0 text-slate-700 dark:text-dm-text" strokeWidth={1.5} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-900 dark:text-dm-text">{title}</span>
              <span className="block text-xs text-slate-500 dark:text-dm-muted mt-0.5 leading-relaxed">{description}</span>
              <span className="block sm:hidden text-[11px] text-slate-500 dark:text-dm-muted mt-1">{status}</span>
            </span>
            <span className="hidden sm:block shrink-0 text-xs text-slate-600 dark:text-dm-muted">{status}</span>
            <ChevronRight aria-hidden="true" className="w-4 h-4 shrink-0 text-slate-500 dark:text-dm-muted" />
          </button>
        ))}
      </nav>)}

      {activeTab && (
        <button type="button" id="btn-settings-overview" onClick={() => setActiveTab(null)} className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 text-xs font-medium text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
          <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          Voltar às Definições
        </button>
      )}

      {/* TAB: EMPRESAS */}
      {activeTab === 'aparencia' && <AppearanceSettings />}
      {activeTab === 'categorias' && <BusinessCategories onCreateProduct={onCreateProduct} onViewProduct={onViewProduct} />}
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
              className="dm-btn-primary inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto shrink-0"
            >
              <span>Adicionar</span>
            </button>
          </div>

          {/* Filter Toolbar - Unified Capsule */}
          <div className="dm-filter-capsule bg-white border border-slate-200/80 rounded-xl p-1.5 flex flex-wrap items-center justify-between gap-0 shadow-xs">
            <div className="dm-filter-segment flex items-center gap-2 flex-1 min-w-[200px] px-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-companies"
                  type="text"
                  placeholder="Pesquisar por nome, NIF ou morada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-transparent rounded-lg text-xs text-slate-800 dark:text-dm-text placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="dm-filter-segment flex items-center gap-2 px-2">
              <select
                id="select-company-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ativa' | 'desativada' | 'parada')}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-transparent rounded-lg text-xs text-slate-700 dark:text-dm-text font-medium focus:outline-none"
              >
                <option value="all">Todos os Status ({companies.length})</option>
                <option value="ativa">Ativas ({companies.filter((c) => c.status === 'ativa').length})</option>
                <option value="desativada">Desativadas ({companies.filter((c) => c.status === 'desativada').length})</option>
                <option value="parada">Paradas ({companies.filter((c) => c.status === 'parada').length})</option>
              </select>
            </div>

            <div className="pl-2 pr-1 py-1">
              <button
                type="button"
                onClick={handleOpenNewCompany}
                className="dm-btn-primary inline-flex items-center justify-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
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
                                <span className="text-[10px] text-slate-400 block">
                                  Cadastrada em {new Date(comp.createdAt).toLocaleDateString('pt-PT')}
                                </span>
                                {comp.principalBankId && (() => {
                                  const pBank = banks.find((b) => b.id === comp.principalBankId);
                                  if (!pBank) return null;
                                  return (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-800">
                                      <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span className="truncate max-w-[150px] font-medium" title={pBank.name}>
                                        {pBank.name}
                                      </span>
                                      {pBank.type === 'banco_padrao' && (
                                        <span className="text-[9px] px-1 py-0.2 bg-blue-100 text-blue-700 rounded font-medium">
                                          Padrão
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
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

                          {/* Status: ativa / desativada / parada */}
                          <td className="py-3.5 px-4">
                            {comp.status === 'ativa' ? (
                              <PositiveBadge label="Ativa" />
                            ) : comp.status === 'parada' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Parada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Desativada
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* Editar (só ícone de lápis) */}
                              <button
                                type="button"
                                id={`btn-edit-company-${comp.id}`}
                                onClick={() => handleEditCompany(comp)}
                                className="dm-icon-action p-1.5 text-slate-500 hover:text-slate-800 dark:text-dm-muted dark:hover:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated rounded-lg transition-colors"
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
                                className="dm-icon-action p-1.5 text-rose-500 hover:text-rose-700 dark:text-dm-muted dark:hover:text-dm-text hover:bg-rose-50 dark:hover:bg-dm-elevated rounded-lg transition-colors"
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
              className="dm-btn-primary inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto shrink-0"
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
                            <PositiveBadge label="Ativo" />
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
                              className="dm-icon-action p-1.5 text-slate-500 hover:text-slate-800 dark:text-dm-muted dark:hover:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated rounded-lg transition-colors"
                              title="Editar armazém"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-warehouse-${wh.id}`}
                              onClick={() => deleteWarehouse(wh.id)}
                              className="dm-icon-action p-1.5 text-rose-500 hover:text-rose-700 dark:text-dm-muted dark:hover:text-dm-text hover:bg-rose-50 dark:hover:bg-dm-elevated rounded-lg transition-colors"
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

      {/* TAB: RESET / ZONA DE PERIGO */}
      {activeTab === 'reset' && (
        <div id="section-reset-management" className="space-y-6 max-w-4xl">
          {!canResetData && (
            <p role="status" className="p-4 rounded-xl border border-amber-200 dark:border-dm-border bg-amber-50 dark:bg-dm-surface text-xs text-amber-900 dark:text-dm-text">
              Reposição bloqueada: existem registos operacionais ou financeiros. O histórico deve ser preservado; utilize estornos para corrigir lançamentos.
            </p>
          )}
          {/* Top Banner */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-rose-950">
                  Zona de Perigo • Gestão de Dados e Redefinição
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-200/80 text-rose-900">
                  Histórico Protegido
                </span>
              </div>
              <p className="text-xs text-rose-800/90 mt-1 leading-relaxed">
                Opções de reposição de dados locais. Reposição disponível apenas quando não existe histórico operacional ou financeiro.
                Todas as operações executadas nesta secção exigem confirmação explícita por digitação de frase de segurança.
              </p>
              {/* Futuro: Backup antes do reset e restrição a administradores */}
              <div className="mt-3 pt-3 border-t border-rose-200/60 flex flex-wrap items-center gap-3 text-[11px] text-rose-700">
                <span className="inline-flex items-center gap-1 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Futuro: Acesso restrito ao perfil Administrador
                </span>
                <span className="text-rose-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Futuro: Backup automático sugerido antes do reset
                </span>
              </div>
            </div>
          </div>

          {/* Duas Opções de Reset em Cards Claros e Separados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Opção A — Zerar histórico */}
            <div
              id="card-reset-history"
              className="bg-white border-2 border-amber-200/80 hover:border-amber-300 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                    Opção A
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">Zerar histórico</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Apaga todo o histórico transacional do sistema, mantendo o catálogo de produtos e entidades intactos.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-[11px]">
                  <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100/80 text-amber-900 space-y-1">
                    <strong className="block font-semibold">O que é apagado:</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                      <li>Movimentações de Estoque</li>
                      <li>Movimentações Bancárias (extratos)</li>
                      <li>Vendas e Transportes (Caixa)</li>
                      <li>Notificações e Eventos da Agenda</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80 text-emerald-900 space-y-1">
                    <strong className="block font-semibold">O que permanece:</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-emerald-800">
                      <li>Produtos e Variações (estoque zero)</li>
                      <li>Empresas, Armazéns e Bancos (saldo zero)</li>
                      <li>Funcionários, Clientes, Fornecedores</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-open-reset-history"
                  disabled={!canResetData}
                  aria-disabled={!canResetData}
                  onClick={() => {
                    setResetActionType('history');
                    setIsResetModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-300 font-semibold text-xs rounded-xl transition-all shadow-xs active:scale-[0.98]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zerar Histórico</span>
                </button>
              </div>
            </div>

            {/* Opção B — Zerar tudo */}
            <div
              id="card-reset-all"
              className="bg-white border-2 border-rose-300 hover:border-rose-400 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                    Opção B • Extrema
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">Zerar tudo</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Apaga absolutamente tudo, incluindo o catálogo e a configuração — deixa o sistema como se tivesse acabado de ser instalado.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-[11px]">
                  <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200/80 text-rose-950 space-y-1">
                    <strong className="block font-semibold">O que é apagado (TUDO):</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-rose-900">
                      <li>Todo o histórico transacional da Opção A</li>
                      <li>Todos os Produtos e Variações</li>
                      <li>Todas as Empresas, Armazéns e Bancos</li>
                      <li>Todos os Contactos (Funcionários, Clientes, Fornecedores)</li>
                      <li>Todas as Listas de Compras e Agendas</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-600">
                    <p className="text-[11px] italic">
                      Útil para reiniciar testes durante o desenvolvimento ou redefinir a conta para uma instalação nova.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-open-reset-all"
                  disabled={!canResetData}
                  aria-disabled={!canResetData}
                  onClick={() => {
                    setResetActionType('all');
                    setIsResetModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar Tudo</span>
                </button>
              </div>
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

      {/* Reset Confirmation Modal (Opção A: Zerar Histórico / Opção B: Zerar Tudo) */}
      <ResetSettingsModal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetActionType(null);
        }}
        actionType={resetActionType}
      />
    </div>
  );
};
