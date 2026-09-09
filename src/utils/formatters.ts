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

export function convertToKwanza(amountInCurrency: number, currency: 'USD' | 'EUR' | 'CNY' | 'KZ', customRate?: number): number {
  if (currency === 'KZ') return amountInCurrency;
  if (currency === 'USD') return amountInCurrency * (customRate || USD_TO_KZ_RATE);
  if (currency === 'EUR') return amountInCurrency * (customRate || 1010);
  if (currency === 'CNY') return amountInCurrency * (customRate || 128);
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
