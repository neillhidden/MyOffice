import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

interface FilterCheckboxDropdownProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  allLabel?: string;
  searchPlaceholder?: string;
  extraCheckbox?: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
}

export const FilterCheckboxDropdown: React.FC<FilterCheckboxDropdownProps> = ({
  id,
  label,
  icon,
  options,
  selectedIds,
  onChange,
  allLabel = 'Todas',
  searchPlaceholder = 'Buscar...',
  extraCheckbox,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter options by search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectableOptions = options.filter((o) => !o.disabled);
  const isAllSelected =
    selectableOptions.length > 0 &&
    selectableOptions.every((o) => selectedIds.includes(o.id));
  const isNoneSelected = selectedIds.length === 0;
  const isPartiallySelected = !isAllSelected && !isNoneSelected;

  // Handle option click with user-specified rules:
  // - Bloqueia opções desabilitadas (ex: Empresa parada)
  // - Clique simples: filtra exclusivamente por aquela empresa/opção (desmarca todas as outras)
  // - Shift + clique: seleção múltipla (adiciona à seleção sem desmarcar as demais)
  // - Shift + clique numa já selecionada (mesmo com todas marcadas): desmarca apenas aquela
  const handleOptionClick = (e: React.MouseEvent, option: FilterOption) => {
    e.preventDefault();
    if (option.disabled) return;

    const isMultiSelectKey = e.shiftKey || e.ctrlKey || e.metaKey;

    if (isMultiSelectKey) {
      if (selectedIds.includes(option.id)) {
        // Shift + clique numa opção já selecionada: desmarca apenas aquela específica
        onChange(selectedIds.filter((item) => item !== option.id));
      } else {
        // Shift + clique numa opção não selecionada: adiciona à seleção atual
        onChange([...selectedIds, option.id]);
      }
    } else {
      // Clique simples: seleção única e exclusiva
      onChange([option.id]);
    }
  };

  // Select all: seleciona APENAS as opções que não estão desabilitadas
  const handleSelectAll = () => {
    onChange(options.filter((o) => !o.disabled).map((o) => o.id));
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
  };

  // Simplified summary text for trigger button:
  const getSummaryText = () => {
    if (isAllSelected) {
      return allLabel;
    }
    if (isNoneSelected) {
      return allLabel === 'Todas' ? 'Nenhuma' : 'Nenhum';
    }
    if (selectedIds.length === 1) {
      const found = options.find((o) => o.id === selectedIds[0]);
      return found ? found.label : (allLabel === 'Todas' ? '1 selecionada' : '1 selecionado');
    }
    return `${selectedIds.length} selecionad${allLabel === 'Todas' ? 'as' : 'os'}`;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={`btn-filter-${id}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Filtrar por ${label}: ${getSummaryText()}`}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
          isPartiallySelected
            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
            : isNoneSelected
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : isOpen
            ? 'bg-white border-slate-400 text-slate-900 shadow-xs'
            : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        {icon && (
          <span className={`shrink-0 ${isPartiallySelected ? 'text-white' : 'text-slate-400'}`}>
            {icon}
          </span>
        )}
        <span className={`font-medium ${isPartiallySelected ? 'text-slate-200' : 'text-slate-500'}`}>
          {label}:
        </span>
        <span className="font-semibold truncate max-w-[140px]">
          {getSummaryText()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-slate-900' : isPartiallySelected ? 'text-slate-200' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div
          id={`popover-filter-${id}`}
          className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header com título "Filtro [Label]" e botões de ícone */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {icon && <span className="text-slate-500 w-4 h-4 shrink-0">{icon}</span>}
              <span className="text-xs font-bold text-slate-800 truncate">
                Filtro {label}
              </span>
            </div>

            {/* Ações do cabeçalho: Ícone de seleção, Ícone de olho e Botão Fechar */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Ícone de caixa de seleção: alterna entre selecionar todas / desmarcar todas */}
              <button
                type="button"
                id={`btn-${id}-toggle-all`}
                onClick={isAllSelected ? handleClearAll : handleSelectAll}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isAllSelected
                    ? 'text-slate-800 bg-slate-200/80 hover:bg-slate-300/80'
                    : isPartiallySelected
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                }`}
                title={
                  isAllSelected
                    ? `Desmarcar ${allLabel.toLowerCase()}`
                    : `Selecionar ${allLabel.toLowerCase()}`
                }
                aria-label={
                  isAllSelected
                    ? `Desmarcar ${allLabel.toLowerCase()}`
                    : `Selecionar ${allLabel.toLowerCase()}`
                }
              >
                {isAllSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-slate-800" />
                ) : isPartiallySelected ? (
                  <MinusSquare className="w-3.5 h-3.5 text-slate-700" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Ícone de olho: ativa/desativa a opção de ocultar produtos com estoque 0 */}
              {extraCheckbox && (
                <button
                  type="button"
                  id={`btn-${id}-toggle-hide-zero`}
                  onClick={() => extraCheckbox.onChange(!extraCheckbox.checked)}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    extraCheckbox.checked
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                  }`}
                  title={
                    extraCheckbox.checked
                      ? 'Ocultando produtos com estoque 0 (Clique para exibir todos)'
                      : 'Exibindo todos os produtos (Clique para ocultar produtos com estoque 0)'
                  }
                  aria-label={extraCheckbox.label}
                >
                  {extraCheckbox.checked ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Botão fechar (X) */}
              <button
                type="button"
                id={`btn-${id}-close`}
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Fechar"
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search box if many options */}
          {options.length > 4 && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id={`input-search-${id}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={`Pesquisar em ${label}`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List with Checkboxes and Click Rules */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-50 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum resultado para "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedIds.includes(option.id);
                const isDisabled = option.disabled;
                return (
                  <div
                    key={option.id}
                    id={`item-${id}-${option.id}`}
                    role="checkbox"
                    aria-checked={checked}
                    aria-disabled={isDisabled}
                    aria-label={option.label}
                    tabIndex={isDisabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleOptionClick(e as any, option);
                      }
                    }}
                    onClick={(e) => handleOptionClick(e, option)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-xs select-none ${
                      isDisabled
                        ? 'opacity-50 bg-slate-100/60 text-slate-400 cursor-not-allowed'
                        : checked
                        ? 'bg-slate-100/90 text-slate-900 font-medium cursor-pointer'
                        : 'hover:bg-slate-50 text-slate-600 cursor-pointer'
                    }`}
                    title={
                      isDisabled
                        ? 'Parada — serviços e seleção indisponíveis'
                        : 'Clique: filtrar exclusivamente este item • Shift + clique: seleção múltipla'
                    }
                  >
                    <div className="shrink-0 flex items-center justify-center">
                      <input
                        type="checkbox"
                        id={`checkbox-${id}-${option.id}`}
                        checked={checked}
                        disabled={isDisabled}
                        onChange={() => {}}
                        aria-label={`Selecionar ${option.label}`}
                        className={`w-4 h-4 rounded border-slate-300 ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer pointer-events-none'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-xs ${
                            isDisabled ? 'text-slate-400 font-normal italic line-through decoration-slate-300' : 'text-slate-800 font-medium'
                          }`}
                        >
                          {option.label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {option.badge && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-600">
                              {option.badge}
                            </span>
                          )}
                          {option.count !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                isDisabled
                                  ? 'bg-slate-100 text-slate-400'
                                  : option.count > 0
                                  ? 'bg-slate-200/70 text-slate-700 font-semibold'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {option.count}
                            </span>
                          )}
                        </div>
                      </div>
                      {option.sublabel && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {option.sublabel}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action & Quick Hint */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-600 font-medium">
                {selectedIds.length} de {selectableOptions.length} selecionad{allLabel === 'Todas' ? 'as' : 'os'}
              </span>
              <span className="text-[9px] text-slate-400">
                Shift+Clique p/ múltiplo
              </span>
            </div>
            <button
              type="button"
              id={`btn-${id}-apply`}
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
