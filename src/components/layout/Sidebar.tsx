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
  Calculator,
  ShoppingCart,
  AlertOctagon,
  ChevronDown,
  Truck,
  UserCheck,
  UserRound,
  Share2,
  HandCoins,
  Wallet,
  Target,
  House,
  ListChecks,
} from 'lucide-react';

import { HomeSection, OfficeMode } from '../../types/home';
import { ModeSwitcher } from '../home/ModeSwitcher';

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
  | 'Simulador de Importação e Rentabilidade'
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
  mode: OfficeMode;
  onModeChange: (mode: OfficeMode) => void;
  homeSection: HomeSection;
  onSelectHomeSection: (section: HomeSection) => void;
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
  {
    id: 'Simulador de Importação e Rentabilidade',
    label: 'Simulador de Importação e Rentabilidade',
    icon: Calculator,
  },
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
  mode, onModeChange, homeSection, onSelectHomeSection,
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
  // Acordeão: no máximo um submenu aberto de cada vez na barra expandida
  const [openSubmenu, setOpenSubmenu] = useState<MainModule | null>(() => {
    if (['Estoque', 'Caixa', 'Contactos', 'Financeiro', 'Banco'].includes(activeModule)) {
      return activeModule === 'Banco' ? 'Financeiro' : activeModule;
    }
    return 'Estoque';
  });

  // Estado único do submenu flutuante ativo quando a barra está recolhida
  const [hoveredFlyout, setHoveredFlyout] = useState<{
    id: MainModule;
    top: number;
    left: number;
  } | null>(null);

  // Temporizador para fecho ao sair por completo da barra (100–150ms de tolerância diagonal)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerButtonsRef = useRef<Map<MainModule, HTMLElement>>(new Map());

  // Cancelar temporizador pendente
  const cancelCloseTimer = () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Agendar fecho com pequeno atraso (120ms) ao sair completamente da barra/popup
  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredFlyout(null);
      closeTimeoutRef.current = null;
    }, 120);
  };

  // Fechar imediatamente sem qualquer atraso
  const closeImmediately = () => {
    cancelCloseTimer();
    setHoveredFlyout(null);
  };

  // Abrir ou reposicionar o painel flutuante imediatamente
  const openFlyoutImmediately = (moduleId: MainModule, element: HTMLElement) => {
    cancelCloseTimer();
    const rect = element.getBoundingClientRect();
    triggerButtonsRef.current.set(moduleId, element);
    setHoveredFlyout({
      id: moduleId,
      top: rect.top,
      left: rect.right,
    });
  };

  // Evento mouseenter num item de navegação
  const handleMouseEnterItem = (moduleId: MainModule, element: HTMLElement) => {
    if (!isCollapsed) return;

    const hasSub = Boolean(MODULE_SUBMODULES[moduleId]?.length);
    if (hasSub) {
      // Ao mover o rato para outro item com submenu:
      // O popup anterior fecha imediatamente e o novo abre NA MESMA HORA,
      // cancelando qualquer timer pendente e atualizando o estado na hora!
      openFlyoutImmediately(moduleId, element);
    } else {
      // Ao passar o rato num item sem submenu (ex: Dashboard, Definições, Agentes):
      // Fecha o popup anterior IMEDIATAMENTE, sem atraso!
      closeImmediately();
    }
  };

  // Evento mouseleave num item de navegação
  const handleMouseLeaveItem = () => {
    if (!isCollapsed) return;
    // Agenda fecho suave (120ms) caso o utilizador esteja a mover o cursor
    // na diagonal em direção ao próprio popup flutuante
    scheduleClose();
  };

  // Limpeza de timers e fecho ao alternar colapso ou desmontar
  useEffect(() => {
    if (!isCollapsed) {
      cancelCloseTimer();
      setHoveredFlyout(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    return () => {
      cancelCloseTimer();
    };
  }, []);

  // Fechar o menu flutuante em scroll ou redimensionamento da janela
  useEffect(() => {
    if (!hoveredFlyout) return;
    const handleScrollOrResize = () => {
      cancelCloseTimer();
      setHoveredFlyout(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [hoveredFlyout]);

  // Sincronizar o acordeão com alterações externas de módulo ativo
  useEffect(() => {
    if (['Estoque', 'Caixa', 'Contactos', 'Financeiro', 'Banco'].includes(activeModule)) {
      setOpenSubmenu(activeModule === 'Banco' ? 'Financeiro' : activeModule);
    }
  }, [activeModule]);

  // Manipulador do clique no item principal
  const handleItemClick = (module: MainModule, element: HTMLElement) => {
    onSelectModule(module);

    if (isCollapsed) {
      const hasSub = Boolean(MODULE_SUBMODULES[module]?.length);
      if (hasSub) {
        // Suporte para toque / clique com a barra recolhida
        setHoveredFlyout((prev) => {
          if (prev?.id === module) {
            return null;
          }
          cancelCloseTimer();
          const rect = element.getBoundingClientRect();
          triggerButtonsRef.current.set(module, element);
          return {
            id: module,
            top: rect.top,
            left: rect.right,
          };
        });
      } else {
        closeImmediately();
      }
    } else {
      if (MODULE_SUBMODULES[module]) {
        setOpenSubmenu((prev) => (prev === module ? null : module));
      }
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
    setHoveredFlyout(null);
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
      id="app-sidebar"
      onMouseLeave={() => {
        if (isCollapsed) {
          scheduleClose();
        }
      }}
      className={`h-full bg-white dark:bg-dm-surface border-r border-slate-200/80 dark:border-dm-border flex flex-col shrink-0 transition-[width] duration-200 ease-in-out z-40 relative select-none overflow-x-hidden ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header: altura fixa h-14 (56px) alinhada exatamente com o Header principal */}
      <div className="h-14 shrink-0 flex items-center border-b border-slate-200/80 dark:border-dm-border px-2 overflow-hidden">
        <button
          type="button"
          id="sidebar-brand-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir barra lateral (MyOffice)' : 'Recolher barra lateral (MyOffice)'}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="w-full h-10 flex items-center rounded-lg px-2 transition-colors cursor-pointer text-left group hover:bg-slate-100/80 dark:hover:bg-dm-elevated"
        >
          {/* Ícone fixo: sem reposicionamento ou recriação de nós */}
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-dm-text text-white dark:text-dm-page flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            M
          </div>

          {/* Texto animado suavemente em opacidade e largura */}
          <div
            className={`flex flex-col min-w-0 ml-2.5 overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[140px] opacity-100'
            }`}
          >
            <span className="font-semibold text-slate-900 dark:text-dm-text text-sm tracking-tight leading-none group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate whitespace-nowrap">
              MyOffice
            </span>
            <span className="text-[10px] text-slate-400 dark:text-dm-muted font-medium mt-0.5 tracking-wider uppercase whitespace-nowrap">
              Angola
            </span>
          </div>
        </button>
      </div>

      {mode === 'home' && (
        <nav aria-label="Menu Home" className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {([
            { section: 'Dashboard', icon: LayoutDashboard },
            { section: 'Finanças', icon: Wallet },
            { section: 'Orçamento', icon: Calculator },
            { section: 'Contas da casa', icon: House },
            { section: 'Metas e sonhos', icon: Target },
            { section: 'Agenda', icon: ListChecks },
            { section: 'Definições', icon: Settings },
            { section: 'Compras', icon: ShoppingCart },
          ] as const).map(({ section, icon: Icon }, index) => (
            <button type="button" key={section} id={`home-nav-${index}`}
              title={isCollapsed ? section : undefined} aria-label={section}
              aria-current={homeSection === section ? 'page' : undefined}
              onClick={() => onSelectHomeSection(section)}
              className={`w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium ${homeSection === section
                ? 'bg-slate-900 dark:bg-dm-elevated text-white dark:text-dm-text'
                : 'text-slate-600 dark:text-dm-muted hover:bg-slate-100 dark:hover:bg-dm-elevated'}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="min-w-0">{section}</span>}
            </button>
          ))}
        </nav>
      )}
      {/* Navigation List: começa exatamente abaixo da barra de topo h-14 */}
      <nav hidden={mode !== 'business'} style={mode !== 'business' ? {display:'none'} : undefined} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1 flex flex-col">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const submodules = MODULE_SUBMODULES[item.id];
          const hasSubmodules = Boolean(submodules && submodules.length > 0);
          const isActiveModule = activeModule === item.id;
          const isAccordionOpen = !isCollapsed && openSubmenu === item.id;

          return (
            <div key={item.id} className="w-full relative">
              {/* Main Navigation Item Button: largura 100%, altura 40px (h-10), ícone centrado a 32px */}
              <button
                type="button"
                id={`nav-item-${item.id.toLowerCase()}`}
                onClick={(e) => handleItemClick(item.id, e.currentTarget)}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
                aria-expanded={hasSubmodules ? (isCollapsed ? Boolean(hoveredFlyout?.id === item.id) : isAccordionOpen) : undefined}
                onMouseEnter={(e) => handleMouseEnterItem(item.id, e.currentTarget)}
                onMouseLeave={handleMouseLeaveItem}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && isCollapsed && hoveredFlyout) {
                    closeImmediately();
                  }
                }}
                className={`w-full h-10 flex items-center rounded-lg px-2 text-xs font-medium transition-colors cursor-pointer group ${
                  isActiveModule
                    ? 'bg-slate-900 dark:bg-dm-border/70 text-white dark:text-dm-text shadow-xs dark:shadow-none font-semibold'
                    : 'text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text hover:bg-slate-100/80 dark:hover:bg-dm-elevated'
                }`}
              >
                {/* Contentor de ícone com largura e posição fixa (32px de largura, centrado) */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActiveModule
                        ? 'text-white dark:text-dm-text'
                        : 'text-slate-500 dark:text-dm-muted group-hover:text-slate-800 dark:group-hover:text-dm-text'
                    }`}
                  />
                </div>

                {/* Texto e seta colapsam suavemente sem desmontar o DOM */}
                <div
                  className={`flex items-center justify-between flex-1 min-w-0 ml-2 overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out ${
                    isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100'
                  }`}
                >
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                  {hasSubmodules && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isAccordionOpen ? 'rotate-180' : ''
                      } ${
                        isActiveModule
                          ? 'text-slate-300 dark:text-dm-text'
                          : 'text-slate-400 dark:text-dm-muted'
                      }`}
                    />
                  )}
                </div>
              </button>

              {/* Submenu Inline (Acordeão quando Expandido) */}
              {hasSubmodules && (
                <div
                  className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
                    !isCollapsed && isAccordionOpen
                      ? 'max-h-64 opacity-100 mt-1'
                      : 'max-h-0 opacity-0 pointer-events-none'
                  } ml-6 pl-2 border-l border-slate-200 dark:border-dm-border space-y-0.5`}
                >
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
                            ? 'bg-slate-100 dark:bg-dm-border/60 text-slate-900 dark:text-dm-text font-semibold'
                            : 'text-slate-500 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text hover:bg-slate-50 dark:hover:bg-dm-elevated'
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-slate-900 dark:text-dm-text' : 'text-slate-400 dark:text-dm-muted'
                          }`}
                        />
                        <span className="truncate whitespace-nowrap">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <ModeSwitcher mode={mode} compact={isCollapsed} onChange={(value) => {
        setHoveredFlyout(null);
        onModeChange(value);
      }} />
      {/* Bottom Section: Footer info (sem o controlo de tema) */}
      <div className="border-t border-slate-200/80 dark:border-dm-border p-2 shrink-0 overflow-hidden">
        <div className="h-7 flex items-center px-2 overflow-hidden">
          <div className="w-8 h-6 shrink-0 flex items-center justify-center">
            <span className="text-[10px] bg-slate-100 dark:bg-dm-elevated text-slate-500 dark:text-dm-muted border border-transparent dark:border-dm-border font-mono px-1.5 py-0.5 rounded text-center">
              AO
            </span>
          </div>
          <div
            className={`flex items-center justify-between flex-1 min-w-0 ml-2 overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100'
            }`}
          >
            <span className="text-[11px] text-slate-400 dark:text-dm-muted truncate whitespace-nowrap">
              MyOffice v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Submenu Flutuante com Portal (Estado Recolhido) */}
      {mode === 'business' && isCollapsed && hoveredFlyout && createPortal(
        <div
          key={hoveredFlyout.id}
          role="region"
          aria-label={`Submenu ${hoveredFlyout.id}`}
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
              const targetModule = hoveredFlyout.id;
              setHoveredFlyout(null);
              triggerButtonsRef.current.get(targetModule)?.focus();
            }
          }}
          style={{
            position: 'fixed',
            // Clampar a posição vertical para impedir corte na margem inferior do ecrã
            top: Math.max(8, Math.min(hoveredFlyout.top, window.innerHeight - 260)),
            // Começa exatamente na borda direita da barra lateral
            left: hoveredFlyout.left,
            zIndex: 9999,
          }}
          className="pl-2 pt-0 pb-0 select-none outline-none group/portal pointer-events-auto"
        >
          {/* Ponte de Hover entre o botão e o popup (sem transbordar verticalmente para itens adjacentes) */}
          <div
            className="absolute -left-2.5 top-0 bottom-0 w-3 pointer-events-auto"
            aria-hidden="true"
          />

          {/* Cartão visível do submenu flutuante */}
          <div className="w-48 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-xl shadow-xl dark:shadow-none p-1.5 backdrop-blur-xs relative z-10 animate-in fade-in zoom-in-95 duration-75">
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-dm-border mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-dm-text">
                {hoveredFlyout.id}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-dm-muted font-mono">
                Esc
              </span>
            </div>
            <div className="space-y-0.5">
              {MODULE_SUBMODULES[hoveredFlyout.id]?.map((sub) => {
                const SubIcon = sub.icon;
                const active = isSubActive(hoveredFlyout.id, sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    id={getSubnavId(hoveredFlyout.id, sub.id, true)}
                    onClick={() => handleSelectSub(hoveredFlyout.id, sub.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                      active
                        ? 'bg-slate-100 dark:bg-dm-border/60 text-slate-900 dark:text-dm-text font-semibold'
                        : 'text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text hover:bg-slate-50 dark:hover:bg-dm-elevated'
                    }`}
                  >
                    <SubIcon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active
                          ? 'text-slate-900 dark:text-dm-text'
                          : 'text-slate-400 dark:text-dm-muted'
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
