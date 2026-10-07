import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  Truck,
  Building2,
  Warehouse as WarehouseIcon,
  CreditCard,
  User,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Product, ProductVariation, SalePaymentMethod, Sale, Transport } from '../../types/stock';
import { formatCurrencyValue } from '../../utils/formatters';

interface CartItem {
  productId: string;
  productName: string;
  productSku?: string;
  variationId?: string;
  variationSku?: string;
  variationDetails?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted: (sale: Sale, transport?: Transport) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
}) => {
  const {
    warehouses,
    companies,
    products,
    banks,
    clients,
    isCompanyDisabled,
    getCurrentStock,
    getProductWarehouses,
    getCompanyForBank,
    completeSale,
  } = useStock();

  // Selected Warehouse & Bank
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || '');
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Item being added
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<string>('');

  // Payment & Sale details
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('dinheiro');
  const [seller, setSeller] = useState<string>('Administrador');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Transport details
  const [requiresTransport, setRequiresTransport] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [transportCost, setTransportCost] = useState<string>('0');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('');
  const [transportNotes, setTransportNotes] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  // Operational warehouses (excludes desativada companies)
  const operationalWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      if (w.id === 'wh-kianda' || w.companyId === 'comp-kianda') {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }
      const comp = companies.find((c) => c.id === w.companyId);
      if (comp?.status === 'desativada' || isCompanyDisabled(w.companyId)) return false;
      return true;
    });
  }, [warehouses, companies, isCompanyDisabled]);

  // Operational products (strictly excludes products linked to disabled companies)
  const operationalProducts = useMemo(() => {
    return products.filter((p) => {
      // Exclude Kianda products if Kianda is disabled
      if (p.id.includes('kianda') || p.brand?.toLowerCase().includes('kianda')) {
        const kiandaComp = companies.find((c) => c.id === 'comp-kianda');
        if (kiandaComp ? kiandaComp.status === 'desativada' : true) return false;
      }

      // Check operational warehouses (getProductWarehouses already filters out disabled companies)
      const operationalWhs = getProductWarehouses(p.id);
      if (operationalWhs.length === 0) {
        return false;
      }

      return true;
    });
  }, [products, companies, isCompanyDisabled, getProductWarehouses]);

  // Sync initial warehouse on open
  React.useEffect(() => {
    if (isOpen) {
      const firstActiveWh = operationalWarehouses.find((w) => {
        const comp = companies.find((c) => c.id === w.companyId);
        return comp?.status === 'ativa';
      }) || operationalWarehouses[0];

      if (firstActiveWh) {
        setWarehouseId(firstActiveWh.id);
      }
      setCart([]);
      setSelectedProductId('');
      setSelectedVariationId('');
      setItemQuantity(1);
      setItemUnitPrice('');
      setPaymentMethod('dinheiro');
      setSelectedClientId('');
      setCustomClientName('');
      setRequiresTransport(false);
      setDeliveryAddress('');
      setTransportCost('0');
      setEstimatedDeliveryDate('');
      setTransportNotes('');
      setError(null);
    }
  }, [isOpen, operationalWarehouses, companies]);

  // Derived current Warehouse, Company, and Valid Banks for this Company & Currency
  const currentWarehouse = warehouses.find((w) => w.id === warehouseId);
  const currentCompany = companies.find((c) => c.id === currentWarehouse?.companyId);
  const currency = currentCompany?.currency || 'Kz';

  // Contas elegíveis: ativas, da mesma Empresa e na mesma moeda da venda
  const companyValidBanks = useMemo(() => {
    if (!currentCompany) return [];
    return banks.filter((b) => {
      const isBankActive = b.status === 'ativo' || b.status === 'ativa';
      if (!isBankActive) return false;
      const bankComp = getCompanyForBank(b.id);
      if (!bankComp || bankComp.id !== currentCompany.id) return false;
      if ((b.currency || 'Kz') !== currency) return false;
      return true;
    });
  }, [banks, currentCompany, currency, getCompanyForBank]);

  // Sync selectedBankId whenever company or valid banks change
  React.useEffect(() => {
    if (!currentCompany) {
      setSelectedBankId('');
      return;
    }
    const currentStillValid = companyValidBanks.some((b) => b.id === selectedBankId);
    if (currentStillValid) return;

    const preferredPrincipal = companyValidBanks.find(
      (b) => b.id === currentCompany.principalBankId
    );
    setSelectedBankId(preferredPrincipal?.id || companyValidBanks[0]?.id || '');
  }, [currentCompany, companyValidBanks, selectedBankId]);

  const selectedBank =
    companyValidBanks.find((b) => b.id === selectedBankId) ||
    banks.find((b) => b.id === currentCompany?.principalBankId);

  // Available stock for selected product and variation in this warehouse
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const availableStock = useMemo(() => {
    if (!selectedProductId || !warehouseId) return 0;
    return getCurrentStock(selectedProductId, warehouseId, selectedVariationId || undefined);
  }, [selectedProductId, warehouseId, selectedVariationId, getCurrentStock]);

  // Auto-fill price when product changes
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setSelectedVariationId('');
    setError(null);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemUnitPrice(prod.salePrice.toString());
      if (prod.variations && prod.variations.length > 0) {
        setSelectedVariationId(prod.variations[0].id);
        if (prod.variations[0].additionalPrice) {
          setItemUnitPrice((prod.salePrice + prod.variations[0].additionalPrice).toString());
        }
      }
    } else {
      setItemUnitPrice('');
    }
  };

  const handleVariationSelect = (varId: string) => {
    setSelectedVariationId(varId);
    setError(null);
    if (selectedProduct) {
      const variation = selectedProduct.variations?.find((v) => v.id === varId);
      const basePrice = selectedProduct.salePrice;
      const finalPrice = basePrice + (variation?.additionalPrice || 0);
      setItemUnitPrice(finalPrice.toString());
    }
  };

  // Add item to cart with stock validation
  const handleAddToCart = () => {
    if (currentCompany?.status === 'parada') {
      setError(`Operação bloqueada: A empresa "${currentCompany.name}" está com status Parada. Não é possível vender produtos a partir deste armazém.`);
      return;
    }
    if (currentCompany?.status === 'desativada') {
      setError(`Operação bloqueada: A empresa "${currentCompany.name}" está desativada.`);
      return;
    }

    if (!selectedProduct) {
      setError('Selecione um artigo para adicionar.');
      return;
    }

    const price = parseFloat(itemUnitPrice);
    if (isNaN(price) || price < 0) {
      setError('Insira um preço unitário válido.');
      return;
    }

    if (itemQuantity <= 0) {
      setError('A quantidade deve ser pelo menos 1.');
      return;
    }

    // Check already in cart quantity for this exact product/variation
    const existingInCart = cart.find(
      (item) =>
        item.productId === selectedProductId &&
        (item.variationId || '') === (selectedVariationId || '')
    );
    const totalDesired = (existingInCart?.quantity || 0) + itemQuantity;

    if (totalDesired > availableStock) {
      setError(
        `Quantidade indisponível no armazém "${currentWarehouse?.name}". Estoque disponível: ${availableStock} un (Já no carrinho: ${
          existingInCart?.quantity || 0
        } un).`
      );
      return;
    }

    // Build variation details label if applicable
    let variationDetails: string | undefined;
    let variationSku: string | undefined;
    if (selectedVariationId && selectedProduct.variations) {
      const v = selectedProduct.variations.find((varItem) => varItem.id === selectedVariationId);
      if (v) {
        variationSku = v.sku;
        const details = [v.color ? `Cor: ${v.color}` : null, v.size ? `Tam: ${v.size}` : null]
          .filter(Boolean)
          .join(', ');
        variationDetails = details || v.sku;
      }
    }

    if (existingInCart) {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === selectedProductId &&
          (item.variationId || '') === (selectedVariationId || '')
            ? {
                ...item,
                quantity: totalDesired,
                unitPrice: price,
                subtotal: totalDesired * price,
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSku: selectedProduct.sku,
          variationId: selectedVariationId || undefined,
          variationSku,
          variationDetails,
          quantity: itemQuantity,
          unitPrice: price,
          subtotal: itemQuantity * price,
        },
      ]);
    }

    // Reset inputs for next item
    setSelectedProductId('');
    setSelectedVariationId('');
    setItemQuantity(1);
    setItemUnitPrice('');
    setError(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Cart Totals
  const subtotalProducts = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const numTransportCost = useMemo(() => {
    return requiresTransport ? parseFloat(transportCost) || 0 : 0;
  }, [requiresTransport, transportCost]);

  const totalSale = subtotalProducts + numTransportCost;

  // Complete Sale execution
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCompany?.status === 'parada') {
      setError(`Operação bloqueada: A empresa "${currentCompany.name}" está com status Parada. Não é possível realizar vendas ou faturar a partir dos seus armazéns.`);
      return;
    }

    if (currentCompany?.status === 'desativada') {
      setError(`Operação bloqueada: A empresa "${currentCompany.name}" está desativada.`);
      return;
    }

    if (cart.length === 0) {
      setError('O carrinho está vazio. Adicione pelo menos um produto antes de vender.');
      return;
    }

    if (!selectedBankId) {
      setError(
        `Nenhuma conta bancária ativa em ${currency} encontrada para a empresa "${currentCompany?.name || ''}". Verifique as contas no módulo Financeiro.`
      );
      return;
    }

    const chosenBank = banks.find((b) => b.id === selectedBankId);
    const chosenBankComp = chosenBank ? getCompanyForBank(chosenBank.id) : undefined;
    const isChosenBankActive = chosenBank?.status === 'ativo' || chosenBank?.status === 'ativa';

    if (!chosenBank || !isChosenBankActive) {
      setError('A conta bancária selecionada não está ativa.');
      return;
    }
    if (!chosenBankComp || chosenBankComp.id !== currentCompany?.id) {
      setError('A conta bancária selecionada deve pertencer à mesma empresa da venda.');
      return;
    }
    if ((chosenBank.currency || 'Kz') !== currency) {
      setError(`A conta bancária selecionada deve estar na mesma moeda da venda (${currency}).`);
      return;
    }

    if (requiresTransport && !deliveryAddress.trim()) {
      setError('O endereço de entrega é obrigatório para vendas com transporte.');
      return;
    }

    try {
      const chosenClient = clients.find((c) => c.id === selectedClientId);
      const finalClientName = chosenClient ? chosenClient.name : customClientName.trim() || undefined;

      const result = completeSale({
        warehouseId,
        bankId: selectedBankId,
        seller: seller.trim() || 'Administrador',
        clientId: selectedClientId || undefined,
        clientName: finalClientName,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          variationId: item.variationId,
          variationSku: item.variationSku,
          variationDetails: item.variationDetails,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        notes: notes.trim() || undefined,
        requiresTransport,
        transportDetails: requiresTransport
          ? {
              deliveryAddress: deliveryAddress.trim(),
              cost: numTransportCost,
              estimatedDeliveryDate: estimatedDeliveryDate || undefined,
              notes: transportNotes.trim() || undefined,
            }
          : undefined,
      });

      onSaleCompleted(result.sale, result.transport);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar a venda.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-new-sale-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-new-sale-card"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="modal-new-sale-title" className="text-base font-bold text-slate-900 leading-tight">
                Frente de Caixa • Nova Venda
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saída automática de estoque e lançamento contábil no banco vinculado
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-new-sale-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns on large screens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Bar: Warehouse Selector & Bank Link Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <WarehouseIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1 sm:w-64">
                <label htmlFor="sale-warehouse-select" className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                  Armazém de Saída
                </label>
                <select
                  id="sale-warehouse-select"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setCart([]); // Clear cart to re-validate stock for new warehouse
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {operationalWarehouses.map((w) => {
                    const comp = companies.find((c) => c.id === w.companyId);
                    const isParada = comp?.status === 'parada';
                    return (
                      <option key={w.id} value={w.id} disabled={isParada}>
                        {w.name} ({comp?.name || 'Empresa'}){isParada ? ' — [PARADA - Vendas Bloqueadas]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1 sm:w-72">
                <label htmlFor="sale-bank-select" className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                  Conta / Banco de Liquidação ({currentCompany?.name})
                </label>
                <select
                  id="sale-bank-select"
                  value={selectedBankId}
                  onChange={(e) => {
                    setSelectedBankId(e.target.value);
                    setError(null);
                  }}
                  disabled={currentCompany?.status === 'parada' || companyValidBanks.length === 0}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {companyValidBanks.length === 0 ? (
                    <option value="">Sem conta ativa em {currency} nesta empresa</option>
                  ) : (
                    companyValidBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.currency})
                        {b.id === currentCompany?.principalBankId ? ' • Principal' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {currentCompany?.status === 'parada' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Empresa Parada (Operações Bloqueadas)</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  A empresa &ldquo;{currentCompany.name}&rdquo; encontra-se temporariamente Parada. O histórico e os dados de estoque estão preservados para consulta, porém a emissão de vendas, faturamento e saída de mercadorias estão bloqueados.
                </p>
              </div>
            </div>
          )}

          {/* Section: Add Products to Cart */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Selecionar Artigos para Venda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Product Select */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Artigo / Produto
                </label>
                <select
                  id="sale-product-select"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Selecione um artigo do estoque...</option>
                  {operationalProducts.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.category}) • {formatCurrencyValue(prod.salePrice, currency)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variation Select if applicable */}
              {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0 && (
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Variação
                  </label>
                  <select
                    id="sale-variation-select"
                    value={selectedVariationId}
                    onChange={(e) => handleVariationSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {selectedProduct.variations.map((v) => {
                      const desc = [v.color, v.size].filter(Boolean).join(' / ') || v.sku;
                      return (
                        <option key={v.id} value={v.id}>
                          {desc} {v.additionalPrice ? `(+${formatCurrencyValue(v.additionalPrice, currency)})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div className={selectedProduct?.variations && selectedProduct.variations.length > 0 ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Qtd
                </label>
                <input
                  id="sale-item-qty-input"
                  type="number"
                  min="1"
                  max={availableStock > 0 ? availableStock : 1}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Unit Price */}
              <div className={selectedProduct?.variations && selectedProduct.variations.length > 0 ? 'sm:col-span-2' : 'sm:col-span-4'}>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Preço Unit. ({currency})
                </label>
                <div className="flex gap-2">
                  <input
                    id="sale-item-price-input"
                    type="number"
                    step="any"
                    value={itemUnitPrice}
                    onChange={(e) => setItemUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    id="btn-add-item-to-cart"
                    onClick={handleAddToCart}
                    disabled={!selectedProductId || availableStock <= 0}
                    className="dm-btn-primary px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-dm-text dark:text-dm-page disabled:bg-slate-200 dark:disabled:bg-dm-elevated text-white disabled:text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stock Availability indicator badge */}
            {selectedProduct && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  Estoque em tempo real ({currentWarehouse?.name}):
                </span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md ${
                    availableStock > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {availableStock > 0
                    ? `${availableStock} unidades disponíveis`
                    : 'Sem estoque disponível neste armazém'}
                </span>
              </div>
            )}
          </div>

          {/* Section: Cart Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Carrinho de Venda ({cart.length} {cart.length === 1 ? 'artigo' : 'artigos'})
              </span>
              <span className="text-xs font-bold text-slate-900">
                Subtotal: {formatCurrencyValue(subtotalProducts, currency)}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum produto adicionado ao carrinho ainda. Selecione um artigo acima e clique em "Adicionar".
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60">
                    <div className="flex-1 pr-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        {item.variationDetails && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {item.variationDetails}
                          </span>
                        )}
                        <span>
                          {item.quantity} x {formatCurrencyValue(item.unitPrice, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrencyValue(item.subtotal, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Remover do carrinho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Payment & Seller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Forma de Pagamento</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-payment-dinheiro"
                  onClick={() => setPaymentMethod('dinheiro')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    paymentMethod === 'dinheiro'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Numerário / Dinheiro
                </button>

                <button
                  type="button"
                  id="btn-payment-tpa"
                  onClick={() => setPaymentMethod('tpa')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    paymentMethod === 'tpa'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Multicaixa
                </button>

                <button
                  type="button"
                  id="btn-payment-transferencia"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    paymentMethod === 'transferencia'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Transferência Bancária
                </button>

                <button
                  type="button"
                  id="btn-payment-prazo"
                  onClick={() => setPaymentMethod('a_prazo')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    paymentMethod === 'a_prazo'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  A Prazo / Conta Corrente
                </button>
              </div>

              <div>
                <label htmlFor="sale-notes-input" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Observações da Venda <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="sale-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: Cliente solicitou embalagem especial para presente"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Seller / Empregado & Transport Toggle */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>3. Cliente, Operador & Transporte</span>
              </h3>

              {/* Cliente Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="sale-client-select" className="text-[11px] font-medium text-slate-600">
                    Cliente
                  </label>
                  <span className="text-[10px] text-slate-400">Módulo Contactos</span>
                </div>
                <select
                  id="sale-client-select"
                  value={selectedClientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedClientId(cId);
                    if (cId) {
                      const found = clients.find((c) => c.id === cId);
                      if (found) {
                        setCustomClientName(found.name);
                        if (found.address && !deliveryAddress) {
                          setDeliveryAddress(found.address);
                        }
                      }
                    } else {
                      setCustomClientName('');
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 mb-1.5"
                >
                  <option value="">Consumidor Final (Não registado)</option>
                  {clients
                    .filter((c) => c.status === 'ativo')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - {c.type === 'empresa' ? 'Empresa' : 'Particular'}
                      </option>
                    ))}
                </select>

                {!selectedClientId && (
                  <input
                    id="sale-custom-client-input"
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    placeholder="Nome avulso do cliente (opcional)"
                    className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                )}
              </div>

              <div>
                <label htmlFor="sale-seller-input" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Vendedor Responsável
                </label>
                <input
                  id="sale-seller-input"
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="Administrador"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Integrado com o módulo Contactos / Funcionários.
                </p>
              </div>

              {/* Checkbox Transport Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id="checkbox-requires-transport"
                    type="checkbox"
                    checked={requiresTransport}
                    onChange={(e) => setRequiresTransport(e.target.checked)}
                    aria-label="Requer transporte ou entrega ao domicílio"
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>Requer Transporte / Entrega ao Domicílio?</span>
                  </div>
                </label>

                {requiresTransport && (
                  <div className="mt-3 p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2.5 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-900 mb-1">
                        Endereço de Entrega <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="transport-address-input"
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ex.: Rua Major Kanhangulo, Edifício Bengo nº 12, Luanda"
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-sky-900 mb-1">
                          Taxa de Transporte ({currency})
                        </label>
                        <input
                          id="transport-cost-input"
                          type="number"
                          min="0"
                          value={transportCost}
                          onChange={(e) => setTransportCost(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-sky-900 mb-1">
                          Previsão de Entrega
                        </label>
                        <input
                          id="transport-date-input"
                          type="date"
                          value={estimatedDeliveryDate}
                          onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar: Total & Finalizar Button */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Total da Operação
            </span>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrencyValue(totalSale, currency)}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {cart.length} {cart.length === 1 ? 'artigo' : 'artigos'}
              {requiresTransport
                ? ` • Artigos: ${formatCurrencyValue(subtotalProducts, currency)} + Transporte: ${formatCurrencyValue(numTransportCost, currency)}`
                : ''}
              {selectedBank ? ` • Conta: ${selectedBank.name}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-cancel-new-sale"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            {/* Highlighted 'Vender' button per user requirement */}
            <button
              type="button"
              id="btn-confirm-final-sale"
              onClick={handleSubmitSale}
              disabled={cart.length === 0 || currentCompany?.status === 'parada' || currentCompany?.status === 'desativada'}
              className="dm-btn-primary flex-1 sm:flex-initial px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-dm-text dark:hover:bg-white dark:text-dm-page disabled:bg-slate-300 dark:disabled:bg-dm-elevated text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar Venda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
