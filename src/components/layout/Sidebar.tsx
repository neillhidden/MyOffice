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
  Truck,
  Sun,
  Moon,
  UserCheck,
  UserRound,
  Share2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type MainModule =
  | 'Dashboard'
  | 'Estoque'
  | 'Caixa'
  | 'Contactos'
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

export type CaixaSubmodule =
  | 'Venda'
  | 'Transporte';

export type ContactosSubmodule =
  | 'Funcionários'
  | 'Clientes'
  | 'Fornecedores'
  | 'Afiliados';

interface SidebarProps {
  activeModule: MainModule;
  activeSubmodule: EstoqueSubmodule;
  activeCaixaSubmodule: CaixaSubmodule;
  activeContactosSubmodule: ContactosSubmodule;
  onSelectModule: (module: MainModule) => void;
  onSelectSubmodule: (submodule: EstoqueSubmodule) => void;
  onSelectCaixaSubmodule: (submodule: CaixaSubmodule) => void;
  onSelectContactosSubmodule: (submodule: ContactosSubmodule) => void;
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
  { id: 'Contactos', label: 'Contactos', icon: Users },
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

const CAIXA_SUBMODULES: { id: CaixaSubmodule; label: string; icon: React.ElementType }[] = [
  { id: 'Venda', label: 'Venda', icon: ShoppingCart },
  { id: 'Transporte', label: 'Transporte', icon: Truck },
];

const CONTACTOS_SUBMODULES: { id: ContactosSubmodule; label: string; icon: React.ElementType }[] = [
  { id: 'Funcionários', label: 'Funcionários', icon: UserCheck },
  { id: 'Clientes', label: 'Clientes', icon: UserRound },
  { id: 'Fornecedores', label: 'Fornecedores', icon: Truck },
  { id: 'Afiliados', label: 'Afiliados', icon: Share2 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubmodule,
  activeCaixaSubmodule,
  activeContactosSubmodule,
  onSelectModule,
  onSelectSubmodule,
  onSelectCaixaSubmodule,
  onSelectContactosSubmodule,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { actualTheme, toggleTheme } = useTheme();
  const [estoqueExpanded, setEstoqueExpanded] = useState(true);
  const [caixaExpanded, setCaixaExpanded] = useState(true);
  const [contactosExpanded, setContactosExpanded] = useState(true);
  const [showFloatingSubmenu, setShowFloatingSubmenu] = useState(false);
  const [showFloatingCaixaSubmenu, setShowFloatingCaixaSubmenu] = useState(false);
  const [showFloatingContactosSubmenu, setShowFloatingContactosSubmenu] = useState(false);

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-200 z-40 relative select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Section: Brand & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-none">
                  MyOffice
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 tracking-wider uppercase">
                  Angola
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
              M
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActiveModule ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          estoqueExpanded ? 'rotate-180' : ''
                        } ${isActiveModule ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}
                      />
                    )}
                  </button>

                  {/* Expanded: Submenu inline */}
                  {!isCollapsed && estoqueExpanded && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
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
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
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
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Estoque</span>
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
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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

            if (item.id === 'Caixa') {
              const isCaixaActive = activeModule === 'Caixa';
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => isCollapsed && setShowFloatingCaixaSubmenu(true)}
                  onMouseLeave={() => isCollapsed && setShowFloatingCaixaSubmenu(false)}
                >
                  {/* Caixa Main Item */}
                  <button
                    type="button"
                    id={`nav-item-${item.id.toLowerCase()}`}
                    onClick={() => {
                      onSelectModule('Caixa');
                      if (!isCollapsed) {
                        setCaixaExpanded(!caixaExpanded);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isCaixaActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isCaixaActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          caixaExpanded ? 'rotate-180' : ''
                        } ${isCaixaActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}
                      />
                    )}
                  </button>

                  {/* Expanded: Submenu inline */}
                  {!isCollapsed && caixaExpanded && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                      {CAIXA_SUBMODULES.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = isCaixaActive && activeCaixaSubmodule === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            id={`subnav-caixa-${sub.id.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              onSelectModule('Caixa');
                              onSelectCaixaSubmodule(sub.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                              isSubActive
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed: Floating Submenu popup */}
                  {isCollapsed && showFloatingCaixaSubmenu && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Caixa</span>
                      </div>
                      <div className="space-y-0.5">
                        {CAIXA_SUBMODULES.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isCaixaActive && activeCaixaSubmodule === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                onSelectModule('Caixa');
                                onSelectCaixaSubmodule(sub.id);
                                setShowFloatingCaixaSubmenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                                isSubActive
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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

            if (item.id === 'Contactos') {
              const isContactosActive = activeModule === 'Contactos';
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => isCollapsed && setShowFloatingContactosSubmenu(true)}
                  onMouseLeave={() => isCollapsed && setShowFloatingContactosSubmenu(false)}
                >
                  {/* Contactos Main Item */}
                  <button
                    type="button"
                    id={`nav-item-${item.id.toLowerCase()}`}
                    onClick={() => {
                      onSelectModule('Contactos');
                      if (!isCollapsed) {
                        setContactosExpanded(!contactosExpanded);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isContactosActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isContactosActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          contactosExpanded ? 'rotate-180' : ''
                        } ${isContactosActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}
                      />
                    )}
                  </button>

                  {/* Expanded: Submenu inline */}
                  {!isCollapsed && contactosExpanded && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                      {CONTACTOS_SUBMODULES.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = isContactosActive && activeContactosSubmodule === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            id={`subnav-contactos-${sub.id.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              onSelectModule('Contactos');
                              onSelectContactosSubmodule(sub.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                              isSubActive
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed: Floating Submenu popup */}
                  {isCollapsed && showFloatingContactosSubmenu && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Contactos</span>
                      </div>
                      <div className="space-y-0.5">
                        {CONTACTOS_SUBMODULES.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isContactosActive && activeContactosSubmodule === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                onSelectModule('Contactos');
                                onSelectContactosSubmodule(sub.id);
                                setShowFloatingContactosSubmenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                                isSubActive
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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

            // Other Modules (Dashboard, Empregado, Calendário, Banco, etc.)
            return (
              <button
                key={item.id}
                type="button"
                id={`nav-item-${item.id.toLowerCase()}`}
                onClick={() => onSelectModule(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActiveModule
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActiveModule ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={actualTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {actualTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            {!isCollapsed && (
              <span>{actualTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
              {actualTheme}
            </span>
          )}
        </button>

        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Expandir barra lateral"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>MyOffice v1.0</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded">
              AO
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
