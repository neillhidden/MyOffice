import React, { useState } from 'react';
import { StockProvider } from './context/StockContext';
import { ThemeProvider } from './context/ThemeContext';
import { WarehouseFilterProvider, useWarehouseFilters } from './context/WarehouseFilterContext';
import {
  Sidebar,
  MainModule,
  EstoqueSubmodule,
  CaixaSubmodule,
  ContactosSubmodule,
  FinanceiroSubmodule,
} from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OutOfServiceView } from './components/layout/OutOfServiceView';
import { WarehouseStockView } from './components/stock/WarehouseStockView';
import { MovementsView } from './components/movements/MovementsView';
import { ImportSimulatorView } from './components/analytics/ImportSimulatorView';
import { PurchaseListView } from './components/purchases/PurchaseListView';
import { DefectiveView } from './components/defective/DefectiveView';
import { BankView } from './components/banks/BankView';
import { FinanceiroView } from './components/financeiro/FinanceiroView';
import { VendaView } from './components/caixa/VendaView';
import { TransporteView } from './components/caixa/TransporteView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductCreateModal } from './components/products/ProductCreateModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { MovementCreateModal } from './components/movements/MovementCreateModal';
import { DraftsListModal } from './components/products/DraftsListModal';
import { SettingsView } from './components/settings/SettingsView';
import { CalendarView } from './components/calendar/CalendarView';
import {
  FuncionariosView,
  ClientesView,
  FornecedoresView,
  AfiliadosView,
} from './components/contacts';
import { Product, ProductDraft } from './types/stock';

import { HomeProvider } from './context/HomeContext';
import { HomeView } from './components/home/HomeView';
import { HomeHeader } from './components/home/HomeHeader';
import { OfficeMode, HomeSection } from './types/home';

