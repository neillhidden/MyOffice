import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  X,
  AlertTriangle,
  ChevronRight,
  Package,
  Calendar as CalendarIcon,
  Truck,
  Users,
  CheckCheck,
  Trash2,
  Sun,
  Moon,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationItem, NotificationType } from '../../types/notification';

interface HeaderProps {
  currentModule: string;
  currentSubmodule: string;
  onOpenAddProduct?: () => void;
  onOpenDrafts?: () => void;
  onSelectProduct?: (productId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateToModule?: (module: string, submodule?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  currentSubmodule,
  onOpenAddProduct,
  onOpenDrafts,
  onSelectProduct,
  searchQuery,
  onSearchChange,
  onNavigateToModule,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useStock();
  const { actualTheme, toggleTheme } = useTheme();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'todas' | 'nao_lidas'>('todas');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayedNotifications = notifications.filter((n) => {
    if (notificationTab === 'nao_lidas') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'estoque_baixo':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
      case 'produto_reposto':
        return <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />;
      case 'evento_proximo':
        return <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />;
      case 'aniversario':
        return <Users className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />;
      case 'entrega_proxima':
        return <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    setShowNotifications(false);

    if (item.reference) {
      if (item.reference.type === 'produto') {
        if (onSelectProduct) {
          onSelectProduct(item.reference.id);
        } else if (onNavigateToModule) {
          onNavigateToModule('Estoque', 'armazem');
        }
      } else if (item.reference.type === 'evento') {
        onNavigateToModule?.('Calendário');
      } else if (item.reference.type === 'transporte') {
        onNavigateToModule?.('Caixa', 'transporte');
      } else if (item.reference.type === 'empregado') {
        onNavigateToModule?.('Contactos', 'Funcionários');
      }
    }
  };

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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 px-6 py-3.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb discreto em letras finas e pequenas */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-normal">
          <span className="text-slate-500 dark:text-slate-400 font-medium">{currentModule}</span>
          {currentSubmodule && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">{currentSubmodule}</span>
            </>
          )}
        </nav>

        {/* Right-aligned actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Market currency info */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 rounded-md text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="dark:text-slate-300">AOA (Kz)</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-400 dark:text-slate-400">USD ref: 925 Kz</span>
          </div>

          {/* Expandable Search Input */}
          <div className="relative flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 transition-all w-64 md:w-80 shadow-xs">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  id="header-search-input"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Pesquisar produto, SKU, código..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  id="btn-close-search"
                  onClick={() => {
                    setIsSearchExpanded(false);
                    onSearchChange('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-open-search"
                onClick={() => setIsSearchExpanded(true)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Pesquisar (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            type="button"
            id="btn-toggle-theme"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={actualTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label="Alternar modo de tema"
          >
            {actualTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              id="btn-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span
                  id="notifications-badge"
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                id="notifications-popover"
                className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Notificações</h4>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-medium rounded-full">
                        {unreadNotificationsCount} novas
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar lidas
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                  <button
                    onClick={() => setNotificationTab('todas')}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      notificationTab === 'todas'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Todas ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotificationTab('nao_lidas')}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      notificationTab === 'nao_lidas'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Não lidas ({unreadNotificationsCount})
                  </button>
                </div>

                {/* List */}
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <Bell className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Nenhuma notificação</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {notificationTab === 'nao_lidas'
                        ? 'Todas as mensagens foram lidas.'
                        : 'Tudo atualizado por aqui.'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
                    {displayedNotifications.map((n) => (
                      <div
                        key={n.id}
                        id={`notif-item-${n.id}`}
                        onClick={() => handleNotificationClick(n)}
                        className={`group p-2.5 rounded-lg cursor-pointer transition-colors text-left flex items-start justify-between gap-2 ${
                          !n.read
                            ? 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-medium truncate ${
                                  !n.read ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">
                              {n.date.split('T')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Delete single notification button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                          title="Remover notificação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
