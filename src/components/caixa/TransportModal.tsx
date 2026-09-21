import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle, Calendar, User, MapPin } from 'lucide-react';
import { Transport, TransportStatus } from '../../types/stock';

interface TransportModalProps {
  transport: Transport | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transport>) => void;
}

export const TransportModal: React.FC<TransportModalProps> = ({
  transport,
  isOpen,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<TransportStatus>('pendente');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transport) {
      setStatus(transport.status);
      setDeliveryAddress(transport.deliveryAddress);
      setDriver(transport.driver || '');
      setVehicle(transport.vehicle || '');
      setTrackingCode(transport.trackingCode || '');
      setEstimatedDeliveryDate(transport.estimatedDeliveryDate || '');
      setCost(transport.cost.toString());
      setNotes(transport.notes || '');
    }
    setError(null);
  }, [transport, isOpen]);

  if (!isOpen || !transport) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setError('O endereço de entrega é obrigatório.');
      return;
    }

    const numCost = parseFloat(cost) || 0;

    onSave(transport.id, {
      status,
      deliveryAddress: deliveryAddress.trim(),
      driver: driver.trim() || undefined,
      vehicle: vehicle.trim() || undefined,
      trackingCode: trackingCode.trim() || undefined,
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      cost: numCost,
      notes: notes.trim() || undefined,
      deliveredAt: status === 'entregue' && !transport.deliveredAt ? new Date().toISOString() : transport.deliveredAt,
    });
    onClose();
  };

  return (
    <div
      id="modal-transport-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-transport-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 id="modal-transport-title" className="text-base font-semibold text-slate-900 leading-tight">
                Gestão de Entrega #{transport.id}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Venda vinculada #{transport.saleId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selector */}
          <div>
            <label htmlFor="transport-status-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estado do Transporte <span className="text-rose-500">*</span>
            </label>
            <select
              id="transport-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TransportStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            >
              <option value="pendente">Pendente de Expedição</option>
              <option value="em_transito">Em Trânsito / Saiu para Entrega</option>
              <option value="entregue">Entregue com Sucesso</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Endereço */}
          <div>
            <label htmlFor="transport-addr-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Endereço de Destino <span className="text-rose-500">*</span>
            </label>
            <input
              id="transport-addr-input"
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Ex.: Rua Major Kanhangulo nº 12, Luanda"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Motorista & Viatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="transport-driver-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motorista / Estafeta
              </label>
              <input
                id="transport-driver-input"
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                placeholder="Ex.: António Manuel"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="transport-vehicle-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Viatura / Matrícula
              </label>
              <input
                id="transport-vehicle-input"
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ex.: Toyota Hilux (LD-44-22-HG)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Código de Rastreio & Data Prevista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="transport-code-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Código de Rastreio
              </label>
              <input
                id="transport-code-input"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex.: TRK-9988-AO"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="transport-est-date-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Data Prevista de Entrega
              </label>
              <input
                id="transport-est-date-input"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Custo de Transporte */}
          <div>
            <label htmlFor="transport-cost-edit-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Custo / Taxa de Frete
            </label>
            <input
              id="transport-cost-edit-input"
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="transport-notes-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Instruções para o Motorista
            </label>
            <textarea
              id="transport-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Ligar ao cliente 15 minutos antes da chegada"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-transport-modal"
              className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            >
              Atualizar Transporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
