import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Agenda, AgendaColor } from '../../types/calendar';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agenda: {
    name: string;
    color: AgendaColor;
    colorHex: string;
    description?: string;
  }) => void;
  initialAgenda?: Agenda | null;
}

const COLOR_PRESETS: Array<{ id: AgendaColor; name: string; hex: string }> = [
  { id: 'blue', name: 'Azul', hex: '#3b82f6' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981' },
  { id: 'amber', name: 'Âmbar', hex: '#f59e0b' },
  { id: 'rose', name: 'Rosa', hex: '#f43f5e' },
  { id: 'purple', name: 'Púrpura', hex: '#8b5cf6' },
  { id: 'indigo', name: 'Índigo', hex: '#6366f1' },
  { id: 'teal', name: 'Verde Petróleo', hex: '#14b8a6' },
  { id: 'slate', name: 'Ardósia', hex: '#64748b' },
];

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAgenda,
}) => {
  const [name, setName] = useState(initialAgenda?.name || '');
  const [selectedColor, setSelectedColor] = useState<AgendaColor>(
    initialAgenda?.color || 'blue'
  );
  const [colorHex, setColorHex] = useState(
    initialAgenda?.colorHex || '#3b82f6'
  );
  const [description, setDescription] = useState(
    initialAgenda?.description || ''
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da agenda.');
      return;
    }

    onSave({
      name: name.trim(),
      color: selectedColor,
      colorHex,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const handleSelectColor = (preset: typeof COLOR_PRESETS[0]) => {
    setSelectedColor(preset.id);
    setColorHex(preset.hex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        id="agenda-modal-container"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {initialAgenda ? 'Editar Agenda' : 'Nova Agenda'}
          </h3>
          <button
            type="button"
            id="btn-close-agenda-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Agenda Name */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Nome da Agenda <span className="text-rose-500">*</span>
            </label>
            <input
              id="agenda-name-input"
              type="text"
              required
              placeholder="Ex: Assinaturas, Reuniões, Treinamentos"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Discreet Color Palette Selector */}
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              Cor de Identificação
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Utilizada para diferenciar visualmente os compromissos com pontos e etiquetas discretas.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = selectedColor === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectColor(preset)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="text-[11px] font-medium text-slate-700 truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Notas ou objetivo dos compromissos desta agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
            />
          </div>

          {/* Footer Actions: Botão 'Adicionar' (sem ícone '+') */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="agenda-submit-btn"
              className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              {initialAgenda ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
