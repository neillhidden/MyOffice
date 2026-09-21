// Currency formatting for Angolan Kwanza (AOA / Kz)

export const USD_TO_KZ_RATE = 925; // standard market reference rate

export function formatKwanza(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0,00 Kz';
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace('AOA', 'Kz')
    .trim();
}

export function formatUSD(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formata valores monetários com notação decimal portuguesa (vírgula decimal)
 * e código da moeda à direita, por exemplo: "2,50 USD", "1 160,00 USD", "72,00 CNY".
 */
export function formatForeignCurrency(value: number, currency: string = 'USD'): string {
  if (isNaN(value) || value === null || value === undefined) {
    return `0,00 ${currency}`;
  }
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

export function formatCurrencyValue(value: number, currency: string = 'Kz'): string {
  if (isNaN(value) || value === null || value === undefined) {
    return `0,00 ${currency}`;
  }
  const curr = currency.trim();
  if (curr.toUpperCase() === 'USD' || curr === '$') {
    return formatUSD(value);
  }
  if (curr.toUpperCase() === 'EUR' || curr === '€') {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  }
  // Default Kwanza (Kz)
  return formatKwanza(value);
}

export function convertToKwanza(
  amountInCurrency: number,
  currency: string = 'KZ',
  customRate?: number
): number {
  const norm = currency.toUpperCase().trim();
  if (norm === 'KZ' || norm === 'Kwanza' || norm === 'AOA') return amountInCurrency;
  if (norm === 'USD') return amountInCurrency * (customRate || USD_TO_KZ_RATE);
  if (norm === 'EUR') return amountInCurrency * (customRate || 1010);
  if (norm === 'CNY') return amountInCurrency * (customRate || 128);
  return amountInCurrency;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function generateSKU(productName: string, category: string): string {
  const catPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
  const namePrefix = productName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${catPrefix}-${namePrefix}-${randomNum}`;
}
