import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Package,
  Building,
  Building2,
  TrendingDown,
  TrendingUp,
  Boxes,
  ArrowUpDown,
  CheckCircle2,
  Edit3,
  Trash2,
  FileEdit,
  RotateCcw,
  Warehouse as WarehouseIcon,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useStock, ProductStockInfo } from '../../context/StockContext';
import { useWarehouseFilters } from '../../context/WarehouseFilterContext';
import { formatKwanza } from '../../utils/formatters';
import { Product } from '../../types/stock';
import { FilterCheckboxDropdown, FilterOption } from './FilterCheckboxDropdown';

interface WarehouseStockViewProps {
  onOpenAddProduct: () => void;
  onEditProduct?: (product: Product) => void;
  onOpenDrafts?: () => void;
  onSelectProduct: (productId: string) => void;
  searchQuery: string;
}

export const WarehouseStockView: React.FC<WarehouseStockViewProps> = ({
  onOpenAddProduct,
  onEditProduct,
  onOpenDrafts,
  onSelectProduct,
  searchQuery,
}) => {
  const {
    products,
    warehouses,
    companies,
    stockConfigs,
    categories,
    productDrafts,
    getProductStockInfo,
    getProductStockInfoForCompany,
    getCurrentStock,
    getProductWarehouses,
    getProductCompanies,
    deleteProduct,
  } = useStock();

  const {
    selectedCompanyIds,
    setSelectedCompanyIds,
    selectedWarehouseIds,
    setSelectedWarehouseIds,
    selectedCategories,
    setSelectedCategories,
    selectedStatuses,
    setSelectedStatuses,
    selectedConditions,
    setSelectedConditions,
    hideZeroStock,
    setHideZeroStock,
    stockLevelFilter,
    setStockLevelFilter,
    searchQuery: contextSearchQuery,
    visibleWarehouses,
    handleCompanyChange,
    isAnyFilterActive,
    resetAllFilters,
  } = useWarehouseFilters();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const effectiveSearchQuery = searchQuery !== undefined ? searchQuery : contextSearchQuery;

  // Helper to compute stock info based on active warehouse/company multi-filter
  const getFilterStockInfo = useCallback(
    (productId: string): ProductStockInfo => {
      // Case 1: Specific warehouses filtered
      if (selectedWarehouseIds.length < warehouses.length) {
        if (selectedWarehouseIds.length === 0) {
          return { currentStock: 0, minLimit: 0, maxLimit: 0, status: 'zerado' };
        }
        if (selectedWarehouseIds.length === 1) {
          return getProductStockInfo(productId, selectedWarehouseIds[0]);
        }
        const current = selectedWarehouseIds.reduce((sum, whId) => {
          return sum + Math.max(0, getCurrentStock(productId, whId));
        }, 0);
        const relevantConfigs = stockConfigs.filter(
          (c) => c.productId === productId && selectedWarehouseIds.includes(c.warehouseId)
        );
        const minLimit = relevantConfigs.reduce((sum, c) => sum + c.minLimit, 0);
        const maxLimit = relevantConfigs.reduce((sum, c) => sum + c.maxLimit, 0);

        let status: ProductStockInfo['status'] = 'normal';
        if (current === 0) {
          status = 'zerado';
        } else if (minLimit > 0 && current < minLimit) {
          status = 'critico_baixo';
        } else if (maxLimit > 0 && current > maxLimit) {
          status = 'excesso';
        }
        return { currentStock: current, minLimit, maxLimit, status };
      }

      // Case 2: Specific companies filtered
      if (selectedCompanyIds.length < companies.length) {
        if (selectedCompanyIds.length === 0) {
          return { currentStock: 0, minLimit: 0, maxLimit: 0, status: 'zerado' };
        }
        if (selectedCompanyIds.length === 1) {
          return getProductStockInfoForCompany(productId, selectedCompanyIds[0]);
        }
        let current = 0;
        let minLimit = 0;
        let maxLimit = 0;
        selectedCompanyIds.forEach((cId) => {
          const cInfo = getProductStockInfoForCompany(productId, cId);
          current += cInfo.currentStock;
          minLimit += cInfo.minLimit;
          maxLimit += cInfo.maxLimit;
        });
        let status: ProductStockInfo['status'] = 'normal';
        if (current === 0) {
          status = 'zerado';
        } else if (minLimit > 0 && current < minLimit) {
          status = 'critico_baixo';
        } else if (maxLimit > 0 && current > maxLimit) {
          status = 'excesso';
        }
        return { currentStock: current, minLimit, maxLimit, status };
      }

      // Case 3: Overall stock across all companies & warehouses
      return getProductStockInfo(productId);
    },
    [
      selectedWarehouseIds,
      warehouses.length,
      selectedCompanyIds,
      companies.length,
      getProductStockInfo,
      getCurrentStock,
      stockConfigs,
      getProductStockInfoForCompany,
    ]
  );

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query
      if (effectiveSearchQuery.trim()) {
        const query = effectiveSearchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesBarcode = product.barcode?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand && !matchesBarcode) {
          return false;
        }
      }

      // 2. Category Filter (Caixa de seleção)
      if (selectedCategories.length === 0 || !selectedCategories.includes(product.category)) {
        return false;
      }

      // 3. Status Filter (Caixa de seleção)
      if (selectedStatuses.length === 0 || !selectedStatuses.includes(product.status)) {
        return false;
      }

      // 4. Condition Filter (Caixa de seleção)
      if (selectedConditions.length === 0 || !selectedConditions.includes(product.condition || 'novo')) {
        return false;
      }

      // 5. If user unchecked all companies or warehouses: show 0 products
      if (selectedCompanyIds.length === 0 || selectedWarehouseIds.length === 0) {
        return false;
      }

      // Relação Estoque (Produto × Armazém) → Armazém → Empresa
      const prodWhs = getProductWarehouses(product.id);
      const prodWhIds = prodWhs.map((w) => w.id);
      const prodCompIds = prodWhs.map((w) => w.companyId);

      // 6. Filtro por Empresa:
      // Depende exclusivamente da relação Estoque (Produto × Armazém) → Armazém → Empresa,
      // NUNCA da existência de movimentações!
      if (selectedCompanyIds.length < companies.length) {
        const belongsToCompany = prodCompIds.some((cId) => selectedCompanyIds.includes(cId));
        if (!belongsToCompany) {
          return false;
        }
      }

      // 7. Filtro por Armazém / Local:
      // Depende exclusivamente da relação Estoque (Produto × Armazém)
      if (selectedWarehouseIds.length < warehouses.length) {
        const belongsToWarehouse = prodWhIds.some((whId) => selectedWarehouseIds.includes(whId));
        if (!belongsToWarehouse) {
          return false;
        }
      }

      // 8. Cálculo de estoque atual (via LEFT JOIN sobre Movimentação com COALESCE(SUM, 0))
      const stockInfo = getFilterStockInfo(product.id);

      // 9. Opção Ocultar / Mostrar Estoque Zero:
      // Apenas exclui se o utilizador ativou explicitamente a opção de ocultar (hideZeroStock = true).
      // Se "mostrar estoque zero" estiver ativo (hideZeroStock = false), o produto com quantidade = 0
      // NUNCA é excluído do resultado!
      if (hideZeroStock && stockInfo.currentStock <= 0) {
        return false;
      }

      // 10. Stock Level Filter (Cards de métrica)
      if (stockLevelFilter === 'baixo' && stockInfo.status !== 'critico_baixo') return false;
      if (stockLevelFilter === 'normal' && stockInfo.status !== 'normal') return false;
      if (stockLevelFilter === 'excesso' && stockInfo.status !== 'excesso') return false;
      if (stockLevelFilter === 'zerado' && stockInfo.status !== 'zerado') return false;

      return true;
    });
  }, [
    products,
    effectiveSearchQuery,
    selectedCategories,
    selectedStatuses,
    selectedConditions,
    selectedCompanyIds,
    selectedWarehouseIds,
    companies.length,
    warehouses.length,
    hideZeroStock,
    stockLevelFilter,
    getProductWarehouses,
    getFilterStockInfo,
  ]);

  // Global counts for metrics
  const metrics = useMemo(() => {
    let totalItemsStock = 0;
    let criticalCount = 0;
    let excessCount = 0;
    let zeroCount = 0;
    let totalStockValueKz = 0;

    products.forEach((p) => {
      // Must belong to filtered company/warehouse
      const pWhs = getProductWarehouses(p.id);
      const pWhIds = pWhs.map((w) => w.id);
      const pCompIds = pWhs.map((w) => w.companyId);

      if (selectedCompanyIds.length < companies.length) {
        if (!pCompIds.some((cId) => selectedCompanyIds.includes(cId))) {
          return;
        }
      }
      if (selectedWarehouseIds.length < warehouses.length) {
        if (!pWhIds.some((whId) => selectedWarehouseIds.includes(whId))) {
          return;
        }
      }

      const info = getFilterStockInfo(p.id);

      totalItemsStock += info.currentStock;
      totalStockValueKz += info.currentStock * p.costPrice;

      if (info.status === 'critico_baixo') criticalCount++;
      if (info.status === 'excesso') excessCount++;
      if (info.status === 'zerado') zeroCount++;
    });

    return {
      totalItemsStock,
      criticalCount,
      excessCount,
      zeroCount,
      totalStockValueKz,
    };
  }, [
    products,
    getFilterStockInfo,
    getProductWarehouses,
    selectedCompanyIds,
    selectedWarehouseIds,
    companies.length,
    warehouses.length,
  ]);

  // Subtitle for banner
  const bannerSubtitle = useMemo(() => {
    if (selectedWarehouseIds.length === 1) {
      const wh = warehouses.find((w) => w.id === selectedWarehouseIds[0]);
      const comp = companies.find((c) => c.id === wh?.companyId);
      return `${wh?.name || 'Armazém'} (${comp?.name || ''})`;
    }
    if (selectedWarehouseIds.length < warehouses.length) {
      return `${selectedWarehouseIds.length} armazéns selecionados`;
    }
    if (selectedCompanyIds.length === 1) {
      const comp = companies.find((c) => c.id === selectedCompanyIds[0]);
      return `Estoque em armazéns da ${comp?.name || 'Empresa'}`;
    }
    if (selectedCompanyIds.length < companies.length) {
      return `Estoque em ${selectedCompanyIds.length} empresas selecionadas`;
    }
    return 'Todos os armazéns e lojas';
  }, [selectedWarehouseIds, selectedCompanyIds, warehouses, companies]);

  // Filter option sets with counts
  const companyOptions: FilterOption[] = useMemo(() => {
    return companies
      .filter((c) => c.status !== 'desativada')
      .map((c) => {
        const isParada = c.status === 'parada';
        const count = products.filter((p) => {
          const pComps = getProductCompanies(p.id);
          const belongs = pComps.some((comp) => comp.id === c.id);
          if (!belongs) return false;
          if (hideZeroStock) {
            return getProductStockInfoForCompany(p.id, c.id).currentStock > 0;
          }
          return true;
        }).length;
        const compWhs = warehouses.filter((w) => w.companyId === c.id);
        return {
          id: c.id,
          label: isParada ? `${c.name} [Parada]` : c.name,
          count,
          badge: isParada ? 'Parada' : undefined,
          sublabel: isParada
            ? 'Empresa parada — consulta somente leitura'
            : `${compWhs.length} armazém(ns) • NIF: ${c.nif}`,
        };
      });
  }, [companies, products, warehouses, hideZeroStock, getProductCompanies, getProductStockInfoForCompany]);

  const warehouseOptions: FilterOption[] = useMemo(() => {
    return visibleWarehouses
      .filter((w) => {
        const comp = companies.find((c) => c.id === w.companyId);
        return comp?.status !== 'desativada';
      })
      .map((w) => {
        const comp = companies.find((c) => c.id === w.companyId);
        const isParada = comp?.status === 'parada';
        const count = products.filter((p) => {
          const pWhs = getProductWarehouses(p.id);
          const belongs = pWhs.some((wh) => wh.id === w.id);
          if (!belongs) return false;
          if (hideZeroStock) {
            return getProductStockInfo(p.id, w.id).currentStock > 0;
          }
          return true;
        }).length;
        return {
          id: w.id,
          label: isParada ? `${w.name} [Parada]` : w.name,
          count,
          badge: isParada ? 'Parada' : undefined,
          sublabel: isParada ? 'Armazém de empresa parada — somente leitura' : comp?.name,
        };
      });
  }, [visibleWarehouses, products, companies, hideZeroStock, getProductWarehouses, getProductStockInfo]);

  const categoryOptions: FilterOption[] = useMemo(() => {
    return categories.map((cat) => {
      const count = products.filter((p) => p.category === cat).length;
      return {
        id: cat,
        label: cat,
        count,
      };
    });
  }, [categories, products]);

  const statusOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ativo', label: 'Ativo', count: products.filter((p) => p.status === 'ativo').length },
      {
        id: 'inativo',
        label: 'Inativo',
        count: products.filter((p) => p.status === 'inativo').length,
      },
      {
        id: 'descontinuado',
        label: 'Descontinuado',
        count: products.filter((p) => p.status === 'descontinuado').length,
      },
    ];
  }, [products]);

  const conditionOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'novo', label: 'Novo', count: products.filter((p) => p.condition === 'novo').length },
      {
        id: 'novo_usado',
        label: 'Novo e Usado',
        count: products.filter((p) => p.condition === 'novo_usado').length,
      },
      { id: 'usado', label: 'Usado', count: products.filter((p) => p.condition === 'usado').length },
      { id: 'troca', label: 'Troca', count: products.filter((p) => p.condition === 'troca').length },
    ];
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total de Unidades em Estoque
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {metrics.totalItemsStock}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">itens</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={bannerSubtitle}>
            {bannerSubtitle}
          </p>
        </div>

        <div
          onClick={() => setStockLevelFilter(stockLevelFilter === 'baixo' ? 'all' : 'baixo')}
          className={`p-4 border rounded-xl shadow-xs cursor-pointer transition-colors ${
            stockLevelFilter === 'baixo'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-300'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Estoque Crítico (Abaixo Mín.)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {metrics.criticalCount}
            </span>
            <span className="text-xs text-rose-500 dark:text-rose-400">produtos</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stockLevelFilter === 'baixo' ? 'Filtro ativo • Clique para limpar' : 'Requer reposição urgente'}
          </p>
        </div>

        <div
          onClick={() => setStockLevelFilter(stockLevelFilter === 'excesso' ? 'all' : 'excesso')}
          className={`p-4 border rounded-xl shadow-xs cursor-pointer transition-colors ${
            stockLevelFilter === 'excesso'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-300'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Excesso de Estoque
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {metrics.excessCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">produtos</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stockLevelFilter === 'excesso' ? 'Filtro ativo • Clique para limpar' : 'Acima da capacidade máxima'}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Valor em Estoque (Custo)
          </span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 truncate">
            {formatKwanza(metrics.totalStockValueKz)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Capital imobilizado apurado
          </p>
        </div>
      </div>

      {/* Filter Toolbar (Caixas de seleção interativas para todos os filtros) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Empresa Filter (Caixa de seleção multi-select com checkboxes) */}
          <FilterCheckboxDropdown
            id="company"
            label="Empresa"
            icon={<Building2 className="w-3.5 h-3.5" />}
            options={companyOptions}
            selectedIds={selectedCompanyIds}
            onChange={handleCompanyChange}
            allLabel="Todas"
            searchPlaceholder="Buscar empresa..."
            extraCheckbox={{
              id: 'chk-hide-zero-company',
              label: 'Ocultar produtos com estoque 0',
              checked: hideZeroStock,
              onChange: setHideZeroStock,
            }}
          />

          {/* Armazém / Local Selector (Caixa de seleção) */}
          <FilterCheckboxDropdown
            id="warehouse"
            label="Local"
            icon={<WarehouseIcon className="w-3.5 h-3.5" />}
            options={warehouseOptions}
            selectedIds={selectedWarehouseIds}
            onChange={setSelectedWarehouseIds}
            allLabel="Todos"
            searchPlaceholder="Buscar armazém ou loja..."
            extraCheckbox={{
              id: 'chk-hide-zero-warehouse',
              label: 'Ocultar produtos com estoque 0',
              checked: hideZeroStock,
              onChange: setHideZeroStock,
            }}
          />

          {/* Categoria Selector (Caixa de seleção) */}
          <FilterCheckboxDropdown
            id="category"
            label="Categoria"
            icon={<Filter className="w-3.5 h-3.5" />}
            options={categoryOptions}
            selectedIds={selectedCategories}
            onChange={setSelectedCategories}
            allLabel="Todas"
            searchPlaceholder="Buscar categoria..."
            extraCheckbox={{
              id: 'chk-hide-zero-category',
              label: 'Ocultar produtos com estoque 0',
              checked: hideZeroStock,
              onChange: setHideZeroStock,
            }}
          />

          {/* Status / Estado Selector (Caixa de seleção) */}
          <FilterCheckboxDropdown
            id="status"
            label="Estado"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            options={statusOptions}
            selectedIds={selectedStatuses}
            onChange={setSelectedStatuses}
            allLabel="Todos"
            extraCheckbox={{
              id: 'chk-hide-zero-status',
              label: 'Ocultar produtos com estoque 0',
              checked: hideZeroStock,
              onChange: setHideZeroStock,
            }}
          />

          {/* Condição / Estado do artigo Selector (Caixa de seleção) */}
          <FilterCheckboxDropdown
            id="condition"
            label="Estado do artigo"
            icon={<Boxes className="w-3.5 h-3.5" />}
            options={conditionOptions}
            selectedIds={selectedConditions}
            onChange={setSelectedConditions}
            allLabel="Todos"
            extraCheckbox={{
              id: 'chk-hide-zero-condition',
              label: 'Ocultar produtos com estoque 0',
              checked: hideZeroStock,
              onChange: setHideZeroStock,
            }}
          />

          {/* Botão dedicado Mostrar / Ocultar Estoque Zero */}
          <button
            type="button"
            id="btn-toggle-show-zero-stock"
            onClick={() => setHideZeroStock((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors font-medium border shadow-2xs cursor-pointer ${
              !hideZeroStock
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={
              !hideZeroStock
                ? 'Produtos com estoque zero estão visíveis (Clique para ocultar)'
                : 'Produtos com estoque zero estão ocultos (Clique para mostrar)'
            }
          >
            {!hideZeroStock ? (
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            )}
            <span>{!hideZeroStock ? 'Estoque zero: Visível' : 'Estoque zero: Oculto'}</span>
          </button>

          {/* Limpar Filtros se algum filtro estiver ativo */}
          {isAnyFilterActive && (
            <button
              type="button"
              id="btn-clear-all-stock-filters"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors font-medium shadow-2xs cursor-pointer"
              title="Redefinir todos os filtros para o padrão"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Drafts & Add Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {productDrafts.length > 0 && (
            <button
              type="button"
              id="btn-stock-open-drafts"
              onClick={onOpenDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              title="Ver produtos não concluídos guardados como rascunho"
            >
              <FileEdit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Não Concluídos ({productDrafts.length})</span>
            </button>
          )}

          <button
            type="button"
            id="btn-stock-add-product"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produto & SKU</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Localização / Armazém</th>
                <th className="py-3 px-4 text-right">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Limites (Mín / Máx)</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockInfo = getFilterStockInfo(product.id);
                  const prodCompanies = getProductCompanies(product.id);
                  const prodWarehouses = getProductWarehouses(product.id);

                  // Resolving product company via relationship Estoque (Produto × Armazém) → Armazém → Empresa
                  let productCompany = null;
                  if (selectedWarehouseIds.length === 1) {
                    const wh = warehouses.find((w) => w.id === selectedWarehouseIds[0]);
                    if (wh) productCompany = companies.find((c) => c.id === wh.companyId);
                  } else if (selectedCompanyIds.length === 1) {
                    productCompany = companies.find((c) => c.id === selectedCompanyIds[0]);
                  } else {
                    // Match with selected companies first
                    const matchedComp = prodCompanies.find((c) => selectedCompanyIds.includes(c.id));
                    if (matchedComp) {
                      productCompany = matchedComp;
                    } else if (prodCompanies.length > 0) {
                      productCompany = prodCompanies[0];
                    } else if (companies.length > 0) {
                      productCompany = companies[0];
                    }
                  }

                  const isCompanyStopped = productCompany?.status === 'parada';

                  return (
                    <tr
                      key={product.id}
                      onClick={() => onSelectProduct(product.id)}
                      className={`cursor-pointer transition-colors group ${
                        isCompanyStopped
                          ? 'bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Produto & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white block leading-tight">
                              {product.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              <span>SKU: {product.sku}</span>
                              {product.brand && (
                                <>
                                  <span>•</span>
                                  <span>{product.brand}</span>
                                </>
                              )}
                              {product.variations.length > 0 && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 rounded">
                                  {product.variations.length} var.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria & Estado */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {product.category}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {product.condition === 'novo'
                              ? 'Novo'
                              : product.condition === 'novo_usado'
                              ? 'Novo e usado'
                              : product.condition === 'usado'
                              ? 'Usado'
                              : product.condition === 'troca'
                              ? 'Troca'
                              : 'Novo'}
                          </span>
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {productCompany ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                {productCompany.name}
                              </span>
                            </div>
                            {isCompanyStopped && (
                              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Empresa Parada
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Armazém */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {selectedWarehouseIds.length === 1 ? (
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{warehouses.find((w) => w.id === selectedWarehouseIds[0])?.name}</span>
                        ) : prodWarehouses.length === 1 ? (
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {prodWarehouses[0].name}
                          </span>
                        ) : prodWarehouses.length > 1 ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {prodWarehouses.length} armazéns vinculados
                          </span>
                        ) : selectedWarehouseIds.length < warehouses.length ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {selectedWarehouseIds.length} armazéns selecionados
                          </span>
                        ) : selectedCompanyIds.length === 1 ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {visibleWarehouses.length === 1
                              ? visibleWarehouses[0].name
                              : `${visibleWarehouses.length} armazéns da empresa`}
                          </span>
                        ) : selectedCompanyIds.length < companies.length ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {visibleWarehouses.length} armazéns filtrados
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            Distribuído em {warehouses.length} armazéns
                          </span>
                        )}
                      </td>

                      {/* Quantidade Atual (Calculada, nunca editada diretamente) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-baseline justify-end gap-1 font-mono">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {stockInfo.currentStock}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {product.unitOfMeasure}
                          </span>
                        </div>
                      </td>

                      {/* Limites (Mín / Máx) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {stockInfo.minLimit > 0 || stockInfo.maxLimit > 0 ? (
                          <span>
                            {stockInfo.minLimit} / {stockInfo.maxLimit || '∞'}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Indicador Visual Claro */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {stockInfo.status === 'zerado' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Sem estoque
                          </span>
                        )}
                        {stockInfo.status === 'critico_baixo' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Abaixo do limite mínimo
                          </span>
                        )}
                        {stockInfo.status === 'excesso' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                            Excesso de estoque
                          </span>
                        )}
                        {stockInfo.status === 'normal' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatKwanza(product.salePrice)}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            id={`btn-edit-product-${product.id}`}
                            onClick={() => {
                              if (!isCompanyStopped) onEditProduct?.(product);
                            }}
                            disabled={isCompanyStopped}
                            className={`p-1.5 rounded-lg transition-colors shadow-2xs ${
                              isCompanyStopped
                                ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50'
                                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer'
                            }`}
                            title={isCompanyStopped ? 'Empresa parada — serviços indisponíveis' : 'Editar produto'}
                            aria-label="Editar produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            id={`btn-delete-product-${product.id}`}
                            onClick={() => {
                              if (!isCompanyStopped) setProductToDelete(product);
                            }}
                            disabled={isCompanyStopped}
                            className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-transparent ${
                              isCompanyStopped
                                ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/50 cursor-pointer'
                            }`}
                            title={isCompanyStopped ? 'Empresa parada — serviços indisponíveis' : 'Eliminar produto'}
                            aria-label="Eliminar produto"
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

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>Mostrando {filteredProducts.length} de {products.length} produtos registados</span>
          <span>MyOffice • Gestão em Tempo Real</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs p-4"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Eliminar produto</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tem certeza de que deseja eliminar o produto{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{productToDelete.name}</strong> (SKU: {productToDelete.sku})? Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-delete-product-modal"
                onClick={() => setProductToDelete(null)}
                aria-label="Fechar"
                title="Fechar"
                className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg transition-colors -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                id="btn-cancel-delete"
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
