import React, { useState, useMemo } from 'react';
import {
  UserRound,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Client } from '../../types/client';
import { ClientModal } from './ClientModal';

export const ClientesView: React.FC = () => {
  const { clients, sales, deleteClient } = useStock();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'todos' | 'individual' | 'empresa'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Deletion state & feedback
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compute purchase metrics for each client
  const clientMetrics = useMemo(() => {
    const metricsMap = new Map<string, { count: number; totalKz: number }>();

    sales.forEach((s) => {
      if (s.status === 'concluida') {
        // Match by clientId or by exact name match
        const matchingClient = clients.find(
          (c) => (s.clientId && c.id === s.clientId) || (s.clientName && c.name.toLowerCase() === s.clientName.toLowerCase())
        );

        if (matchingClient) {
          const current = metricsMap.get(matchingClient.id) || { count: 0, totalKz: 0 };
          const saleKz = s.total || 0;
          metricsMap.set(matchingClient.id, {
            count: current.count + 1,
            totalKz: current.totalKz + saleKz,
          });
        }
      }
    });

    return metricsMap;
  }, [sales, clients]);

  // Overall totals
  const overallStats = useMemo(() => {
    let totalPurchasesKz = 0;
    let clientsWithPurchases = 0;

    clientMetrics.forEach((val) => {
      if (val.count > 0) {
        clientsWithPurchases++;
        totalPurchasesKz += val.totalKz;
      }
    });

    return {
      totalClients: clients.length,
      individualCount: clients.filter((c) => c.type === 'individual').length,
      empresaCount: clients.filter((c) => c.type === 'empresa').length,
      clientsWithPurchases,
      totalPurchasesKz,
    };
  }, [clients, clientMetrics]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (selectedType !== 'todos' && c.type !== selectedType) return false;
      if (selectedStatus !== 'todos' && c.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q) || false;
        const matchDoc = c.document?.toLowerCase().includes(q) || false;
        const matchEmail = c.email?.toLowerCase().includes(q) || false;
        const matchAddress = c.address?.toLowerCase().includes(q) || false;
        return matchName || matchPhone || matchDoc || matchEmail || matchAddress;
      }
      return true;
    });
  }, [clients, selectedType, selectedStatus, searchTerm]);

  const handleOpenAdd = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setClientToEdit(c);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const result = deleteClient(clientToDelete.id);
    if (result.success) {
      setActionFeedback({ type: 'success', message: `Cliente "${clientToDelete.name}" eliminado com sucesso.` });
      setClientToDelete(null);
    } else {
      setActionFeedback({ type: 'error', message: result.message || 'Erro ao eliminar cliente.' });
      setClientToDelete(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Contactos • Clientes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Base de clientes particulares e corporativos, histórico de faturamento e dados de entrega
          </p>
        </div>

        {/* User Instruction: Add buttons should not have a '+' icon */}
        <button
          type="button"
          id="btn-add-client"
          onClick={handleOpenAdd}
          className="flex items-center justify-center px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.99]"
        >
          Novo Cliente
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Clientes</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <UserRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.totalClients}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registados no sistema</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Particulares</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.individualCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consumidores finais e pessoas físicas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Empresas / B2B</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {overallStats.empresaCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Clientes corporativos com NIF</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Faturado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(overallStats.totalPurchasesKz)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overallStats.clientsWithPurchases} clientes com compras realizadas
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="input-search-clients"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, NIF, telefone ou morada..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tipo:</span>
            <select
              id="select-filter-client-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="individual">Pessoa Particular</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Estado:</span>
            <select
              id="select-filter-client-status"
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

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">NIF / Identificação</th>
                <th className="py-2.5 px-3">Contacto</th>
                <th className="py-2.5 px-3">Endereço / Destino</th>
                <th className="py-2.5 px-3 text-right">Total Compras</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum cliente encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const cleanPhone = client.phone?.replace(/\D/g, '') || '';
                  const metrics = clientMetrics.get(client.id) || { count: 0, totalKz: 0 };

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name with initials avatar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              client.type === 'empresa'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {client.name}
                            </span>
                            {client.notes && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px] block" title={client.notes}>
                                {client.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {client.type === 'empresa' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Building2 className="w-3 h-3" />
                            Empresa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <UserRound className="w-3 h-3" />
                            Particular
                          </span>
                        )}
                      </td>

                      {/* NIF / Identificação */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                        {client.document ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {client.document}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {client.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-slate-700 dark:text-slate-300">{client.phone}</span>
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
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{client.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Endereço */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={client.address}>
                        {client.address ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {client.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Total Compras */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {metrics.count > 0 ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {formatCurrency(metrics.totalKz)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {metrics.count} {metrics.count === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Nenhuma venda</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {client.status === 'ativo' ? (
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
                            id={`btn-edit-client-${client.id}`}
                            onClick={() => handleOpenEdit(client)}
                            title="Editar cliente"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            id={`btn-delete-client-${client.id}`}
                            onClick={() => setClientToDelete(client)}
                            title="Eliminar cliente"
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

      {/* Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div
          id="modal-delete-client-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setClientToDelete(null)}
        >
          <div
            id="modal-delete-client-card"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Eliminar Cliente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Deseja realmente remover "{clientToDelete.name}"?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              O sistema protege os registros fiscais e comerciais: não será possível remover o cliente caso existam recibos de venda emitidos para ele.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-client"
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