function AppContent() {
  const [mode, setMode] = useState<OfficeMode>(() => {
    try { return localStorage.getItem('myoffice-mode') === 'home' ? 'home' : 'business'; }
    catch { return 'business'; }
  });
  const [homeSection, setHomeSection] = useState<HomeSection>('Dashboard');
  const changeMode = (next: OfficeMode) => {
    setMode(next);
    try { localStorage.setItem('myoffice-mode', next); } catch { /* Mode still works for this visit. */ }
    setIsAddProductOpen(false);
    setSelectedProductId(null);
    setIsDraftsModalOpen(false);
    setIsMovementModalOpen(false);
  };
  // Navigation state
  const [activeModule, setActiveModule] = useState<MainModule>('Estoque');
  const [activeSubmodule, setActiveSubmodule] = useState<EstoqueSubmodule>('Armazém');
  const [activeCaixaSubmodule, setActiveCaixaSubmodule] = useState<CaixaSubmodule>('Venda');
  const [activeContactosSubmodule, setActiveContactosSubmodule] = useState<ContactosSubmodule>('Funcionários');
  const [activeFinanceiroSubmodule, setActiveFinanceiroSubmodule] = useState<FinanceiroSubmodule>('Contas');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(()=>window.matchMedia('(max-width: 767px)').matches);

  // Search state passed to views (for non-Armazém modules)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persisted warehouse filter state
  const { searchQuery: warehouseSearchQuery, setSearchQuery: setWarehouseSearchQuery } =
    useWarehouseFilters();

  const isArmazem = activeModule === 'Estoque' && activeSubmodule === 'Armazém';
  const currentSearchQuery = isArmazem ? warehouseSearchQuery : searchQuery;
  const handleSearchChange = (q: string) => {
    if (isArmazem) {
      setWarehouseSearchQuery(q);
    } else {
      setSearchQuery(q);
    }
  };

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [newProductCategory, setNewProductCategory] = useState<string | undefined>();
  const [newProductSubcategory, setNewProductSubcategory] = useState<string | undefined>();
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [draftToResume, setDraftToResume] = useState<ProductDraft | null>(null);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);
  const [movementWarehouseId, setMovementWarehouseId] = useState<string | null>(null);
  const [movementVariationId, setMovementVariationId] = useState<string | null>(null);

  const handleOpenNewProduct = (category?: string, subcategory?: string) => {
    setNewProductCategory(category);
    setNewProductSubcategory(subcategory);
    setProductToEdit(null);
    setDraftToResume(null);
    setIsAddProductOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setDraftToResume(null);
    setIsAddProductOpen(true);
  };

  const handleResumeDraft = (draft: ProductDraft) => {
    setDraftToResume(draft);
    setProductToEdit(null);
    setIsDraftsModalOpen(false);
    setIsAddProductOpen(true);
  };

  const handleOpenMovementModal = (
    productId?: string,
    warehouseId?: string,
    variationId?: string
  ) => {
    setMovementProductId(productId || null);
    setMovementWarehouseId(warehouseId || null);
    setMovementVariationId(variationId || null);
    setIsMovementModalOpen(true);
  };

  const handleNavigateToModule = (module: string, submodule?: string) => {
    if (module === 'Estoque') {
      setActiveModule('Estoque');
      if (submodule) {
        setActiveSubmodule(submodule as EstoqueSubmodule);
      }
    } else if (module === 'Caixa') {
      setActiveModule('Caixa');
      if (submodule) {
        setActiveCaixaSubmodule(submodule as CaixaSubmodule);
      }
    } else if (module === 'Calendário') {
      setActiveModule('Calendário');
    } else if (module === 'Dashboard') {
      setActiveModule('Dashboard');
    } else if (module === 'Financeiro' || module === 'Banco') {
      setActiveModule('Financeiro');
      if (submodule) {
        setActiveFinanceiroSubmodule(submodule as FinanceiroSubmodule);
      }
    } else if (module === 'Definições') {
      setActiveModule('Definições');
    } else if (module === 'Contactos' || module === 'Empregado') {
      setActiveModule('Contactos');
      if (submodule) {
        setActiveContactosSubmodule(submodule as ContactosSubmodule);
      }
    }
    setSearchQuery('');
  };

  return (
    <div
      id="app-root-shell"
      className="flex h-screen bg-[#f8fafc] dark:bg-dm-page text-slate-900 dark:text-dm-text font-sans antialiased overflow-hidden transition-colors duration-200"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        mode={mode}
        onModeChange={changeMode}
        homeSection={homeSection}
        onSelectHomeSection={setHomeSection}
        activeModule={activeModule}
        activeSubmodule={activeSubmodule}
        activeCaixaSubmodule={activeCaixaSubmodule}
        activeContactosSubmodule={activeContactosSubmodule}
        activeFinanceiroSubmodule={activeFinanceiroSubmodule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setSearchQuery('');
        }}
        onSelectSubmodule={(sub) => {
          setActiveModule('Estoque');
          setActiveSubmodule(sub);
          setSearchQuery('');
        }}
        onSelectCaixaSubmodule={(sub) => {
          setActiveModule('Caixa');
          setActiveCaixaSubmodule(sub);
          setSearchQuery('');
        }}
        onSelectContactosSubmodule={(sub) => {
          setActiveModule('Contactos');
          setActiveContactosSubmodule(sub);
          setSearchQuery('');
        }}
        onSelectFinanceiroSubmodule={(sub) => {
          setActiveModule('Financeiro');
          setActiveFinanceiroSubmodule(sub);
          setSearchQuery('');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        {mode === 'home' ? <HomeHeader section={homeSection}/> : <Header
          currentModule={activeModule}
          currentSubmodule={
            activeModule === 'Estoque'
              ? activeSubmodule
              : activeModule === 'Caixa'
              ? activeCaixaSubmodule
              : activeModule === 'Contactos'
              ? activeContactosSubmodule
              : activeModule === 'Financeiro' || activeModule === 'Banco'
              ? activeFinanceiroSubmodule
              : ''
          }
          onOpenAddProduct={handleOpenNewProduct}
          onOpenDrafts={() => setIsDraftsModalOpen(true)}
          onSelectProduct={(id) => setSelectedProductId(id)}
          searchQuery={currentSearchQuery}
          onSearchChange={handleSearchChange}
          onNavigateToModule={handleNavigateToModule}
        />}

        {/* Dynamic Main Workspace */}
        {mode === 'home' ? (
          <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-20">
            <div className="w-full max-w-7xl mx-auto">
              <HomeView section={homeSection} onNavigate={setHomeSection} />
            </div>
          </main>
        ) : activeModule === 'Calendário' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <CalendarView onNavigateToModule={handleNavigateToModule} />
          </div>
        ) : (
          <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="w-full max-w-7xl mx-auto">
              {activeModule === 'Definições' ? (
                <SettingsView onCreateProduct={handleOpenNewProduct} onViewProduct={setSelectedProductId} />
              ) : activeModule === 'Financeiro' || activeModule === 'Banco' ? (
                <FinanceiroView
                  activeSubmodule={activeFinanceiroSubmodule}
                  onSelectSubmodule={(sub) => {
                    setActiveFinanceiroSubmodule(sub);
                    setSearchQuery('');
                  }}
                  externalSearchQuery={searchQuery}
                  onExternalSearchChange={setSearchQuery}
                />
              ) : activeModule === 'Dashboard' ? (
                <DashboardView />
              ) : activeModule === 'Caixa' ? (
                activeCaixaSubmodule === 'Venda' ? (
                  <VendaView
                    onGoToTransport={(saleId) => {
                      setActiveModule('Caixa');
                      setActiveCaixaSubmodule('Transporte');
                      setSearchQuery(saleId || '');
                    }}
                    onGoToStockMovement={(saleId) => {
                      setActiveModule('Estoque');
                      setActiveSubmodule('Movimentação');
                      setSearchQuery(saleId);
                    }}
                    onGoToFinancialEntry={(saleId) => {
                      setActiveModule('Financeiro');
                      setActiveFinanceiroSubmodule('Lançamentos');
                      setSearchQuery(saleId);
                    }}
                  />
                ) : (
                  <TransporteView
                    externalSearchQuery={searchQuery}
                    onExternalSearchChange={setSearchQuery}
                  />
                )
              ) : activeModule === 'Contactos' ? (
                activeContactosSubmodule === 'Funcionários' ? (
                  <FuncionariosView />
                ) : activeContactosSubmodule === 'Clientes' ? (
                  <ClientesView />
                ) : activeContactosSubmodule === 'Fornecedores' ? (
                  <FornecedoresView />
                ) : (
                  <AfiliadosView />
                )
              ) : activeModule !== 'Estoque' ? (
                <OutOfServiceView
                  moduleName={activeModule}
                  onGoToEstoque={() => {
                    setActiveModule('Estoque');
                    setActiveSubmodule('Armazém');
                  }}
                />
              ) : (
              <>
                {activeSubmodule === 'Armazém' && (
                  <WarehouseStockView
                    onOpenAddProduct={handleOpenNewProduct}
                    onEditProduct={handleEditProduct}
                    onOpenDrafts={() => setIsDraftsModalOpen(true)}
                    onSelectProduct={(id) => setSelectedProductId(id)}
                    searchQuery={warehouseSearchQuery}
                  />
                )}

                {activeSubmodule === 'Movimentação' && (
                  <MovementsView
                    onOpenNewMovementModal={() => handleOpenMovementModal()}
                    onSelectProduct={(id) => setSelectedProductId(id)}
                    externalSearchQuery={searchQuery}
                    onExternalSearchChange={setSearchQuery}
                  />
                )}

                {(activeSubmodule === 'Simulador de Importação e Rentabilidade' ||
                  activeSubmodule === 'Análise de produtos') && <ImportSimulatorView />}

                {activeSubmodule === 'Lista de compras' && <PurchaseListView />}

                {activeSubmodule === 'Defeituoso' && <DefectiveView />}
              </>
            )}
          </div>
        </main>
      )}
      </div>

      {/* Global Modals */}
      {mode === 'business' && <>
      <ProductCreateModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setProductToEdit(null);
          setDraftToResume(null);
        }}
        initialCategory={newProductCategory}
        initialSubcategory={newProductSubcategory}
        productToEdit={productToEdit}
        draftToResume={draftToResume}
        onViewProduct={(id) => setSelectedProductId(id)}
        onCreateMovement={(id, warehouseId) => handleOpenMovementModal(id, warehouseId)}
      />

      <DraftsListModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onResumeDraft={handleResumeDraft}
      />

      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenMovementModalForProduct={(id, warehouseId, variationId) =>
          handleOpenMovementModal(id, warehouseId, variationId)
        }
        onEditProduct={handleEditProduct}
      />

      <MovementCreateModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementProductId(null);
          setMovementWarehouseId(null);
          setMovementVariationId(null);
        }}
        preSelectedProductId={movementProductId}
        preSelectedWarehouseId={movementWarehouseId}
        preSelectedVariationId={movementVariationId}
      />
      </>}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StockProvider>
        <WarehouseFilterProvider>
          <HomeProvider><AppContent /></HomeProvider>
        </WarehouseFilterProvider>
      </StockProvider>
    </ThemeProvider>
  );
}
