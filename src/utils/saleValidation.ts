import type { Product } from '../types/stock';

export function validateSaleItem(
  item: { productId: string; variationId?: string; quantity: number; unitPrice: number },
  products: Product[],
): void {
  const product = products.find((p) => p.id === item.productId);
  if (!product || product.status !== 'ativo') throw new Error('Selecione um produto ativo válido.');
  if (item.variationId && !product.variations.some((v) => v.id === item.variationId)) {
    throw new Error(`Variação inválida para "${product.name}".`);
  }
  if (!item.variationId && product.variations.length > 0) {
    throw new Error(`Selecione uma variação para "${product.name}".`);
  }
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    throw new Error('A quantidade de venda deve ser um número válido superior a zero.');
  }
  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
    throw new Error('O preço de venda deve ser um número válido igual ou superior a zero.');
  }
  if (!Number.isFinite(item.quantity * item.unitPrice)) {
    throw new Error('O subtotal do item excede o limite permitido.');
  }
}
