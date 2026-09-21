import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useStock } from './StockContext';
import { Warehouse } from '../types/stock';

export interface WarehouseFilterContextType {
  selectedCompanyIds: string[];
  setSelectedCompanyIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedWarehouseIds: string[];
  setSelectedWarehouseIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedConditions: string[];
  setSelectedConditions: React.Dispatch<React.SetStateAction<string[]>>;
  hideZeroStock: boolean;
  setHideZeroStock: React.Dispatch<React.SetStateAction<boolean>>;
  stockLevelFilter: 'all' | 'baixo' | 'normal' | 'excesso' | 'zerado';
  setStockLevelFilter: React.Dispatch<
    React.SetStateAction<'all' | 'baixo' | 'normal' | 'excesso' | 'zerado'>
  >;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  visibleWarehouses: Warehouse[];
  handleCompanyChange: (newCompanyIds: string[]) => void;
  isAnyFilterActive: boolean;
  resetAllFilters: () => void;
}

const WarehouseFilterContext = createContext<WarehouseFilterContextType | undefined>(undefined);

export const WarehouseFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { companies, warehouses, categories } = useStock();

  // Empresas visíveis nos filtros: ativas e paradas (desativadas são totalmente excluídas)
  const nonDisabledCompanyIds = useMemo(() => {
    return companies.filter((c) => c.status !== 'desativada').map((c) => c.id);
  }, [companies]);

  // Empresas desativadas (completamente fora de serviço)
  const disabledCompanyIdsSet = useMemo(() => {
    return new Set(companies.filter((c) => c.status === 'desativada').map((c) => c.id));
  }, [companies]);

  // Armazéns visíveis nos filtros (exclui armazéns de empresas desativadas)
  const nonDisabledWarehouseIds = useMemo(() => {
    return warehouses
      .filter((w) => !disabledCompanyIdsSet.has(w.companyId))
      .map((w) => w.id);
  }, [warehouses, disabledCompanyIdsSet]);

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(() => {
    const nonDisabled = companies.filter((c) => c.status !== 'desativada').map((c) => c.id);
    return nonDisabled.length > 0 ? nonDisabled : companies.map((c) => c.id);
  });

  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>(() => {
    const nonDisabledComps = new Set(
      companies.filter((c) => c.status !== 'desativada').map((c) => c.id)
    );
    return warehouses
      .filter((w) => nonDisabledComps.has(w.companyId))
      .map((w) => w.id);
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => categories);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'ativo',
    'inativo',
    'descontinuado',
  ]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'novo',
    'novo_usado',
    'usado',
    'troca',
  ]);
  const [hideZeroStock, setHideZeroStock] = useState<boolean>(false);
  const [stockLevelFilter, setStockLevelFilter] = useState<
    'all' | 'baixo' | 'normal' | 'excesso' | 'zerado'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sincronizar empresas: remover desativadas de selectedCompanyIds
  useEffect(() => {
    if (companies.length > 0) {
      setSelectedCompanyIds((prev) => {
        const filtered = prev.filter((id) => nonDisabledCompanyIds.includes(id));
        return filtered.length > 0 ? filtered : nonDisabledCompanyIds;
      });
    }
  }, [companies, nonDisabledCompanyIds]);

  // Sincronizar categorias caso a lista de categorias seja alterada
  useEffect(() => {
    setSelectedCategories((prev) => {
      const valid = prev.filter((c) => categories.includes(c));
      return valid.length > 0 ? valid : categories;
    });
  }, [categories]);

  // Armazéns visíveis:
  // - Exclui TOTALMENTE armazéns de empresas desativadas
  // - Filtra pelas empresas selecionadas (ou todas as não-desativadas se nenhuma selecionada)
  const visibleWarehouses = useMemo(() => {
    const nonDisabledWarehouses = warehouses.filter((w) => !disabledCompanyIdsSet.has(w.companyId));
    if (selectedCompanyIds.length === 0) {
      return nonDisabledWarehouses.filter((w) => nonDisabledCompanyIds.includes(w.companyId));
    }
    return nonDisabledWarehouses.filter((w) => selectedCompanyIds.includes(w.companyId));
  }, [warehouses, selectedCompanyIds, disabledCompanyIdsSet, nonDisabledCompanyIds]);

  // Atualização coordenada de empresa e armazém
  const handleCompanyChange = (newCompanyIds: string[]) => {
    // Garante que empresas desativadas nunca sejam selecionadas
    const validCompanyIds = newCompanyIds.filter((id) => nonDisabledCompanyIds.includes(id));
    setSelectedCompanyIds(validCompanyIds);

    if (validCompanyIds.length === 0 || validCompanyIds.length === nonDisabledCompanyIds.length) {
      const availableWhs = warehouses.filter((w) => nonDisabledCompanyIds.includes(w.companyId));
      setSelectedWarehouseIds(availableWhs.map((w) => w.id));
    } else {
      const matchingWarehouses = warehouses.filter((w) => validCompanyIds.includes(w.companyId));
      setSelectedWarehouseIds(matchingWarehouses.map((w) => w.id));
    }
  };

  // Manter armazéns selecionados alinhados aos visíveis
  useEffect(() => {
    const visibleIds = new Set(visibleWarehouses.map((w) => w.id));
    setSelectedWarehouseIds((prev) => {
      const valid = prev.filter((id) => visibleIds.has(id));
      return valid.length > 0 ? valid : visibleWarehouses.map((w) => w.id);
    });
  }, [visibleWarehouses]);

  // Verificar se algum filtro está ativo (diferente do padrão de "Todas as empresas")
  const isAnyFilterActive = useMemo(() => {
    return (
      selectedCompanyIds.length < nonDisabledCompanyIds.length ||
      selectedWarehouseIds.length < nonDisabledWarehouseIds.length ||
      selectedCategories.length < categories.length ||
      selectedStatuses.length < 3 ||
      selectedConditions.length < 4 ||
      stockLevelFilter !== 'all' ||
      hideZeroStock ||
      searchQuery.trim().length > 0
    );
  }, [
    selectedCompanyIds.length,
    nonDisabledCompanyIds.length,
    selectedWarehouseIds.length,
    nonDisabledWarehouseIds.length,
    selectedCategories.length,
    categories.length,
    selectedStatuses.length,
    selectedConditions.length,
    stockLevelFilter,
    hideZeroStock,
    searchQuery,
  ]);

  // Redefinir todos os filtros da tela de Armazém
  const resetAllFilters = () => {
    setSelectedCompanyIds(nonDisabledCompanyIds);
    setSelectedWarehouseIds(
      warehouses.filter((w) => nonDisabledCompanyIds.includes(w.companyId)).map((w) => w.id)
    );
    setSelectedCategories(categories);
    setSelectedStatuses(['ativo', 'inativo', 'descontinuado']);
    setSelectedConditions(['novo', 'novo_usado', 'usado', 'troca']);
    setHideZeroStock(false);
    setStockLevelFilter('all');
    setSearchQuery('');
  };

  const value: WarehouseFilterContextType = {
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
    searchQuery,
    setSearchQuery,
    visibleWarehouses,
    handleCompanyChange,
    isAnyFilterActive,
    resetAllFilters,
  };

  return (
    <WarehouseFilterContext.Provider value={value}>
      {children}
    </WarehouseFilterContext.Provider>
  );
};

export const useWarehouseFilters = (): WarehouseFilterContextType => {
  const context = useContext(WarehouseFilterContext);
  if (!context) {
    throw new Error('useWarehouseFilters must be used within a WarehouseFilterProvider');
  }
  return context;
};
