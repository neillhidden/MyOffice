import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Truck,
  Sun,
  Moon,
  UserCheck,
  UserRound,
  Share2,
  HandCoins,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type MainModule =
  | 'Dashboard'
  | 'Estoque'
  | 'Caixa'
  | 'Contactos'
  | 'Calendário'
  | 'Financeiro'
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

export type FinanceiroSubmodule =
  | 'Contas'
  | 'Lançamentos'
  | 'Dívidas';

interface SidebarProps {
  activeModule: MainModule;
  activeSubmodule: EstoqueSubmodule;
  activeCaixaSubmodule: CaixaSubmodule;
  activeContactosSubmodule: ContactosSubmodule;
  activeFinanceiroSubmodule?: FinanceiroSubmodule;
  onSelectModule: (module: MainModule) => void;
  onSelectSubmodule: (submodule: EstoqueSubmodule) => void;
  onSelectCaixaSubmodule: (submodule: CaixaSubmodule) => void;
  onSelectContactosSubmodule: (submodule: ContactosSubmodule) => void;
  onSelectFinanceiroSubmodule?: (submodule: FinanceiroSubmodule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: MainModule;
  label: string;
  icon: React.ElementType;
}

interface SubmoduleItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Estoque', label: 'Estoque', icon: Boxes },
  { id: 'Caixa', label: 'Caixa', icon: Receipt },
  { id: 'Contactos', label: 'Contactos', icon: Users },
  { id: 'Calendário', label: 'Calendário', icon: Calendar },
  { id: 'Financeiro', label: 'Financeiro', icon: Building2 },
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

const FINANCEIRO_SUBMODULES: { id: FinanceiroSubmodule; label: string; icon: React.ElementType }[] = [
  { id: 'Contas', label: 'Contas', icon: Building2 },
  { id: 'Lançamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { id: 'Dívidas', label: 'Dívidas', icon: HandCoins },
];

const MODULE_SUBMODULES: Partial<Record<MainModule, SubmoduleItem[]>> = {
  Estoque: ESTOQUE_SUBMODULES,
  Caixa: CAIXA_SUBMODULES,
  Contactos: CONTACTOS_SUBMODULES,
  Financeiro: FINANCEIRO_SUBMODULES,
  Banco: FINANCEIRO_SUBMODULES,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubmodule,
  activeCaixaSubmodule,
  activeContactosSubmodule,
  activeFinanceiroSubmodule = 'Contas',
  onSelectModule,
  onSelectSubmodule,
  onSelectCaixaSubmodule,
  onSelectContactosSubmodule,
  onSelectFinanceiroSubmodule,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { actualTheme, toggleTheme } = useTheme();

  // Acordeão: no máximo um submenu aberto de cada vez na barra expandida
  const [openSubmenu, setOpenSubmenu] = useState<MainModule | null>(() => {
    if (['Estoque', 'Caixa', 'Contactos', 'Financeiro', 'Banco'].includes(activeModule)) {
      return activeModule === 'Banco' ? 'Financeiro' : activeModule;
    }
    return 'Estoque';
  });

  // Estado do submenu flutuante quando a barra está recolhida
  const [floatingMenu, setFloatingMenu] = useState<{
    id: MainModule;
    top: number;
    left: number;
  } | null>(null);

  // Temporizador para fecho com tolerância (250-350ms, usamos 300ms)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerButtonsRef = useRef<Map<MainModule, HTMLElement>>(new Map());

  // Cancelar temporizador pendente
  const cancelCloseTimer = () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Agendar fecho com tolerância de 300ms
  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimeoutRef.current = setTimeout(() => {
      setFloatingMenu(null);
      closeTimeoutRef.current = null;
    }, 300);
  };

  // Abrir ou reposicionar o painel flutuante
  const openFloatingMenu = (moduleId: MainModule, element: HTMLElement) => {
    cancelCloseTimer();
    const rect = element.getBoundingClientRect();
    // Guardar referência para devolver foco em caso de Escape
    triggerButtonsRef.current.set(moduleId, element);

    setFloatingMenu({
      id: moduleId,
      top: rect.top,
      left: rect.right,
    });
  };

  // Limpeza de timers e fecho ao alternar colapso ou desmontar
  useEffect(() => {
    if (!isCollapsed) {
      cancelCloseTimer();
      setFloatingMenu(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    return () => {
      cancelCloseTimer();
    };
  }, []);

  // Fechar o menu flutuante em scroll ou redimensionamento da janela
  useEffect(() => {
    if (!floatingMenu) return;
    const handleScrollOrResize = () => {
      cancelCloseTimer();
      setFloatingMenu(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [floatingMenu]);

  // Sincronizar o acordeão com alterações externas de módulo ativo
  useEffect(() => {
    if (['Estoque', 'Caixa', 'Contactos', 'Financeiro', 'Banco'].includes(activeModule)) {
      setOpenSubmenu(activeModule === 'Banco' ? 'Financeiro' : activeModule);
    }
  }, [activeModule]);

  // Manipulador do clique no item principal
  const handleItemClick = (module: MainModule) => {
    onSelectModule(module);
    if (!isCollapsed && MODULE_SUBMODULES[module]) {
      setOpenSubmenu((prev) => (prev === module ? null : module));
    }
  };

  // Manipulador de clique nos subitens
  const handleSelectSub = (module: MainModule, subId: string) => {
    onSelectModule(module);
    if (module === 'Estoque') {
      onSelectSubmodule(subId as EstoqueSubmodule);
    } else if (module === 'Caixa') {
      onSelectCaixaSubmodule(subId as CaixaSubmodule);
    } else if (module === 'Contactos') {
      onSelectContactosSubmodule(subId as ContactosSubmodule);
    } else if (module === 'Financeiro' || module === 'Banco') {
      onSelectFinanceiroSubmodule?.(subId as FinanceiroSubmodule);
    }
    cancelCloseTimer();
    setFloatingMenu(null);
  };

  // Verificar se o subitem atual está ativo
  const isSubActive = (module: MainModule, subId: string) => {
    if (activeModule !== module && !(module === 'Financeiro' && activeModule === 'Banco')) return false;
    if (module === 'Estoque') return activeSubmodule === subId;
    if (module === 'Caixa') return activeCaixaSubmodule === subId;
    if (module === 'Contactos') return activeContactosSubmodule === subId;
    if (module === 'Financeiro' || module === 'Banco') return activeFinanceiroSubmodule === subId;
    return false;
  };

  // Gerar o ID do subitem para manter compatibilidade com testes existentes
  const getSubnavId = (module: MainModule, subId: string, isFloating = false) => {
    const cleanId = subId.toLowerCase().replace(/\s+/g, '-');
    if (isFloating) {
      return `floating-subnav-${module.toLowerCase()}-${cleanId}`;
    }
    if (module === 'Estoque') return `subnav-${cleanId}`;
    if (module === 'Caixa') return `subnav-caixa-${cleanId}`;
    if (module === 'Contactos') return `subnav-contactos-${cleanId}`;
    if (module === 'Financeiro' || module === 'Banco') return `subnav-financeiro-${cleanId}`;
    return `subnav-${cleanId}`;
  };

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-200 z-40 relative select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Section: Brand & Navigation */}
      <div>
        {/* Brand Header: Logo/nome MyOffice expande/recolhe a barra lateral */}
        <div
          className={`h-14 flex items-center border-b border-slate-100 dark:border-slate-800 ${
            isCollapsed ? 'justify-center px-2' : 'px-2.5'
          }`}
        >
          <button
            type="button"
            id="sidebar-brand-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral (MyOffice)' : 'Recolher barra lateral (MyOffice)'}
            className={`flex items-center rounded-lg transition-colors cursor-pointer text-left group hover:bg-slate-100/80 dark:hover:bg-slate-800/80 ${
              isCollapsed ? 'w-10 h-10 justify-center p-0 shrink-0' : 'w-full gap-2.5 p-1.5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              M
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-none group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate">
                  MyOffice
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 tracking-wider uppercase">
                  Angola
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav className={`p-2 space-y-1 flex flex-col ${isCollapsed ? 'items-center' : 'items-stretch'}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const submodules = MODULE_SUBMODULES[item.id];
            const hasSubmodules = Boolean(submodules && submodules.length > 0);
            const isActiveModule = activeModule === item.id;
            const isAccordionOpen = !isCollapsed && openSubmenu === item.id;

            return (
              <div
                key={item.id}
                className={isCollapsed ? 'w-10 relative flex justify-center' : 'w-full relative'}
              >
                {/* Main Navigation Item Button */}
                <button
                  type="button"
                  id={`nav-item-${item.id.toLowerCase()}`}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  onMouseEnter={(e) => {
                    if (isCollapsed) {
                      if (hasSubmodules) {
                        openFloatingMenu(item.id, e.currentTarget);
                      } else {
                        // Ao passar o rato num item sem submenu, fecha qualquer submenu aberto anteriormente
                        scheduleClose();
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (isCollapsed && hasSubmodules) {
                      scheduleClose();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && isCollapsed && floatingMenu) {
                      cancelCloseTimer();
                      setFloatingMenu(null);
                    }
                  }}
                  className={`cursor-pointer transition-colors ${
                    isCollapsed
                      ? `w-10 h-10 flex items-center justify-center rounded-lg p-0 shrink-0 ${
                          isActiveModule
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`
                      : `w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium ${
                          isActiveModule
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`
                  }`}
                >
                  {isCollapsed ? (
                    /* Estado Recolhido: apenas o ícone perfeitamente centrado sem textos, setas ou espaçamentos */
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActiveModule
                          ? 'text-white dark:text-slate-900'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                  ) : (
                    /* Estado Expandido: ícone, texto e seta alinhados */
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActiveModule
                              ? 'text-white dark:text-slate-900'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {hasSubmodules && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                            isAccordionOpen ? 'rotate-180' : ''
                          } ${
                            isActiveModule
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu Inline (Acordeão quando Expandido) */}
                {!isCollapsed && hasSubmodules && isAccordionOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                    {submodules.map((sub) => {
                      const SubIcon = sub.icon;
                      const active = isSubActive(item.id, sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          id={getSubnavId(item.id, sub.id, false)}
                          onClick={() => handleSelectSub(item.id, sub.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left cursor-pointer ${
                            active
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div
        className={`border-t border-slate-100 dark:border-slate-800 space-y-2 flex flex-col ${
          isCollapsed ? 'p-2 items-center' : 'p-3 items-stretch'
        }`}
      >
        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={actualTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className={`flex items-center rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
            isCollapsed ? 'w-10 h-10 justify-center p-0 shrink-0' : 'w-full justify-between px-2.5 py-2'
          }`}
        >
          {isCollapsed ? (
            actualTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500 shrink-0" />
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                {actualTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>{actualTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
                {actualTheme}
              </span>
            </>
          )}
        </button>

        {isCollapsed ? (
          <div className="w-10 flex items-center justify-center py-1">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono px-1.5 py-0.5 rounded text-center">
              AO
            </span>
          </div>
        ) : (
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>MyOffice v1.0</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded">
              AO
            </span>
          </div>
        )}
      </div>

      {/* Submenu Flutuante com Portal (Estado Recolhido) */}
      {isCollapsed && floatingMenu && createPortal(
        <div
          role="region"
          aria-label={`Submenu ${floatingMenu.id}`}
          tabIndex={-1}
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={scheduleClose}
          onFocus={cancelCloseTimer}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              scheduleClose();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelCloseTimer();
              const targetModule = floatingMenu.id;
              setFloatingMenu(null);
              triggerButtonsRef.current.get(targetModule)?.focus();
            }
          }}
          style={{
            position: 'fixed',
            // Clampar a posição vertical para impedir corte na margem inferior do ecrã
            top: Math.max(8, Math.min(floatingMenu.top, window.innerHeight - 260)),
            // Começa exatamente na borda direita da barra lateral / botão
            left: floatingMenu.left,
            zIndex: 9999,
          }}
          className="pl-2 pt-0 pb-0 select-none outline-none group/portal pointer-events-auto"
        >
          {/* Ponte de Hover: estende 6px para a esquerda sobrepondo a borda da barra lateral para eliminar qualquer zona morta */}
          <div
            className="absolute -left-3 top-0 bottom-0 w-5 pointer-events-auto"
            aria-hidden="true"
          />

          {/* Zona de proteção diagonal para movimentos rápidos e angulares até aos subitens */}
          <div
            className="absolute -left-6 -top-8 -bottom-8 w-8 pointer-events-auto"
            aria-hidden="true"
          />

          {/* Cartão visível do submenu flutuante */}
          <div className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 backdrop-blur-xs relative z-10 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {floatingMenu.id}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Esc
              </span>
            </div>
            <div className="space-y-0.5">
              {MODULE_SUBMODULES[floatingMenu.id]?.map((sub) => {
                const SubIcon = sub.icon;
                const active = isSubActive(floatingMenu.id, sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    id={getSubnavId(floatingMenu.id, sub.id, true)}
                    onClick={() => handleSelectSub(floatingMenu.id, sub.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                      active
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <SubIcon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};


