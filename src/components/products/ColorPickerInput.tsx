import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface ColorOption {
  name: string;
  hex: string;
  border?: boolean;
}

export const PRESET_COLORS: ColorOption[] = [
  { name: 'Preto', hex: '#0F172A' },
  { name: 'Branco', hex: '#FFFFFF', border: true },
  { name: 'Cinzento', hex: '#64748B' },
  { name: 'Prateado', hex: '#94A3B8' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Azul Marinho', hex: '#1E3A8A' },
  { name: 'Vermelho', hex: '#DC2626' },
  { name: 'Verde', hex: '#16A34A' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Dourado', hex: '#D97706' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Roxo', hex: '#9333EA' },
  { name: 'Laranja', hex: '#EA580C' },
  { name: 'Castanho', hex: '#78350F' },
  { name: 'Bege', hex: '#D4B996' },
];

interface ColorPickerInputProps {
  value?: string;
  hex?: string;
  onChange: (colorName: string, colorHex: string) => void;
  id?: string;
  placeholder?: string;
}

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  value = '',
  hex = '',
  onChange,
  id,
  placeholder = 'Selecionar cor',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive current hex if not explicitly provided
  const activeColor =
    PRESET_COLORS.find((c) => c.hex === hex || c.name.toLowerCase() === value.toLowerCase()) ||
    (hex ? { name: value || 'Cor', hex } : null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (color: ColorOption) => {
    onChange(color.name, color.hex);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        id={id}
        aria-label={activeColor ? `Cor selecionada: ${activeColor.name}` : placeholder}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:border-slate-300 dark:hover:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeColor ? (
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
              style={{
                backgroundColor: activeColor.hex,
                border: activeColor.border ? '1px solid #cbd5e1' : '1px solid rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <span className="w-4 h-4 rounded-full shrink-0 border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800" />
          )}

          <span
            className={`truncate font-medium ${
              activeColor ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {activeColor ? activeColor.name : placeholder}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 w-64">
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2 px-1">
            Escolher cor predefinida
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
            {PRESET_COLORS.map((col) => {
              const isSelected =
                activeColor?.name.toLowerCase() === col.name.toLowerCase() ||
                activeColor?.hex === col.hex;

              return (
                <button
                  key={col.name}
                  type="button"
                  title={col.name}
                  aria-label={col.name}
                  onClick={() => handleSelect(col)}
                  className={`group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-900 dark:ring-slate-100'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-2xs flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: col.hex,
                      border: col.border ? '1px solid #cbd5e1' : '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          col.hex === '#FFFFFF' || col.hex === '#EAB308' || col.hex === '#CBD5E1' || col.hex === '#94A3B8'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full text-center">
                    {col.name}
                  </span>
                </button>
              );
            })}
          </div>

          {activeColor && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-500 dark:text-slate-400">Selecionado:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeColor.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
