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
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-colors text-left"
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
            <span className="w-4 h-4 rounded-full shrink-0 border border-dashed border-slate-300 bg-slate-50" />
          )}

          <span
            className={`truncate font-medium ${
              activeColor ? 'text-slate-800' : 'text-slate-400 font-normal'
            }`}
          >
            {activeColor ? activeColor.name : placeholder}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64">
          <div className="text-[11px] font-medium text-slate-400 mb-2 px-1">
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
                  onClick={() => handleSelect(col)}
                  className={`group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
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
                  <span className="text-[9px] text-slate-600 mt-1 truncate max-w-full text-center">
                    {col.name}
                  </span>
                </button>
              );
            })}
          </div>

          {activeColor && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-500">Selecionado:</span>
              <span className="font-semibold text-slate-800">{activeColor.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
