import type { ProductVariation } from '../types/stock';

export function validateProductPrices(product: {
  costPrice?: number | string | null;
  salePrice?: number | string | null;
  variations?: Array<Partial<ProductVariation>>;
}): void {
  if (product.costPrice !== undefined && product.costPrice !== null) {
    if (typeof product.costPrice === 'string' && product.costPrice.trim() === '') {
      throw new Error('O preço de custo não aceita valores vazios inválidos.');
    }
    const num = typeof product.costPrice === 'number' ? product.costPrice : Number(product.costPrice);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error('O preço de custo deve ser um número válido maior ou igual a zero.');
    }
  }
  if (product.salePrice !== undefined && product.salePrice !== null) {
    if (typeof product.salePrice === 'string' && product.salePrice.trim() === '') {
      throw new Error('O preço de venda não aceita valores vazios inválidos.');
    }
    const num = typeof product.salePrice === 'number' ? product.salePrice : Number(product.salePrice);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error('O preço de venda deve ser um número válido maior ou igual a zero.');
    }
  }
  if (product.variations) {
    for (let i = 0; i < product.variations.length; i++) {
      const v = product.variations[i];
      if (v.additionalPrice !== undefined && v.additionalPrice !== null) {
        if (typeof v.additionalPrice === 'string' && (v.additionalPrice as string).trim() === '') {
          throw new Error(`O acréscimo de preço da variação #${i + 1} não aceita valores vazios inválidos.`);
        }
        const num = typeof v.additionalPrice === 'number' ? v.additionalPrice : Number(v.additionalPrice);
        if (!Number.isFinite(num) || num < 0) {
          throw new Error(`O acréscimo de preço da variação #${i + 1} deve ser maior ou igual a zero.`);
        }
      }
    }
  }
}

export function isValidNonNegativeNumber(val: unknown, allowZero = true): boolean {
  if (val === '' || val === null || val === undefined) return false;
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

