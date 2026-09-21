import React from 'react';
import { X, Printer, CheckCircle2, ShoppingBag, Truck, Building2, Calendar, User, ArrowRight } from 'lucide-react';
import { Sale, Transport } from '../../types/stock';
import { useStock } from '../../context/StockContext';
import { formatCurrencyValue, formatDate } from '../../utils/formatters';

interface SaleReceiptModalProps {
  sale: Sale | null;
  transport?: Transport | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToTransport?: () => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  sale,
  transport,
  isOpen,
  onClose,
  onGoToTransport,
}) => {
  const { warehouses, companies, banks, transports } = useStock();

  if (!isOpen || !sale) return null;

  const warehouse = warehouses.find((w) => w.id === sale.warehouseId);
  const company = companies.find((c) => c.id === warehouse?.companyId);
  const targetBank = banks.find((b) => b.id === company?.principalBankId) || banks[0];
  const linkedTransport = transport || transports.find((t) => t.saleId === sale.id);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'dinheiro':
        return 'Numerário / Dinheiro';
      case 'tpa':
        return 'TPA / Cartão Multicaixa';
      case 'transferencia':
        return 'Transferência Bancária';
      case 'a_prazo':
        return 'Venda a Prazo / Crédito';
      default:
        return method;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="modal-sale-receipt-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-sale-receipt-card"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Notification Bar (Non-print) */}
        <div className="bg-emerald-600 px-6 py-3 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span className="text-xs font-semibold">Venda Finalizada com Sucesso</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 text-slate-800 space-y-4">
          {/* Header of Receipt */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              {company?.name || 'SISTEMA DE GESTÃO'}
            </h2>
            {company?.nif && (
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIF: {company.nif}</p>
            )}
            {company?.address && (
              <p className="text-[11px] text-slate-500 mt-0.5">{company.address}</p>
            )}
            <div className="mt-2 inline-block px-2.5 py-1 bg-slate-100 rounded-md text-xs font-bold font-mono text-slate-800">
              RECIBO DE VENDA #{sale.id}
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-dashed border-slate-200 pb-3">
            <div>
              <span className="text-[11px] text-slate-400 block">Data & Hora:</span>
              <span className="font-medium text-slate-700">{formatDate(sale.date)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Armazém de Origem:</span>
              <span className="font-medium text-slate-700">{warehouse?.name || 'Armazém'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Forma de Pagamento:</span>
              <span className="font-medium text-slate-700">{getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Vendedor:</span>
              <span className="font-medium text-slate-700">{sale.seller}</span>
            </div>
            {sale.clientName && (
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block">Cliente:</span>
                <span className="font-semibold text-slate-800">{sale.clientName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
              Artigos Vendidos
            </span>
            <div className="divide-y divide-slate-100">
              {sale.items.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="pr-2">
                    <span className="font-medium text-slate-900 block">{item.productName}</span>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      {item.variationDetails && <span>{item.variationDetails}</span>}
                      <span>
                        {item.quantity} x {formatCurrencyValue(item.unitPrice, company?.currency || 'Kz')}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrencyValue(item.subtotal, company?.currency || 'Kz')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transport Info if requested */}
          {linkedTransport && (
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-sky-900">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Transporte Agendado (#{linkedTransport.id})</span>
                </span>
                <span>{formatCurrencyValue(linkedTransport.cost, company?.currency || 'Kz')}</span>
              </div>
              <p className="text-[11px] text-sky-800">
                <span className="font-medium">Destino:</span> {linkedTransport.deliveryAddress}
              </p>
              {linkedTransport.estimatedDeliveryDate && (
                <p className="text-[10px] text-sky-700">
                  Previsão: {formatDate(linkedTransport.estimatedDeliveryDate)}
                </p>
              )}
            </div>
          )}

          {/* Total Section */}
          <div className="pt-3 border-t-2 border-slate-900 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 uppercase">Total Pago</span>
              <span className="text-lg font-extrabold text-slate-900">
                {formatCurrencyValue(sale.total, company?.currency || 'Kz')}
              </span>
            </div>

            {targetBank && (
              <p className="text-[10px] text-slate-400 text-center pt-2">
                Movimentação creditada em: {targetBank.name} ({targetBank.currency})
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons (Non-print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            id="btn-print-receipt"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir Recibo</span>
          </button>

          <div className="flex items-center gap-2">
            {linkedTransport && onGoToTransport && (
              <button
                type="button"
                id="btn-go-to-transport-receipt"
                onClick={() => {
                  onClose();
                  onGoToTransport();
                }}
                className="flex items-center gap-1 px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Acompanhar Entrega</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              id="btn-close-receipt"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
