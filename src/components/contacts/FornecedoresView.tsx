import React, { useState, useMemo } from 'react';
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Supplier } from '../../types/stock';
import { SupplierModal } from './SupplierModal';

export const FornecedoresView: React.FC = () => {
  const { suppliers, products, companies, warehouses, stockConfigs, deleteSupplier } = useStock();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Deletion state & feedback
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Collect all unique platforms
  const allPlatforms = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      if (s.platform) set.add(s.platform);
    });
    return Array.from(set);
  }, [suppliers]);

  // Product counts by supplier
  const productCountBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.supplierId) {
        map.set(p.supplierId, (map.get(p.supplierId) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // Supplier entity mapping to detect linked companies or orphaned links
  const supplierEntitiesMap = useMemo(() => {
    const map = new Map<
      string,
      {
        companyNames: string[];
        hasOrphaned: boolean;
        inactiveCompany: boolean;
      }
    >();

    suppliers.forEach((s) => {
      const linkedProds = products.filter((p) => p.supplierId === s.id);
      const companyNamesSet = new Set<string>();
      let hasOrphaned = false;
      let inactiveCompany = false;

      linkedProds.forEach((p) => {
        const whIds = stockConfigs.filter((sc) => sc.productId === p.id).map((sc) => sc.warehouseId);
        if (whIds.length === 0) {
          hasOrphaned = true;
        } else {
          whIds.forEach((whId) => {
            const wh = warehouses.find((w) => w.id === whId);
            if (wh) {
              const comp = companies.find((c) => c.id === wh.companyId);
              if (comp) {
                if (comp.status !== 'desativada' && comp.id !== 'comp-kianda') {
                  companyNamesSet.add(comp.name);
                } else {
                  inactiveCompany = true;
                }
              } else {
                hasOrphaned = true;
              }
            } else {
              hasOrphaned = true;
            }
          });
        }
      });

      map.set(s.id, {
        companyNames: Array.from(companyNamesSet),
        hasOrphaned,
        inactiveCompany,
      });
    });

    return map;
  }, [suppliers, products, companies, warehouses, stockConfigs]);

  // Overall totals
  const overallStats = useMemo(() => {
    const totalProductsLinked = products.filter((p) => Boolean(p.supplierId)).length;
    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter((s) => s.status !== 'inativo').length,
      uniquePlatforms: allPlatforms.length,
      totalProductsLinked,
    };
  }, [suppliers, allPlatforms, products]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (selectedPlatform !== 'todas' && s.platform !== selectedPlatform) return false;
      const status = s.status || 'ativo';
      if (selectedStatus !== 'todos' && status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchContact = s.contact.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q) || false;
        const matchAddress = s.address?.toLowerCase().includes(q) || false;
        const matchPlatform = s.platform?.toLowerCase().includes(q) || false;
        return matchName || matchContact || matchEmail || matchAddress || matchPlatform;
      }
      return true;
    });
  }, [suppliers, selectedPlatform, selectedStatus, searchTerm]);

  const handleOpenAdd = () => {
    setSupplierToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setSupplierToEdit(s);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!supplierToDelete) return;
    const result = deleteSupplier(supplierToDelete.id);
    if (result.success) {
      setActionFeedback({ type: 'success', message: `Fornecedor "${supplierToDelete.name}" eliminado com sucesso.` });
      setSupplierToDelete(null);
    } else {
      setActionFeedback({ type: 'error', message: result.message || 'Erro ao eliminar fornecedor.' });
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Contactos • Fornecedores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão de fornecedores internacionais e locais, plataformas de origem e catálogo de artigos vinculados
          </p>
        </div>

        {/* User Instruction: Add buttons should not have a '+' icon */}
        <button
          type="button"
          id="btn-add-supplier"
          onClick={handleOpenAdd}
          className="flex items-center justify-center px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.99]"
        >
          Novo Fornecedor
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Fornecedores</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.totalSuppliers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Parceiros de abastecimento</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fornecedores Ativos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.activeSuppliers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Disponíveis para pedidos e cotações</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Plataformas Distintas</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.uniquePlatforms}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Canais e fontes de importação</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Artigos Vinculados</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.totalProductsLinked}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Produtos no catálogo com fornecedor</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="input-search-suppliers"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por fornecedor, plataforma ou telefone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Platform Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Plataforma:</span>
            <select
              id="select-filter-supplier-platform"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              <option value="todas">Todas as Plataformas</option>
              {allPlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Estado:</span>
            <select
              id="select-filter-supplier-status"
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

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Fornecedor</th>
                <th className="py-2.5 px-3">Plataforma / Canal</th>
                <th className="py-2.5 px-3">Contacto</th>
                <th className="py-2.5 px-3">Localização / Origem</th>
                <th className="py-2.5 px-3 text-center">Artigos Vinculados</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum fornecedor encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const cleanPhone = supplier.contact.replace(/\D/g, '');
                  const linkedCount = productCountBySupplier.get(supplier.id) || 0;
                  const isInactive = supplier.status === 'inativo';
                  const entityInfo = supplierEntitiesMap.get(supplier.id);

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {supplier.name}
                            </span>
                            {supplier.notes && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px] block" title={supplier.notes}>
                                {supplier.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plataforma */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {supplier.platform ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Globe className="w-3 h-3" />
                            {supplier.platform}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Não definida</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-slate-700 dark:text-slate-300">{supplier.contact}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Enviar mensagem no WhatsApp"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0.5 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Endereço / Localização */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={supplier.address}>
                        {supplier.address ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {supplier.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Artigos Vinculados & Entidade */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {linkedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              <Package className="w-3 h-3" />
                              {linkedCount} {linkedCount === 1 ? 'artigo' : 'artigos'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Nenhum artigo</span>
                          )}

                          {/* Company / Entity info */}
                          {entityInfo && entityInfo.companyNames.length > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] ${
                                entityInfo.inactiveCompany
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                              title={entityInfo.inactiveCompany ? 'Empresa com artigos está desativada' : undefined}
                            >
                              <Building2 className="w-2.5 h-2.5" />
                              {entityInfo.companyNames.join(', ')}
                            </span>
                          ) : entityInfo && entityInfo.hasOrphaned ? (
                            <span className="text-[10px] text-rose-500 dark:text-rose-400">
                              Vínculo sem empresa
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {!isInactive ? (
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
                            id={`btn-edit-supplier-${supplier.id}`}
                            onClick={() => handleOpenEdit(supplier)}
                            title="Editar fornecedor"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            id={`btn-delete-supplier-${supplier.id}`}
                            onClick={() => setSupplierToDelete(supplier)}
                            title="Eliminar fornecedor"
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

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplierToEdit={supplierToEdit}
      />

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div
          id="modal-delete-supplier-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="modal-delete-supplier-card"
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
                    Eliminar Fornecedor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deseja realmente remover "{supplierToDelete.name}"?
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-delete-supplier-modal"
                onClick={() => setSupplierToDelete(null)}
                aria-label="Fechar"
                title="Fechar"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              O sistema protege a integridade do catálogo: caso existam artigos em estoque associados a este fornecedor, a eliminação será bloqueada.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-supplier"
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
