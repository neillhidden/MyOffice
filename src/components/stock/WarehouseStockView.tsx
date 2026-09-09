import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Package,
  Building,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Boxes,
  Plus,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatKwanza } from '../../utils/formatters';

interface WarehouseStockViewProps {
  onOpenAddProduct: () => void;
  onSelectProduct: (productId: string) => void;
  searchQuery: string;
}

export const WarehouseStockView: React.FC<WarehouseStockViewProps> = ({
  onOpenAddProduct,
  onSelectProduct,
  searchQuery,
}) => {
  const {
    products,
    warehouses,
    categories,
    getProductStockInfo,
    getCurrentStock,
  } = useStock();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'baixo' | 'normal' | 'excesso' | 'zerado'>('all');

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesBarcode = product.barcode?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand && !matchesBarcode) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'all' && product.status !== selectedStatus) {
        return false;
      }

      // 4. Stock Level Filter
      const stockInfo = getProductStockInfo(
        product.id,
        selectedWarehouseId !== 'all' ? selectedWarehouseId : undefined
      );

      if (stockLevelFilter === 'baixo' && stockInfo.status !== 'critico_baixo') return false;
      if (stockLevelFilter === 'normal' && stockInfo.status !== 'normal') return false;
      if (stockLevelFilter === 'excesso' && stockInfo.status !== 'excesso') return false;
      if (stockLevelFilter === 'zerado' && stockInfo.status !== 'zerado') return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedWarehouseId,
    stockLevelFilter,
    getProductStockInfo,
  ]);

  // Global counts for metrics
  const metrics = useMemo(() => {
    let totalItemsStock = 0;
    let criticalCount = 0;
    let excessCount = 0;
    let zeroCount = 0;
    let totalStockValueKz = 0;

    products.forEach((p) => {
      const whId = selectedWarehouseId !== 'all' ? selectedWarehouseId : undefined;
      const info = getProductStockInfo(p.id, whId);
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
  }, [products, selectedWarehouseId, getProductStockInfo]);

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total de Unidades em Estoque
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {metrics.totalItemsStock}
            </span>
            <span className="text-xs text-slate-400">itens</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {selectedWarehouse ? selectedWarehouse.name : 'Todos os armazéns e lojas'}
          </p>
        </div>

        <div
          onClick={() => setStockLevelFilter(stockLevelFilter === 'baixo' ? 'all' : 'baixo')}
          className={`p-4 border rounded-xl shadow-xs cursor-pointer transition-colors ${
            stockLevelFilter === 'baixo'
              ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
              Estoque Crítico (Abaixo Mín.)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {metrics.criticalCount}
            </span>
            <span className="text-xs text-rose-500">produtos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stockLevelFilter === 'baixo' ? 'Filtro ativo • Clique para limpar' : 'Requer reposição urgente'}
          </p>
        </div>

        <div
          onClick={() => setStockLevelFilter(stockLevelFilter === 'excesso' ? 'all' : 'excesso')}
          className={`p-4 border rounded-xl shadow-xs cursor-pointer transition-colors ${
            stockLevelFilter === 'excesso'
              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
              Excesso de Estoque
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {metrics.excessCount}
            </span>
            <span className="text-xs text-amber-600">produtos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stockLevelFilter === 'excesso' ? 'Filtro ativo • Clique para limpar' : 'Acima da capacidade máxima'}
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Valor em Estoque (Custo)
          </span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1 truncate">
            {formatKwanza(metrics.totalStockValueKz)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Capital imobilizado apurado
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Armazém Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">Local:</span>
            <select
              id="filter-warehouse-select"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Armazéns & Lojas</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.type === 'loja_fisica' ? 'Loja' : 'Armazém'})
                </option>
              ))}
            </select>
          </div>

          {/* Categoria Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">Categoria:</span>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="descontinuado">Descontinuado</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          type="button"
          id="btn-stock-add-product"
          onClick={onOpenAddProduct}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Adicionar</span>
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produto & SKU</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Localização / Armazém</th>
                <th className="py-3 px-4 text-right">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Limites (Mín / Máx)</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const whId = selectedWarehouseId !== 'all' ? selectedWarehouseId : undefined;
                  const stockInfo = getProductStockInfo(product.id, whId);

                  return (
                    <tr
                      key={product.id}
                      onClick={() => onSelectProduct(product.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Produto & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-slate-950 block leading-tight">
                              {product.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>SKU: {product.sku}</span>
                              {product.brand && (
                                <>
                                  <span>•</span>
                                  <span>{product.brand}</span>
                                </>
                              )}
                              {product.variations.length > 0 && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                  {product.variations.length} var.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                      </td>

                      {/* Armazém */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {selectedWarehouse ? (
                          <span>{selectedWarehouse.name}</span>
                        ) : (
                          <span className="text-slate-500">
                            Distribuído em {warehouses.length} armazéns
                          </span>
                        )}
                      </td>

                      {/* Quantidade Atual (Calculada, nunca editada diretamente) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-baseline justify-end gap-1 font-mono">
                          <span className="font-bold text-sm text-slate-900">
                            {stockInfo.currentStock}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {product.unitOfMeasure}
                          </span>
                        </div>
                      </td>

                      {/* Limites (Mín / Máx) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {stockInfo.minLimit > 0 || stockInfo.maxLimit > 0 ? (
                          <span>
                            {stockInfo.minLimit} / {stockInfo.maxLimit || '∞'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Indicador Visual Claro */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {stockInfo.status === 'zerado' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Sem estoque
                          </span>
                        )}
                        {stockInfo.status === 'critico_baixo' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Abaixo do Mínimo
                          </span>
                        )}
                        {stockInfo.status === 'excesso' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Acima do Máximo
                          </span>
                        )}
                        {stockInfo.status === 'normal' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        {formatKwanza(product.salePrice)}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1">
                          Ver Detalhes <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Mostrando {filteredProducts.length} de {products.length} produtos cadastrados</span>
          <span>MyOffice • Gestão em Tempo Real</span>
        </div>
      </div>
    </div>
  );
};
