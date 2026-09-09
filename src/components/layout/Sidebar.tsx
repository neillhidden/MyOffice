import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  Receipt,
  Users,
  Calendar,
  Building2,
  Settings,
  Bot,
  Warehouse,
  ArrowLeftRight,
  TrendingUp,
  ShoppingCart,
  AlertOctagon,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type MainModule =
  | 'Dashboard'
  | 'Estoque'
  | 'Caixa'
  | 'Empregado'
  | 'Calendário'
  | 'Banco'
  | 'Definições'
  | 'Agentes';

export type EstoqueSubmodule =
  | 'Armazém'
  | 'Movimentação'
  | 'Análise de produtos'
  | 'Lista de compras'
  | 'Defeituoso';

interface SidebarProps {
  activeModule: MainModule;
  activeSubmodule: EstoqueSubmodule;
  onSelectModule: (module: MainModule) => void;
  onSelectSubmodule: (submodule: EstoqueSubmodule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: MainModule;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Estoque', label: 'Estoque', icon: Boxes },
  { id: 'Caixa', label: 'Caixa', icon: Receipt },
  { id: 'Empregado', label: 'Empregado', icon: Users },
  { id: 'Calendário', label: 'Calendário', icon: Calendar },
  { id: 'Banco', label: 'Banco', icon: Building2 },
  { id: 'Definições', label: 'Definições', icon: Settings },
  { id: 'Agentes', label: 'Agentes', icon: Bot },
];

const ESTOQUE_SUBMODULES: { id: EstoqueSubmodule; label: string; icon: React.ElementType }[] = [
  { id: 'Armazém', label: 'Armazém', icon: Warehouse },
  { id: 'Movimentação', label: 'Movimentação', icon: ArrowLeftRight },
  { id: 'Análise de produtos', label: 'Análise de produtos', icon: TrendingUp },
  { id: 'Lista de compras', label: 'Lista de compras', icon: ShoppingCart },
  { id: 'Defeituoso', label: 'Defeituoso', icon: AlertOctagon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubmodule,
  onSelectModule,
  onSelectSubmodule,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [estoqueExpanded, setEstoqueExpanded] = useState(true);
  const [showFloatingSubmenu, setShowFloatingSubmenu] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-200 z-40 relative select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Section: Brand & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100 justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm tracking-tight leading-none">
                  MyOffice
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wider uppercase">
                  Angola
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
              M
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Recolher barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isEstoque = item.id === 'Estoque';
            const isActiveModule = activeModule === item.id;

            if (isEstoque) {
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => isCollapsed && setShowFloatingSubmenu(true)}
                  onMouseLeave={() => isCollapsed && setShowFloatingSubmenu(false)}
                >
                  {/* Estoque Main Item */}
                  <button
                    type="button"
                    id={`nav-item-${item.id.toLowerCase()}`}
                    onClick={() => {
                      onSelectModule('Estoque');
                      if (!isCollapsed) {
                        setEstoqueExpanded(!estoqueExpanded);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActiveModule
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActiveModule ? 'text-white' : 'text-slate-500'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          estoqueExpanded ? 'rotate-180' : ''
                        } ${isActiveModule ? 'text-slate-300' : 'text-slate-400'}`}
                      />
                    )}
                  </button>

                  {/* Expanded: Submenu inline */}
                  {!isCollapsed && estoqueExpanded && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-200 space-y-0.5">
                      {ESTOQUE_SUBMODULES.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = isActiveModule && activeSubmodule === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            id={`subnav-${sub.id.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              onSelectModule('Estoque');
                              onSelectSubmodule(sub.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                              isSubActive
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed: Floating Submenu popup */}
                  {isCollapsed && showFloatingSubmenu && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                        <span className="text-xs font-semibold text-slate-800">Estoque</span>
                      </div>
                      <div className="space-y-0.5">
                        {ESTOQUE_SUBMODULES.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isActiveModule && activeSubmodule === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                onSelectModule('Estoque');
                                onSelectSubmodule(sub.id);
                                setShowFloatingSubmenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                                isSubActive
                                  ? 'bg-slate-100 text-slate-900 font-semibold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Other Modules (Dashboard, Caixa, etc.)
            return (
              <button
                key={item.id}
                type="button"
                id={`nav-item-${item.id.toLowerCase()}`}
                onClick={() => onSelectModule(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActiveModule
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActiveModule ? 'text-white' : 'text-slate-500'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-100">
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Expandir barra lateral"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <div className="px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>MyOffice v1.0</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
              AO
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
