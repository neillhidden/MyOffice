import React, { useState } from 'react';
import { StockProvider } from './context/StockContext';
import {
  Sidebar,
  MainModule,
  EstoqueSubmodule,
} from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OutOfServiceView } from './components/layout/OutOfServiceView';
import { WarehouseStockView } from './components/stock/WarehouseStockView';
import { MovementsView } from './components/movements/MovementsView';
import { ProductAnalyticsView } from './components/analytics/ProductAnalyticsView';
import { PurchaseListView } from './components/purchases/PurchaseListView';
import { DefectiveView } from './components/defective/DefectiveView';
import { ProductCreateModal } from './components/products/ProductCreateModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { MovementCreateModal } from './components/movements/MovementCreateModal';

function AppContent() {
  // Navigation state
  const [activeModule, setActiveModule] = useState<MainModule>('Estoque');
  const [activeSubmodule, setActiveSubmodule] = useState<EstoqueSubmodule>('Armazém');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Search state passed to views
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);

  const handleOpenMovementModal = (productId?: string) => {
    setMovementProductId(productId || null);
    setIsMovementModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        activeSubmodule={activeSubmodule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setSearchQuery('');
        }}
        onSelectSubmodule={(sub) => {
          setActiveModule('Estoque');
          setActiveSubmodule(sub);
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
          currentSubmodule={activeModule === 'Estoque' ? activeSubmodule : ''}
          onOpenAddProduct={() => setIsAddProductOpen(true)}
          onSelectProduct={(id) => setSelectedProductId(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeModule !== 'Estoque' ? (
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
                    onOpenAddProduct={() => setIsAddProductOpen(true)}
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
      </div>

      {/* Global Modals */}
      <ProductCreateModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onViewProduct={(id) => setSelectedProductId(id)}
      />

      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenMovementModalForProduct={(id) => handleOpenMovementModal(id)}
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
    <StockProvider>
      <AppContent />
    </StockProvider>
  );
}
