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
  const [dueDate, setDueDate] = useState<string>('');
  const [clientFieldError, setClientFieldError] = useState<string | null>(null);
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
      setDueDate('');
      setClientFieldError(null);
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

    const isCreditSale = paymentMethod === 'a_prazo';
    const chosenClient = clients.find((c) => c.id === selectedClientId);
    const finalClientName = chosenClient ? chosenClient.name : customClientName.trim() || undefined;

    setClientFieldError(null);
    if (isCreditSale) {
      const trimmedName = (finalClientName || '').trim().toLowerCase();
      const isGeneric =
        !finalClientName ||
        trimmedName === 'consumidor final' ||
        trimmedName === 'consumidor final (não registado)' ||
        trimmedName.includes('consumidor final');

      if (!selectedClientId && isGeneric) {
        setClientFieldError('Vendas a prazo exigem um cliente identificado. Não é permitido Consumidor final.');
        const clientEl = document.getElementById('sale-client-select') || document.getElementById('sale-custom-client-input');
        clientEl?.focus();
        return;
      }
    }

    if (!isCreditSale) {
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
    }

    if (requiresTransport && !deliveryAddress.trim()) {
      setError('O endereço de entrega é obrigatório para vendas com transporte.');
      return;
    }

    try {
      const result = completeSale({
        warehouseId,
        bankId: isCreditSale ? undefined : selectedBankId,
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
        dueDate: isCreditSale && dueDate ? dueDate : undefined,
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
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Bar: Warehouse Selector & Bank Link Information (Bloco 5.3: armazém e empresa em linha secundária sem truncar, rótulo 14px, valor 16px) */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Armazém de Saída */}
              <div>
                <label htmlFor="sale-warehouse-select" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5 flex items-center gap-1.5">
                  <WarehouseIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Armazém de Saída</span>
                </label>
                <select
                  id="sale-warehouse-select"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setCart([]); // Clear cart to re-validate stock for new warehouse
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base font-semibold text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                >
                  {operationalWarehouses.map((w) => {
                    const comp = companies.find((c) => c.id === w.companyId);
                    const isParada = comp?.status === 'parada';
                    return (
                      <option key={w.id} value={w.id} disabled={isParada}>
                        {w.name} — {comp?.name || 'Empresa'}{isParada ? ' [PARADA]' : ''}
                      </option>
                    );
                  })}
                </select>
                {/* Linha secundária do armazém: nome da empresa e estado sem truncar */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-dm-muted">
                  <span className="font-semibold text-slate-800 dark:text-dm-text">{currentWarehouse?.name}</span>
                  <span>·</span>
                  <span className="text-slate-600 dark:text-dm-muted">{currentCompany?.name}</span>
                  {currentCompany?.status === 'parada' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Parada (Bloqueada)
                    </span>
                  )}
                </div>
              </div>

              {/* Conta / Banco de Liquidação */}
              <div>
                <label htmlFor="sale-bank-select" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Conta / Banco de Liquidação</span>
                </label>
                <select
                  id="sale-bank-select"
                  value={selectedBankId}
                  onChange={(e) => {
                    setSelectedBankId(e.target.value);
                    setError(null);
                  }}
                  disabled={currentCompany?.status === 'parada' || companyValidBanks.length === 0}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base font-semibold text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer disabled:opacity-60"
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
                <div className="mt-1.5 text-xs text-slate-500 dark:text-dm-muted">
                  {selectedBank ? `Entrada direta na conta ${selectedBank.name} (${selectedBank.currency})` : 'Selecione a conta bancária'}
                </div>
              </div>
            </div>

            {currentCompany?.status === 'parada' && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Empresa Parada (Operações Bloqueadas)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    A empresa &ldquo;{currentCompany.name}&rdquo; encontra-se temporariamente Parada. O histórico e os dados de estoque estão preservados para consulta, porém a emissão de vendas, faturamento e saída de mercadorias estão bloqueados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Add Products to Cart (Divisória e 24px de espaço - Bloco 5.3) */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-dm-border space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-dm-text flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-600 dark:text-dm-muted" />
              <span>1. Artigos para Venda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Product Select */}
              <div className="sm:col-span-5">
                <label htmlFor="sale-product-select" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                  Artigo / Produto
                </label>
                <select
                  id="sale-product-select"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
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
                  <label htmlFor="sale-variation-select" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                    Variação
                  </label>
                  <select
                    id="sale-variation-select"
                    value={selectedVariationId}
                    onChange={(e) => handleVariationSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
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
                <label htmlFor="sale-item-qty-input" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                  Qtd
                </label>
                <input
                  id="sale-item-qty-input"
                  type="number"
                  min="1"
                  max={availableStock > 0 ? availableStock : 1}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Unit Price */}
              <div className={selectedProduct?.variations && selectedProduct.variations.length > 0 ? 'sm:col-span-2' : 'sm:col-span-4'}>
                <label htmlFor="sale-item-price-input" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
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
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="button"
                    id="btn-add-item-to-cart"
                    onClick={handleAddToCart}
                    disabled={!selectedProductId || availableStock <= 0}
                    className="dm-btn-primary min-h-[44px] h-11 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-dm-text dark:text-dm-page disabled:bg-slate-200 dark:disabled:bg-dm-elevated text-white disabled:text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stock Availability indicator badge */}
            {selectedProduct && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-dm-muted">
                  Estoque em tempo real ({currentWarehouse?.name}):
                </span>
                <span
                  className={`font-semibold px-2.5 py-1 rounded-md text-xs ${
                    availableStock > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  }`}
                >
                  {availableStock > 0
                    ? `${availableStock} unidades disponíveis`
                    : 'Sem estoque disponível neste armazém'}
                </span>
              </div>
            )}

            {/* Cart Items Table */}
            <div className="border border-slate-200 dark:border-dm-border rounded-xl overflow-hidden bg-white dark:bg-dm-surface">
              <div className="px-4 py-3 bg-slate-50 dark:bg-dm-elevated border-b border-slate-200 dark:border-dm-border flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-dm-text uppercase tracking-wider">
                  Carrinho de Venda ({cart.length} {cart.length === 1 ? 'artigo' : 'artigos'})
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-dm-text">
                  Subtotal: {formatCurrencyValue(subtotalProducts, currency)}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-dm-muted">
                  Nenhum produto adicionado ao carrinho ainda. Selecione um artigo acima e clique em &ldquo;Adicionar&rdquo;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-dm-border max-h-48 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-dm-elevated/40">
                      <div className="flex-1 pr-3">
                        <div className="text-sm font-semibold text-slate-900 dark:text-dm-text">{item.productName}</div>
                        <div className="text-xs text-slate-500 dark:text-dm-muted flex items-center gap-3 mt-0.5">
                          {item.variationDetails && (
                            <span className="bg-slate-100 dark:bg-dm-elevated px-1.5 py-0.5 rounded text-slate-700 dark:text-dm-text">
                              {item.variationDetails}
                            </span>
                          )}
                          <span>
                            {item.quantity} x {formatCurrencyValue(item.unitPrice, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-dm-text whitespace-nowrap">
                          {formatCurrencyValue(item.subtotal, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remover do carrinho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Payment & Seller (Divisória e 24px de espaço - Bloco 5.3) */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-dm-border grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Forma de Pagamento */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-dm-text flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600 dark:text-dm-muted" />
                <span>2. Forma de Pagamento</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-payment-dinheiro"
                  onClick={() => setPaymentMethod('dinheiro')}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    paymentMethod === 'dinheiro'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated text-slate-700 dark:text-dm-text hover:bg-slate-100'
                  }`}
                >
                  Numerário / Dinheiro
                </button>

                <button
                  type="button"
                  id="btn-payment-tpa"
                  onClick={() => setPaymentMethod('tpa')}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    paymentMethod === 'tpa'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated text-slate-700 dark:text-dm-text hover:bg-slate-100'
                  }`}
                >
                  Multicaixa
                </button>

                <button
                  type="button"
                  id="btn-payment-transferencia"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    paymentMethod === 'transferencia'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated text-slate-700 dark:text-dm-text hover:bg-slate-100'
                  }`}
                >
                  Transferência Bancária
                </button>

                <button
                  type="button"
                  id="btn-payment-prazo"
                  onClick={() => setPaymentMethod('a_prazo')}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    paymentMethod === 'a_prazo'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 font-semibold'
                      : 'border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated text-slate-700 dark:text-dm-text hover:bg-slate-100'
                  }`}
                >
                  A Prazo / C. Corrente
                </button>
              </div>

              {paymentMethod === 'a_prazo' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-semibold block">Venda a Prazo / Conta Corrente</span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      Não gera entrada bancária imediata. Uma dívida a receber será registada no Financeiro em nome do cliente identificado.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="sale-notes-input" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                  Observações da Venda <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="sale-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: Cliente solicitou embalagem especial para presente"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            {/* Cliente, Operador & Transporte */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-dm-text flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600 dark:text-dm-muted" />
                <span>3. Cliente, Operador & Transporte</span>
              </h3>

              {/* Cliente Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="sale-client-select" className="text-sm font-medium text-slate-700 dark:text-dm-muted flex items-center gap-1.5">
                    <span>Cliente</span>
                    {paymentMethod === 'a_prazo' && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Obrigatório a prazo
                      </span>
                    )}
                  </label>
                  <span className="text-xs text-slate-400 dark:text-dm-muted">Módulo Contactos</span>
                </div>
                <select
                  id="sale-client-select"
                  value={selectedClientId}
                  onChange={(e) => {
                    setClientFieldError(null);
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
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border ${
                    clientFieldError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-dm-border'
                  } rounded-xl text-base text-slate-900 dark:text-dm-text font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 mb-2 cursor-pointer`}
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
                    onChange={(e) => {
                      setClientFieldError(null);
                      setCustomClientName(e.target.value);
                    }}
                    placeholder={
                      paymentMethod === 'a_prazo'
                        ? 'Nome do cliente obrigatório a prazo'
                        : 'Nome avulso do cliente (opcional)'
                    }
                    className={`w-full px-3.5 py-2 bg-white dark:bg-dm-elevated border ${
                      clientFieldError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-dm-border'
                    } rounded-xl text-base text-slate-700 dark:text-dm-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
                  />
                )}

                {clientFieldError && (
                  <p id="sale-client-error-msg" className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{clientFieldError}</span>
                  </p>
                )}

                {paymentMethod === 'a_prazo' && (
                  <div className="mt-3">
                    <label htmlFor="sale-due-date-input" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                      Data de Vencimento <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      id="sale-due-date-input"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="sale-seller-input" className="block text-sm font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                  Vendedor Responsável
                </label>
                <input
                  id="sale-seller-input"
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="Administrador"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl text-base text-slate-900 dark:text-dm-text font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Checkbox Transport Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-dm-border">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id="checkbox-requires-transport"
                    type="checkbox"
                    checked={requiresTransport}
                    onChange={(e) => setRequiresTransport(e.target.checked)}
                    aria-label="Requer transporte ou entrega ao domicílio"
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                  />
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-dm-text">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>Requer Transporte / Entrega ao Domicílio?</span>
                  </div>
                </label>

                {requiresTransport && (
                  <div className="mt-3 p-3.5 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900 space-y-3 animate-in fade-in">
                    <div>
                      <label htmlFor="transport-address-input" className="block text-sm font-semibold text-sky-900 dark:text-sky-200 mb-1">
                        Endereço de Entrega <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="transport-address-input"
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ex.: Rua Major Kanhangulo, Edifício Bengo nº 12, Luanda"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-dm-elevated border border-sky-200 dark:border-sky-800 rounded-xl text-base text-slate-900 dark:text-dm-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="transport-cost-input" className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                          Taxa de Transporte ({currency})
                        </label>
                        <input
                          id="transport-cost-input"
                          type="number"
                          min="0"
                          value={transportCost}
                          onChange={(e) => setTransportCost(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-dm-elevated border border-sky-200 dark:border-sky-800 rounded-xl text-base font-semibold font-mono text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-sky-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="transport-date-input" className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                          Previsão de Entrega
                        </label>
                        <input
                          id="transport-date-input"
                          type="date"
                          value={estimatedDeliveryDate}
                          onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-dm-elevated border border-sky-200 dark:border-sky-800 rounded-xl text-base text-slate-900 dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-sky-600"
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
