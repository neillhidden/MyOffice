import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  X,
  AlertTriangle,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

interface HeaderProps {
  currentModule: string;
  currentSubmodule: string;
  onOpenAddProduct: () => void;
  onSelectProduct?: (productId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  currentSubmodule,
  onOpenAddProduct,
  onSelectProduct,
  searchQuery,
  onSearchChange,
}) => {
  const { products, getProductStockInfo } = useStock();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Products below minimum limit
  const lowStockProducts = products.filter((p) => {
    const info = getProductStockInfo(p.id);
    return info.status === 'critico_baixo' || info.status === 'zerado';
  });

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Click outside notification popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb discreto em letras finas e pequenas */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-normal">
          <span className="text-slate-500 font-medium">{currentModule}</span>
          {currentSubmodule && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-700 font-medium">{currentSubmodule}</span>
            </>
          )}
        </nav>

        {/* Right-aligned actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Market currency info */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-md text-[11px] text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>AOA (Kz)</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">USD ref: 925 Kz</span>
          </div>

          {/* Expandable Search Input */}
          <div className="relative flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 transition-all w-64 md:w-80 shadow-xs">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  id="header-search-input"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Pesquisar produto, SKU, código..."
                  className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  id="btn-close-search"
                  onClick={() => {
                    setIsSearchExpanded(false);
                    onSearchChange('');
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-open-search"
                onClick={() => setIsSearchExpanded(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Pesquisar (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              id="btn-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" />
              {lowStockProducts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-xs font-semibold text-slate-800">Alertas de Estoque</h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 font-medium rounded">
                    {lowStockProducts.length} pendentes
                  </span>
                </div>

                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum alerta de estoque no momento.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {lowStockProducts.map((p) => {
                      const info = getProductStockInfo(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setShowNotifications(false);
                            onSelectProduct?.(p.id);
                          }}
                          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-slate-800 line-clamp-1">{p.name}</p>
                              <p className="text-[11px] text-slate-500">
                                Atual: <strong className="text-rose-600">{info.currentStock}</strong> / Mínimo: {info.minLimit} {p.unitOfMeasure}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botão "+ Adicionar" com destaque forte (preenchido, cor de acento) */}
          <button
            type="button"
            id="btn-header-add-product"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Adicionar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
