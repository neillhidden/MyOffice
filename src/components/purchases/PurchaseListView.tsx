import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Folder,
  Layers,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckSquare,
  Square,
  Globe,
  DollarSign,
  ShoppingCart,
  Trash2,
  X,
  FileText,
  Clock,
  Sparkles,
  Search,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  PurchaseGroup,
  PurchaseList,
  PurchaseSource,
  PurchaseListStatus,
  normalizePurchaseListStatus,
  SourceAvailability,
} from '../../types/stock';
import {
  formatKwanza,
  formatDate,
  convertToKwanza,
  formatUSD,
  USD_TO_KZ_RATE,
} from '../../utils/formatters';
import { PositiveBadge } from '../common/PositiveBadge';

interface StatusBadgeDropdownProps {
  status: PurchaseListStatus;
  onChangeStatus: (newStatus: PurchaseListStatus) => void;
  listName?: string;
  className?: string;
}

const STATUS_CONFIG: {
  key: PurchaseListStatus;
  label: string;
  badgeStyle: string;
  dotStyle: string;
  menuItemStyle: string;
}[] = [
  {
    key: 'em_pesquisa',
    label: 'Em pesquisa',
    badgeStyle:
      'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotStyle: 'bg-slate-500 dark:bg-slate-400',
    menuItemStyle:
      'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  },
  {
    key: 'concluido',
    label: 'Concluído',
    badgeStyle:
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/60',
    dotStyle: 'bg-emerald-500 dark:bg-emerald-400',
    menuItemStyle:
      'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
  },
  {
    key: 'cancelado',
    label: 'Cancelado',
    badgeStyle:
      'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/60',
    dotStyle: 'bg-rose-500 dark:bg-rose-400',
    menuItemStyle:
      'text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/50',
  },
];

const StatusBadgeDropdown: React.FC<StatusBadgeDropdownProps> = ({
  status,
  onChangeStatus,
  listName,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const normalized = normalizePurchaseListStatus(status);

  const currentOption =
    STATUS_CONFIG.find((opt) => opt.key === normalized) || STATUS_CONFIG[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            if (!isOpen) setIsOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Estado de ${listName || 'lista'}: ${currentOption.label}. Clique para alterar.`}
        title="Clique para alterar estado"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border transition-all cursor-pointer shadow-2xs select-none ${currentOption.badgeStyle}`}
      >
        {normalized === 'concluido' ? (
          <>
            <span className={`w-1.5 h-1.5 rounded-full dark:hidden ${currentOption.dotStyle}`} />
            <span className="hidden dark:inline-flex items-center justify-center w-4 h-4 rounded-full bg-dm-text text-dm-page dm-positive-dot shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          </>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotStyle}`} />
        )}
        <span>{currentOption.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Opções de estado da lista"
          className="absolute left-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_CONFIG.map((opt) => {
            const isSelected = opt.key === normalized;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(opt.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${opt.menuItemStyle} ${
                  isSelected ? 'font-semibold bg-slate-50 dark:bg-slate-800/60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dotStyle}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 opacity-80" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PurchaseListView: React.FC = () => {
  const {
    purchaseGroups,
    purchaseLists,
    purchaseSources,
    categories,
    addPurchaseGroup,
    updatePurchaseGroup,
    addPurchaseList,
    updatePurchaseList,
    deletePurchaseList,
    addPurchaseSource,
    updatePurchaseSource,
    toggleSourceAccounted,
    deletePurchaseSource,
  } = useStock();

  // Navigation Level State
  // 'main' -> Shows either Groups grid or Lists rows based on toggle
  // 'group_detail' -> Shows a specific group with its lists
  // 'list_detail' -> Shows a specific list with its sources
  const [viewLevel, setViewLevel] = useState<'main' | 'group_detail' | 'list_detail'>('main');
  const [mainViewMode, setMainViewMode] = useState<'grupos' | 'listas'>('grupos');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Modals for creation
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Modals and state for editing
  const [editingGroup, setEditingGroup] = useState<PurchaseGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');

  const [editingList, setEditingList] = useState<PurchaseList | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListCategory, setEditListCategory] = useState('');
  const [editListGroupId, setEditListGroupId] = useState<string | ''>('');
  const [editListStatus, setEditListStatus] = useState<PurchaseListStatus>('em_pesquisa');
  const [editListNotes, setEditListNotes] = useState('');

  // Delete modal state & error message
  const [listToDelete, setListToDelete] = useState<PurchaseList | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingSource, setEditingSource] = useState<PurchaseSource | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreLink, setEditStoreLink] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState<number | ''>('');
  const [editCurrency, setEditCurrency] = useState<'USD' | 'EUR' | 'CNY' | 'KZ'>('USD');
  const [editQuantity, setEditQuantity] = useState<number | ''>(1);
  const [editShippingCost, setEditShippingCost] = useState<number | ''>(0);
  const [editOtherCosts, setEditOtherCosts] = useState<number | ''>(0);
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editAvailability, setEditAvailability] = useState<SourceAvailability>('em_estoque');
  const [editSourceNotes, setEditSourceNotes] = useState('');
  const [editSourceAccounted, setEditSourceAccounted] = useState(true);

  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState(categories[0] || 'Geral');
  const [newListGroupId, setNewListGroupId] = useState<string | ''>('');
  const [newListNotes, setNewListNotes] = useState('');
  const [newListImage, setNewListImage] = useState(
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  );

  const [showNewSourceModal, setShowNewSourceModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('Alibaba');
  const [newStoreLink, setNewStoreLink] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState<number | ''>('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'EUR' | 'CNY' | 'KZ'>('USD');
  const [newQuantity, setNewQuantity] = useState<number | ''>(100);
  const [newShippingCost, setNewShippingCost] = useState<number | ''>(0);
  const [newOtherCosts, setNewOtherCosts] = useState<number | ''>(0);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newAvailability, setNewAvailability] = useState<SourceAvailability>('em_estoque');
  const [newSourceNotes, setNewSourceNotes] = useState('');
  const [newSourceAccounted, setNewSourceAccounted] = useState(true);

  // Collapsed states for Source cards in list_detail
  const [expandedSourceIds, setExpandedSourceIds] = useState<Record<string, boolean>>({});

  // Calculations for Lists (Centralized exclusive contribution by status)
  // - em_pesquisa: contribui para o Total pesquisado
  // - concluido: contribui para o Total selecionado (apenas fontes marcadas como Contabilizar)
  // - cancelado: não contribui para nenhum dos totais (0)
  const getListTotals = (listId: string) => {
    const list = purchaseLists.find((l) => l.id === listId);
    const sources = purchaseSources.filter((s) => s.listId === listId);
    let rawTotalResearchedKz = 0;
    let rawTotalAccountedKz = 0;
    let accountedSourcesCount = 0;

    sources.forEach((s) => {
      const totalInKz = convertToKwanza(s.totalPrice, s.originalCurrency, s.approxKzRate);
      rawTotalResearchedKz += totalInKz;
      if (s.isAccounted) {
        rawTotalAccountedKz += totalInKz;
        accountedSourcesCount++;
      }
    });

    const status = list ? normalizePurchaseListStatus(list.status) : 'em_pesquisa';

    const totalResearchedKz = status === 'em_pesquisa' ? rawTotalResearchedKz : 0;
    const totalAccountedKz = status === 'concluido' ? rawTotalAccountedKz : 0;

    return {
      status,
      sourcesCount: sources.length,
      accountedSourcesCount,
      totalResearchedKz,
      totalAccountedKz,
      rawTotalResearchedKz,
      rawTotalAccountedKz,
    };
  };

  // Calculations for Groups (sums of list totals)
  const getGroupTotals = (groupId: string) => {
    const listsInGroup = purchaseLists.filter((l) => l.groupId === groupId);
    let totalListsCount = listsInGroup.length;
    let totalGroupResearchedKz = 0;
    let totalGroupAccountedKz = 0;

    listsInGroup.forEach((l) => {
      const listTotals = getListTotals(l.id);
      totalGroupResearchedKz += listTotals.totalResearchedKz;
      totalGroupAccountedKz += listTotals.totalAccountedKz;
    });

    return {
      totalListsCount,
      totalGroupResearchedKz,
      totalGroupAccountedKz,
    };
  };

  // Handlers for Navigation
  const handleOpenGroupDetail = (groupId: string) => {
    setSelectedGroupId(groupId);
    setViewLevel('group_detail');
  };

  const handleOpenListDetail = (listId: string) => {
    setSelectedListId(listId);
    setViewLevel('list_detail');
  };

  const handleBackToMain = () => {
    setViewLevel('main');
    setSelectedGroupId(null);
    setSelectedListId(null);
  };

  const handleBackToGroup = () => {
    if (selectedGroupId) {
      setViewLevel('group_detail');
      setSelectedListId(null);
    } else {
      handleBackToMain();
    }
  };

  // Handle Create Group
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      addPurchaseGroup(newGroupName.trim(), newGroupDescription.trim() || undefined);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowNewGroupModal(false);
    }
  };

  // Handle Create List
  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      const created = addPurchaseList({
        name: newListName.trim(),
        category: newListCategory,
        groupId: newListGroupId || selectedGroupId || null,
        status: 'em_pesquisa',
        mainImage: newListImage,
        gallery: [newListImage],
        notes: newListNotes.trim() || undefined,
      });

      setNewListName('');
      setNewListNotes('');
      setShowNewListModal(false);

      // Open newly created list
      setSelectedListId(created.id);
      setViewLevel('list_detail');
    }
  };

  // Handle Create Source
  const handleSaveSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;

    const unit = Number(newUnitPrice) || 0;
    const qty = Number(newQuantity) || 1;
    const ship = Number(newShippingCost) || 0;
    const other = Number(newOtherCosts) || 0;

    let rate = 1;
    if (newCurrency === 'USD') rate = USD_TO_KZ_RATE;
    if (newCurrency === 'EUR') rate = 1010;
    if (newCurrency === 'CNY') rate = 128;

    addPurchaseSource({
      listId: selectedListId,
      storeName: newStoreName.trim() || 'Loja / Fornecedor',
      link: newStoreLink.trim() || undefined,
      unitPrice: unit,
      originalCurrency: newCurrency,
      approxKzRate: rate,
      quantity: qty,
      shippingCost: ship,
      otherCosts: other,
      supplierName: newSupplierName.trim() || undefined,
      availability: newAvailability,
      notes: newSourceNotes.trim() || undefined,
      isAccounted: newSourceAccounted,
    });

    setNewUnitPrice('');
    setNewStoreLink('');
    setNewSourceNotes('');
    setShowNewSourceModal(false);
  };

  // Handle Edit Group
  const handleOpenEditGroup = (group: PurchaseGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
  };

  const handleUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editGroupName.trim()) return;
    updatePurchaseGroup(
      editingGroup.id,
      editGroupName.trim(),
      editGroupDescription.trim() || undefined
    );
    setEditingGroup(null);
  };

  // Handle Edit List
  const handleOpenEditList = (list: PurchaseList, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingList(list);
    setEditListName(list.name);
    setEditListCategory(list.category);
    setEditListGroupId(list.groupId || '');
    setEditListStatus(normalizePurchaseListStatus(list.status));
    setEditListNotes(list.notes || '');
  };

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !editListName.trim()) return;
    try {
      updatePurchaseList(editingList.id, {
        name: editListName.trim(),
        category: editListCategory,
        groupId: editListGroupId || null,
        status: editListStatus,
        notes: editListNotes.trim() || undefined,
      });
      setEditingList(null);
    } catch (err) {
      console.error('Erro ao atualizar lista:', err);
      setActionError('Não foi possível guardar as alterações da lista. Tente novamente.');
    }
  };

  // Immediate Status Change (without modal)
  const handleQuickStatusChange = (listId: string, newStatus: PurchaseListStatus) => {
    try {
      updatePurchaseList(listId, { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setActionError('Não foi possível atualizar o status da lista. Tente novamente.');
    }
  };

  // Delete List Confirmation
  const handleConfirmDeleteList = () => {
    if (!listToDelete) return;
    try {
      const idToDelete = listToDelete.id;
      deletePurchaseList(idToDelete);
      if (selectedListId === idToDelete) {
        setSelectedListId(null);
        setViewLevel(selectedGroupId ? 'group_detail' : 'main');
      }
      setListToDelete(null);
    } catch (err) {
      console.error('Erro ao eliminar lista:', err);
      setActionError('Ocorreu um erro ao eliminar a lista de cotação.');
    }
  };

  // Handle Edit Source
  const handleOpenEditSource = (source: PurchaseSource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSource(source);
    setEditStoreName(source.storeName);
    setEditStoreLink(source.link || '');
    setEditUnitPrice(source.unitPrice);
    setEditCurrency(source.originalCurrency);
    setEditQuantity(source.quantity);
    setEditShippingCost(source.shippingCost);
    setEditOtherCosts(source.otherCosts);
    setEditSupplierName(source.supplierName || '');
    setEditAvailability(source.availability);
    setEditSourceNotes(source.notes || '');
    setEditSourceAccounted(source.isAccounted);
  };

  const handleUpdateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;

    const unit = Number(editUnitPrice) || 0;
    const qty = Number(editQuantity) || 1;
    const ship = Number(editShippingCost) || 0;
    const other = Number(editOtherCosts) || 0;

    let rate = 1;
    if (editCurrency === 'USD') rate = USD_TO_KZ_RATE;
    if (editCurrency === 'EUR') rate = 1010;
    if (editCurrency === 'CNY') rate = 128;

    updatePurchaseSource(editingSource.id, {
      storeName: editStoreName.trim() || 'Loja / Fornecedor',
      link: editStoreLink.trim() || undefined,
      unitPrice: unit,
      originalCurrency: editCurrency,
      approxKzRate: rate,
      quantity: qty,
      shippingCost: ship,
      otherCosts: other,
      supplierName: editSupplierName.trim() || undefined,
      availability: editAvailability,
      notes: editSourceNotes.trim() || undefined,
      isAccounted: editSourceAccounted,
    });

    setEditingSource(null);
  };

  const toggleSourceCard = (id: string) => {
    setExpandedSourceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Selected Group and List objects
  const currentGroup = purchaseGroups.find((g) => g.id === selectedGroupId);
  const currentList = purchaseLists.find((l) => l.id === selectedListId);
  const currentListSources = purchaseSources.filter((s) => s.listId === selectedListId);

  return (
    <div className="space-y-6">
      {/* ---------------- LEVEL 1: MAIN (Toggle Grupos / Listas) ---------------- */}
      {viewLevel === 'main' && (
        <div className="space-y-6">
          {/* Top Bar with Mode Toggle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg flex items-center gap-1">
                <button
                  type="button"
                  id="toggle-btn-grupos"
                  onClick={() => setMainViewMode('grupos')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mainViewMode === 'grupos'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Grupos de Compra ({purchaseGroups.length})
                </button>
                <button
                  type="button"
                  id="toggle-btn-listas"
                  onClick={() => setMainViewMode('listas')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mainViewMode === 'listas'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Todas as Listas ({purchaseLists.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mainViewMode === 'grupos' ? (
                <button
                  type="button"
                  id="btn-new-purchase-group"
                  onClick={() => setShowNewGroupModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <span>Novo Grupo</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-new-purchase-list"
                  onClick={() => setShowNewListModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <span>Nova Lista</span>
                </button>
              )}
            </div>
          </div>

          {/* VISTA 1: GRUPOS (Cards em Grid) */}
          {mainViewMode === 'grupos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchaseGroups.map((group) => {
                const totals = getGroupTotals(group.id);

                return (
                  <div
                    key={group.id}
                    onClick={() => handleOpenGroupDetail(group.id)}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                          Grupo de Cotações
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditGroup(group, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Editar Grupo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                            {totals.totalListsCount} {totals.totalListsCount === 1 ? 'lista' : 'listas'}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Selecionado p/ Compra:</span>
                        <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {formatKwanza(totals.totalGroupAccountedKz)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Total Pesquisado:</span>
                        <span className="font-mono">
                          {formatKwanza(totals.totalGroupResearchedKz)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 2: LISTAS (Formato de Linhas) */}
          {mainViewMode === 'listas' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-4">Item / Cotação</th>
                      <th className="py-3 px-4">Grupo Vinculado</th>
                      <th className="py-3 px-4">Fontes / Lojas</th>
                      <th className="py-3 px-4 text-right">Valor Pesquisado</th>
                      <th className="py-3 px-4 text-right">Valor Contabilizado</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {purchaseLists.map((list) => {
                      const group = purchaseGroups.find((g) => g.id === list.groupId);
                      const totals = getListTotals(list.id);

                      return (
                        <tr
                          key={list.id}
                          onClick={() => handleOpenListDetail(list.id)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {list.mainImage && (
                                <img
                                  src={list.mainImage}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                  {list.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {list.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {group ? (
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {group.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                Sem grupo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {totals.accountedSourcesCount} de {totals.sourcesCount} ativas
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                            {formatKwanza(totals.totalResearchedKz)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatKwanza(totals.totalAccountedKz)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <StatusBadgeDropdown
                              status={list.status}
                              onChangeStatus={(newStatus) => handleQuickStatusChange(list.id, newStatus)}
                              listName={list.name}
                            />
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditList(list, e)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Editar lista"
                                aria-label={`Editar lista ${list.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setListToDelete(list);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                                title="Eliminar lista"
                                aria-label={`Eliminar lista ${list.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          )}
        </div>
      )}

      {/* ---------------- LEVEL 2: DETALHE DO GRUPO ---------------- */}
      {viewLevel === 'group_detail' && currentGroup && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToMain}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Grupos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewListGroupId(currentGroup.id);
                setShowNewListModal(true);
              }}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <span>Adicionar Lista a este Grupo</span>
            </button>
          </div>

          {/* Group Card Header */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Grupo de Cotações Selecionado
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {currentGroup.name}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditGroup(currentGroup, e)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors inline-flex items-center cursor-pointer"
                    title="Editar grupo"
                    aria-label={`Editar grupo ${currentGroup.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {currentGroup.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentGroup.description}</p>
                )}
              </div>

              {/* Group summary numbers */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                    Total Selecionado (Kz)
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {formatKwanza(getGroupTotals(currentGroup.id).totalGroupAccountedKz)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                    Total Pesquisado
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {formatKwanza(getGroupTotals(currentGroup.id).totalGroupResearchedKz)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Group Lists Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Listas de Cotação pertencentes a este Grupo
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">Item / Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Fontes Registadas</th>
                    <th className="py-3 px-4 text-right">Total Pesquisado</th>
                    <th className="py-3 px-4 text-right">Total Contabilizado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {purchaseLists
                    .filter((l) => l.groupId === currentGroup.id)
                    .map((list) => {
                      const totals = getListTotals(list.id);

                      return (
                        <tr
                          key={list.id}
                          onClick={() => handleOpenListDetail(list.id)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              {list.mainImage && (
                                <img
                                  src={list.mainImage}
                                  alt=""
                                  className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700"
                                />
                              )}
                              <span>{list.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{list.category}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono">
                              {totals.accountedSourcesCount} / {totals.sourcesCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                            {formatKwanza(totals.totalResearchedKz)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatKwanza(totals.totalAccountedKz)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <StatusBadgeDropdown
                              status={list.status}
                              onChangeStatus={(newStatus) => handleQuickStatusChange(list.id, newStatus)}
                              listName={list.name}
                            />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditList(list, e)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Editar lista"
                                aria-label={`Editar lista ${list.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setListToDelete(list);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                                title="Eliminar lista"
                                aria-label={`Eliminar lista ${list.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* ---------------- LEVEL 3: DETALHE DA LISTA & FONTES ---------------- */}
      {viewLevel === 'list_detail' && currentList && (
        <div className="space-y-6">
          {/* Breadcrumb Back Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToGroup}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {selectedGroupId ? 'Voltar para o Grupo' : 'Voltar para Lista Geral'}
              </span>
            </button>

            <button
              type="button"
              id="btn-add-source"
              onClick={() => setShowNewSourceModal(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <span>Adicionar Fonte / Loja</span>
            </button>
          </div>

          {/* List Header Card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {currentList.mainImage && (
                  <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={currentList.mainImage}
                      alt={currentList.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {currentList.category}
                    </span>
                    <StatusBadgeDropdown
                      status={currentList.status}
                      onChangeStatus={(newStatus) => handleQuickStatusChange(currentList.id, newStatus)}
                      listName={currentList.name}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {currentList.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditList(currentList, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors inline-flex items-center cursor-pointer"
                        title="Editar lista"
                        aria-label={`Editar lista ${currentList.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setListToDelete(currentList)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors inline-flex items-center cursor-pointer"
                        title="Eliminar lista"
                        aria-label={`Eliminar lista ${currentList.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {currentList.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Observações: {currentList.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* List Totals */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                    Total Selecionado (Kz)
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {formatKwanza(getListTotals(currentList.id).totalAccountedKz)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                    Total Pesquisado
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {formatKwanza(getListTotals(currentList.id).totalResearchedKz)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rule Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>
              <strong>Regra de Cálculo:</strong> Apenas as Fontes marcadas com <strong>"Contabilizar"</strong> somam ao valor final da Lista e do Grupo. O total atualiza imediatamente.
            </span>
          </div>

          {/* Sources Collapsible Cards Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Fontes & Cotações Encontradas ({currentListSources.length})
            </h4>

            {currentListSources.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400 dark:text-slate-500">Nenhuma fonte registada para este item.</p>
                <button
                  type="button"
                  onClick={() => setShowNewSourceModal(true)}
                  className="text-xs text-slate-900 dark:text-slate-100 font-semibold underline mt-2 inline-block cursor-pointer"
                >
                  Adicionar cotação (Alibaba, Amazon, Temu...)
                </button>
              </div>
            ) : (
              currentListSources.map((src) => {
                const isExpanded = expandedSourceIds[src.id] !== false; // expanded by default
                const approxTotalKz = convertToKwanza(
                  src.totalPrice,
                  src.originalCurrency,
                  src.approxKzRate
                );

                return (
                  <div
                    key={src.id}
                    className={`bg-white dark:bg-slate-900 border rounded-xl shadow-xs transition-colors overflow-hidden ${
                      src.isAccounted
                        ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-100 dark:ring-emerald-950'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Collapsible Card Header */}
                    <div className="p-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        {/* Checkbox "Contabilizar" */}
                        <button
                          type="button"
                          id={`btn-toggle-accounted-${src.id}`}
                          onClick={() => toggleSourceAccounted(src.id)}
                          className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white p-1 transition-colors cursor-pointer"
                          aria-label={
                            src.isAccounted
                              ? `Remover cotação de ${src.storeName} da contabilização total`
                              : `Incluir cotação de ${src.storeName} na contabilização total`
                          }
                          title={
                            src.isAccounted
                              ? 'Contabilizado no total (clique para desmarcar)'
                              : 'Não contabilizado (clique para incluir no total)'
                          }
                        >
                          {src.isAccounted ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {src.storeName}
                            </span>
                            {src.link && (
                              <a
                                href={src.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                src.isAccounted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {src.isAccounted ? 'Contabilizado' : 'Não contabilizado'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Qtd: <strong>{src.quantity} un</strong> • Unitário: {src.unitPrice} {src.originalCurrency}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {src.totalPrice.toLocaleString()} {src.originalCurrency}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block">
                            ≈ {formatKwanza(approxTotalKz)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSource(src, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Editar Fonte / Loja"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSourceCard(src.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Card Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                            Frete Estimado
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {src.shippingCost} {src.originalCurrency}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                            Outros Custos / Taxas
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {src.otherCosts} {src.originalCurrency}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                            Fornecedor / Loja
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {src.supplierName || 'Vendedor Padrão'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block mb-0.5">
                              Disponibilidade
                            </span>
                            {src.availability === 'em_estoque' ? (
                              <PositiveBadge label="Em estoque" />
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300 capitalize">
                                {src.availability.replace('_', ' ')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditSource(src, e)}
                              className="dm-icon-action text-slate-400 hover:text-slate-700 dark:text-dm-muted dark:hover:text-dm-text p-1 rounded hover:bg-slate-200/50 dark:hover:bg-dm-elevated cursor-pointer"
                              title="Editar fonte"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePurchaseSource(src.id)}
                              className="dm-icon-action text-slate-400 hover:text-rose-600 dark:text-dm-muted dark:hover:text-dm-text p-1 rounded hover:bg-rose-50 dark:hover:bg-dm-elevated cursor-pointer"
                              title="Eliminar fonte"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {src.notes && (
                          <div className="col-span-full pt-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Observações: {src.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: Novo Grupo */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Criar Novo Grupo de Compra</h4>
            <form onSubmit={handleSaveGroup} className="space-y-3 text-xs">
              <div>
                <label htmlFor="input-new-group-name" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Grupo
                </label>
                <input
                  id="input-new-group-name"
                  type="text"
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Campanha de Páscoa 2026"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="input-new-group-desc" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  id="input-new-group-desc"
                  rows={2}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Objetivo da cotação, prazos..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Guardar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nova Lista */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Criar Nova Lista de Produto</h4>
            <form onSubmit={handleSaveList} className="space-y-3 text-xs">
              <div>
                <label htmlFor="input-new-list-name" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produto a Cotar
                </label>
                <input
                  id="input-new-list-name"
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Fones de Ouvido Sem Fio TWS"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="select-new-list-category" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  id="select-new-list-category"
                  value={newListCategory}
                  onChange={(e) => setNewListCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="select-new-list-group" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pertence ao Grupo
                </label>
                <select
                  id="select-new-list-group"
                  value={newListGroupId}
                  onChange={(e) => setNewListGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  <option value="">Sem grupo (Lista Avulsa)</option>
                  {purchaseGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="input-new-list-notes" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <input
                  id="input-new-list-notes"
                  type="text"
                  value={newListNotes}
                  onChange={(e) => setNewListNotes(e.target.value)}
                  placeholder="Critérios de qualidade, certificação..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Criar e Abrir Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nova Fonte / Cotação */}
      {showNewSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-lg w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Adicionar Nova Fonte / Loja de Cotação
            </h4>
            <form onSubmit={handleSaveSource} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-new-source-store" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Loja / Plataforma
                  </label>
                  <input
                    id="input-new-source-store"
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="Ex: Alibaba, Amazon, 1688..."
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="select-new-source-currency" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Moeda Original
                  </label>
                  <select
                    id="select-new-source-currency"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="KZ">Kwanza (Kz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="input-new-source-link" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link / URL do Produto
                </label>
                <input
                  id="input-new-source-link"
                  type="url"
                  value={newStoreLink}
                  onChange={(e) => setNewStoreLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label htmlFor="input-new-source-price" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Preço Unitário ({newCurrency})
                  </label>
                  <input
                    id="input-new-source-price"
                    type="number"
                    step="any"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-source-qty" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Quantidade
                  </label>
                  <input
                    id="input-new-source-qty"
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="100"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-source-shipping" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Frete ({newCurrency})
                  </label>
                  <input
                    id="input-new-source-shipping"
                    type="number"
                    step="any"
                    value={newShippingCost}
                    onChange={(e) => setNewShippingCost(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-source-other" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Outros Custos ({newCurrency})
                  </label>
                  <input
                    id="input-new-source-other"
                    type="number"
                    step="any"
                    value={newOtherCosts}
                    onChange={(e) => setNewOtherCosts(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-contabilizar-new"
                  checked={newSourceAccounted}
                  onChange={(e) => setNewSourceAccounted(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 focus:ring-slate-500 cursor-pointer"
                />
                <label htmlFor="chk-contabilizar-new" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Marcar como "Contabilizar" (somar ao valor selecionado)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSourceModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Guardar Fonte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Grupo */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Editar Grupo de Compra</h4>
            <form onSubmit={handleUpdateGroup} className="space-y-3 text-xs">
              <div>
                <label htmlFor="input-edit-group-name" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Grupo
                </label>
                <input
                  id="input-edit-group-name"
                  type="text"
                  autoFocus
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Ex: Produto Vencedor"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="input-edit-group-desc" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  id="input-edit-group-desc"
                  rows={2}
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  placeholder="Objetivo da cotação, prazos..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Atualizar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Lista */}
      {editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Editar Lista de Produto</h4>
            <form onSubmit={handleUpdateList} className="space-y-3 text-xs">
              <div>
                <label htmlFor="input-edit-list-name" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produto a Cotar
                </label>
                <input
                  id="input-edit-list-name"
                  type="text"
                  autoFocus
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  placeholder="Ex: Cooler magnético para telefone."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="select-edit-list-category" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  id="select-edit-list-category"
                  value={editListCategory}
                  onChange={(e) => setEditListCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="select-edit-list-group" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pertence ao Grupo
                </label>
                <select
                  id="select-edit-list-group"
                  value={editListGroupId}
                  onChange={(e) => setEditListGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  <option value="">Sem grupo (Lista Avulsa)</option>
                  {purchaseGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="select-edit-list-status" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  id="select-edit-list-status"
                  value={editListStatus}
                  onChange={(e) => setEditListStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                >
                  <option value="em_pesquisa">Em Pesquisa</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label htmlFor="input-edit-list-notes" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <input
                  id="input-edit-list-notes"
                  type="text"
                  value={editListNotes}
                  onChange={(e) => setEditListNotes(e.target.value)}
                  placeholder="Critérios de qualidade, notas..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingList(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Atualizar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Fonte / Cotação */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-lg w-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Editar Fonte / Loja de Cotação
            </h4>
            <form onSubmit={handleUpdateSource} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-edit-source-store" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Loja / Plataforma
                  </label>
                  <input
                    id="input-edit-source-store"
                    type="text"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    placeholder="Ex: Alibaba, Amazon, 1688, ChatGPT..."
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="select-edit-source-currency" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Moeda Original
                  </label>
                  <select
                    id="select-edit-source-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="KZ">Kwanza (Kz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="input-edit-source-link" className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link / URL do Produto
                </label>
                <input
                  id="input-edit-source-link"
                  type="url"
                  value={editStoreLink}
                  onChange={(e) => setEditStoreLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label htmlFor="input-edit-source-price" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Preço Unitário ({editCurrency})
                  </label>
                  <input
                    id="input-edit-source-price"
                    type="number"
                    step="any"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-edit-source-qty" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Quantidade
                  </label>
                  <input
                    id="input-edit-source-qty"
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setNewQuantity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="100"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-edit-source-shipping" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Frete ({editCurrency})
                  </label>
                  <input
                    id="input-edit-source-shipping"
                    type="number"
                    step="any"
                    value={editShippingCost}
                    onChange={(e) => setEditShippingCost(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="input-edit-source-other" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Outros Custos ({editCurrency})
                  </label>
                  <input
                    id="input-edit-source-other"
                    type="number"
                    step="any"
                    value={editOtherCosts}
                    onChange={(e) => setEditOtherCosts(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-edit-source-supplier" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Fornecedor / Loja
                  </label>
                  <input
                    id="input-edit-source-supplier"
                    type="text"
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                    placeholder="Nome do vendedor"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="select-edit-source-avail" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Disponibilidade
                  </label>
                  <select
                    id="select-edit-source-avail"
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100"
                  >
                    <option value="em_estoque">Em Estoque</option>
                    <option value="sob_encomenda">Sob Encomenda</option>
                    <option value="esgotado">Esgotado</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="input-edit-source-notes" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                  Observações
                </label>
                <input
                  id="input-edit-source-notes"
                  type="text"
                  value={editSourceNotes}
                  onChange={(e) => setEditSourceNotes(e.target.value)}
                  placeholder="Notas, prazos..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-contabilizar-edit"
                  checked={editSourceAccounted}
                  onChange={(e) => setEditSourceAccounted(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 focus:ring-slate-500 cursor-pointer"
                />
                <label htmlFor="chk-contabilizar-edit" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Marcar como "Contabilizar" (somar ao valor selecionado)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSource(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                >
                  Atualizar Fonte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Eliminar Lista */}
      {listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Eliminar Lista de Cotação
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tem certeza que deseja eliminar a lista <strong className="text-slate-800 dark:text-slate-200">{listToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <span className="font-semibold block">Efeito sobre as fontes associadas:</span>
              <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Esta lista possui <strong>{purchaseSources.filter((s) => s.listId === listToDelete.id).length}</strong> fonte(s) / loja(s) vinculada(s). Ao eliminar a lista, todas as cotações e fontes associadas serão permanentemente excluídas e os totais e contadores do grupo serão recalculados imediatamente.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteList}
                className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Eliminar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de Erro */}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Fechar"
            title="Fechar"
            className="text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
