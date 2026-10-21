import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { ComingSoonView } from './components/common/ComingSoonView';
import { Bot, Sparkles, LayoutDashboard } from 'lucide-react';
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
import {
  NavigationState,
  DEFAULT_NAVIGATION_STATE,
  stateToHash,
  hashToState,
} from './utils/navigationRouter';

function AppContent() {
  const getInitialNavState = (): NavigationState => {
    let savedMode: OfficeMode = 'business';
    try {
      if (localStorage.getItem('myoffice-mode') === 'home') savedMode = 'home';
    } catch {
      // ignore
    }
    const fallbackState: NavigationState = {
      ...DEFAULT_NAVIGATION_STATE,
      mode: savedMode,
    };
    if (typeof window !== 'undefined' && window.location.hash) {
      return hashToState(window.location.hash, fallbackState);
    }
    return fallbackState;
  };

  const [navState, setNavState] = useState<NavigationState>(getInitialNavState);

  const mode = navState.mode;
  const homeSection = navState.homeSection;
  const activeModule = navState.module;
  const activeSubmodule = navState.estoqueSub;
  const activeCaixaSubmodule = navState.caixaSub;
  const activeContactosSubmodule = navState.contactosSub;
  const activeFinanceiroSubmodule = navState.financeiroSub;

  const navigateTo = (patch: Partial<NavigationState>) => {
    setNavState((prev) => {
      const next: NavigationState = { ...prev, ...patch };
      if (patch.mode && patch.mode !== prev.mode) {
        try { localStorage.setItem('myoffice-mode', patch.mode); } catch { /* Mode still works for this visit. */ }
        setIsAddProductOpen(false);
        setSelectedProductId(null);
        setIsDraftsModalOpen(false);
        setIsMovementModalOpen(false);
      }
      const targetHash = stateToHash(next);
      if (typeof window !== 'undefined' && window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
      return next;
    });
  };

  // Sync canonical hash on initial load if none provided
  useEffect(() => {
    const initialTargetHash = stateToHash(navState);
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.history.replaceState(null, '', initialTargetHash);
    }
  }, []);

  // Listen to browser Back/Forward (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      const currentHash = window.location.hash;
      setNavState((prev) => {
        const next = hashToState(currentHash, prev);
        if (next.mode !== prev.mode) {
          try { localStorage.setItem('myoffice-mode', next.mode); } catch { /* ignore */ }
        }
        return next;
      });
      setIsAddProductOpen(false);
      setSelectedProductId(null);
      setIsDraftsModalOpen(false);
      setIsMovementModalOpen(false);
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const changeMode = (next: OfficeMode) => {
    navigateTo({ mode: next });
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  const navigationKey = mode === 'home' ? `home:${homeSection}` : `business:${activeModule}:${activeSubmodule}:${activeCaixaSubmodule}:${activeContactosSubmodule}:${activeFinanceiroSubmodule}`;
  useLayoutEffect(() => {
    document.querySelector<HTMLElement>('#app-root-shell main')?.scrollTo({ top: 0, left: 0 });
    setIsMobileMenuOpen(false);
  }, [navigationKey]);

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
      navigateTo({
        mode: 'business',
        module: 'Estoque',
        ...(submodule ? { estoqueSub: submodule as EstoqueSubmodule } : {}),
      });
    } else if (module === 'Caixa') {
      navigateTo({
        mode: 'business',
        module: 'Caixa',
        ...(submodule ? { caixaSub: submodule as CaixaSubmodule } : {}),
      });
    } else if (module === 'Calendário') {
      navigateTo({ mode: 'business', module: 'Calendário' });
    } else if (module === 'Dashboard') {
      navigateTo({ mode: 'business', module: 'Dashboard' });
    } else if (module === 'Financeiro' || module === 'Banco') {
      navigateTo({
        mode: 'business',
        module: 'Financeiro',
        ...(submodule ? { financeiroSub: submodule as FinanceiroSubmodule } : {}),
      });
    } else if (module === 'Definições') {
      navigateTo({ mode: 'business', module: 'Definições' });
    } else if (module === 'Contactos' || module === 'Empregado') {
      navigateTo({
        mode: 'business',
        module: 'Contactos',
        ...(submodule ? { contactosSub: submodule as ContactosSubmodule } : {}),
      });
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
        onSelectHomeSection={(sec) => navigateTo({ mode: 'home', homeSection: sec })}
        activeModule={activeModule}
        activeSubmodule={activeSubmodule}
        activeCaixaSubmodule={activeCaixaSubmodule}
        activeContactosSubmodule={activeContactosSubmodule}
        activeFinanceiroSubmodule={activeFinanceiroSubmodule}
        onSelectModule={(mod) => {
          navigateTo({ mode: 'business', module: mod });
          setSearchQuery('');
        }}
        onSelectSubmodule={(sub) => {
          navigateTo({ mode: 'business', module: 'Estoque', estoqueSub: sub });
          setSearchQuery('');
        }}
        onSelectCaixaSubmodule={(sub) => {
          navigateTo({ mode: 'business', module: 'Caixa', caixaSub: sub });
          setSearchQuery('');
        }}
        onSelectContactosSubmodule={(sub) => {
          navigateTo({ mode: 'business', module: 'Contactos', contactosSub: sub });
          setSearchQuery('');
        }}
        onSelectFinanceiroSubmodule={(sub) => {
          navigateTo({ mode: 'business', module: 'Financeiro', financeiroSub: sub });
          setSearchQuery('');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        {mode === 'home' ? (
          <HomeHeader
            section={homeSection}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        ) : (
          <Header
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
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}

        {/* Dynamic Main Workspace */}
        {mode === 'home' ? (
          <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-20">
            <div className="w-full max-w-7xl mx-auto">
              <HomeView
                section={homeSection}
                onNavigate={(sec) => navigateTo({ mode: 'home', homeSection: sec })}
              />
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
                    navigateTo({ mode: 'business', module: 'Financeiro', financeiroSub: sub });
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
                      navigateTo({ mode: 'business', module: 'Caixa', caixaSub: 'Transporte' });
                      setSearchQuery(saleId || '');
                    }}
                    onGoToStockMovement={(saleId) => {
                      navigateTo({ mode: 'business', module: 'Estoque', estoqueSub: 'Movimentação' });
                      setSearchQuery(saleId);
                    }}
                    onGoToFinancialEntry={(saleId) => {
                      navigateTo({ mode: 'business', module: 'Financeiro', financeiroSub: 'Lançamentos' });
                      setSearchQuery(saleId);
                    }}
                    onGoToDebt={(debtIdOrSaleId) => {
                      navigateTo({ mode: 'business', module: 'Financeiro', financeiroSub: 'Dívidas' });
                      setSearchQuery(debtIdOrSaleId);
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
                  <AfiliadosView
                    onBack={() => {
                      navigateTo({ mode: 'business', module: 'Contactos', contactosSub: 'Funcionários' });
                    }}
                  />
                )
              ) : activeModule === 'Agentes' ? (
                <ComingSoonView
                  id="agentes-view"
                  moduleName="Agentes"
                  badge="Em breve"
                  title="Agentes Inteligentes & Automações"
                  description="Assistentes virtuais e automações operacionais no MyOffice para suporte na gestão, alertas preditivos de stock e análise de desempenho comercial."
                  icon={Bot}
                  onBack={() => navigateTo({ mode: 'business', module: 'Dashboard' })}
                  backLabel="Voltar para o Dashboard"
                  highlights={[
                    {
                      title: 'Alertas Proativos',
                      description: 'Notificações preditivas sobre produtos abaixo do stock mínimo e entregas pendentes.',
                      icon: Sparkles,
                    },
                    {
                      title: 'Apoio à Decisão',
                      description: 'Sugestões automatizadas de reposição de armazém e rentabilidade comercial.',
                      icon: Bot,
                    },
                    {
                      title: 'Visão Integrada',
                      description: 'Sínteses comparativas de vendas e balanço operacional em tempo real.',
                      icon: LayoutDashboard,
                    },
                  ]}
                />
              ) : activeModule !== 'Estoque' ? (
                <OutOfServiceView
                  moduleName={activeModule}
                  onGoToEstoque={() => {
                    navigateTo({ mode: 'business', module: 'Estoque', estoqueSub: 'Armazém' });
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
