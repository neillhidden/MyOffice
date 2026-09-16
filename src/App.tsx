import React, { useState } from 'react';
import { StockProvider } from './context/StockContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  Sidebar,
  MainModule,
  EstoqueSubmodule,
  CaixaSubmodule,
  ContactosSubmodule,
} from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OutOfServiceView } from './components/layout/OutOfServiceView';
import { WarehouseStockView } from './components/stock/WarehouseStockView';
import { MovementsView } from './components/movements/MovementsView';
import { ProductAnalyticsView } from './components/analytics/ProductAnalyticsView';
import { PurchaseListView } from './components/purchases/PurchaseListView';
import { DefectiveView } from './components/defective/DefectiveView';
import { BankView } from './components/banks/BankView';
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

function AppContent() {
  // Navigation state
  const [activeModule, setActiveModule] = useState<MainModule>('Estoque');
  const [activeSubmodule, setActiveSubmodule] = useState<EstoqueSubmodule>('Armazém');
  const [activeCaixaSubmodule, setActiveCaixaSubmodule] = useState<CaixaSubmodule>('Venda');
  const [activeContactosSubmodule, setActiveContactosSubmodule] = useState<ContactosSubmodule>('Funcionários');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Search state passed to views
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [draftToResume, setDraftToResume] = useState<ProductDraft | null>(null);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);

  const handleOpenNewProduct = () => {
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

  const handleOpenMovementModal = (productId?: string) => {
    setMovementProductId(productId || null);
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
    } else if (module === 'Banco') {
      setActiveModule('Banco');
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
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        activeSubmodule={activeSubmodule}
        activeCaixaSubmodule={activeCaixaSubmodule}
        activeContactosSubmodule={activeContactosSubmodule}
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          currentModule={activeModule}
          currentSubmodule={
            activeModule === 'Estoque'
              ? activeSubmodule
              : activeModule === 'Caixa'
              ? activeCaixaSubmodule
              : activeModule === 'Contactos'
              ? activeContactosSubmodule
              : ''
          }
          onOpenAddProduct={handleOpenNewProduct}
          onOpenDrafts={() => setIsDraftsModalOpen(true)}
          onSelectProduct={(id) => setSelectedProductId(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigateToModule={handleNavigateToModule}
        />

        {/* Dynamic Main Workspace */}
        {activeModule === 'Calendário' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <CalendarView onNavigateToModule={handleNavigateToModule} />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {activeModule === 'Definições' ? (
                <SettingsView />
              ) : activeModule === 'Banco' ? (
                <BankView />
              ) : activeModule === 'Dashboard' ? (
                <DashboardView />
              ) : activeModule === 'Caixa' ? (
                activeCaixaSubmodule === 'Venda' ? (
                  <VendaView onGoToTransport={() => setActiveCaixaSubmodule('Transporte')} />
                ) : (
                  <TransporteView />
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
                    searchQuery={searchQuery}
                  />
                )}

                {activeSubmodule === 'Movimentação' && (
                  <MovementsView
                    onOpenNewMovementModal={() => handleOpenMovementModal()}
                    onSelectProduct={(id) => setSelectedProductId(id)}
                  />
                )}

                {activeSubmodule === 'Análise de produtos' && (
                  <ProductAnalyticsView
                    onSelectProduct={(id) => setSelectedProductId(id)}
                    onGoToPurchaseList={() => setActiveSubmodule('Lista de compras')}
                  />
                )}

                {activeSubmodule === 'Lista de compras' && <PurchaseListView />}

                {activeSubmodule === 'Defeituoso' && <DefectiveView />}
              </>
            )}
          </div>
        </main>
      )}
      </div>

      {/* Global Modals */}
      <ProductCreateModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setProductToEdit(null);
          setDraftToResume(null);
        }}
        productToEdit={productToEdit}
        draftToResume={draftToResume}
        onViewProduct={(id) => setSelectedProductId(id)}
        onCreateMovement={(id) => handleOpenMovementModal(id)}
      />

      <DraftsListModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onResumeDraft={handleResumeDraft}
      />

      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenMovementModalForProduct={(id) => handleOpenMovementModal(id)}
        onEditProduct={handleEditProduct}
      />

      <MovementCreateModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementProductId(null);
        }}
        preSelectedProductId={movementProductId}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StockProvider>
        <AppContent />
      </StockProvider>
    </ThemeProvider>
  );
}
