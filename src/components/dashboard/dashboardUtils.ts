import { Sale, Warehouse, Company, Product } from '../../types/stock';
import { formatCurrencyValue, formatKwanza } from '../../utils/formatters';

export type DashboardPeriod = 'semana' | 'mes' | 'ano';

export interface ChartDataPoint {
  label: string;
  tooltipLabel: string;
  currentValue: number;
  previousValue: number;
  currentSalesCount: number;
  previousSalesCount: number;
}

export interface PeriodMetrics {
  currentTotal: number;
  previousTotal: number;
  currentCount: number;
  previousCount: number;
  currentAverageTicket: number;
  previousAverageTicket: number;
  totalChangePercent: number | null;
  countChangePercent: number | null;
  ticketChangePercent: number | null;
  currency: string;
  isMultiCurrency: boolean;
  currencyTotals?: Record<string, { current: number; previous: number; count: number }>;
}

export interface TopProductItem {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  totalRevenue: number;
  percentageOfTotal: number;
  currency: string;
}

/**
 * Normalizes date string to YYYY-MM-DD using local calendar values
 */
export function toISODateOnly(date: Date | string): string {
  if (typeof date === 'string') {
    if (date.length >= 10 && date[4] === '-' && date[7] === '-') {
      return date.slice(0, 10);
    }
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Helper to compute percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Filter sales by company and status.
 * - Empresa Desativada: excluída por completo (histórico e novos dados ignorados)
 * - Empresa Parada: histórico de vendas passadas continua a entrar nos totais e gráficos
 * - "todas": agrega empresas Ativas e Paradas (nunca Desativadas)
 */
export function filterSalesByCompany(
  sales: Sale[],
  companyId: string,
  warehouses: Warehouse[],
  companies: Company[]
): Sale[] {
  // Set of non-disabled companies (ativas and paradas are allowed, desativadas are completely excluded)
  const nonDisabledCompanyIds = new Set(
    companies.filter((c) => c.status !== 'desativada').map((c) => c.id)
  );

  // Armazéns pertencentes a empresas não desativadas
  const nonDisabledWarehouseIds = new Set(
    warehouses.filter((w) => nonDisabledCompanyIds.has(w.companyId)).map((w) => w.id)
  );

  if (companyId === 'todas') {
    return sales.filter(
      (s) => s.status === 'concluida' && nonDisabledWarehouseIds.has(s.warehouseId)
    );
  }

  // Se uma empresa específica for selecionada: se for desativada ou inexistente, retorna vazio
  if (!nonDisabledCompanyIds.has(companyId)) {
    return [];
  }

  const companyWarehouseIds = new Set(
    warehouses.filter((w) => w.companyId === companyId).map((w) => w.id)
  );

  return sales.filter((s) => s.status === 'concluida' && companyWarehouseIds.has(s.warehouseId));
}

/**
 * Detect currencies in sales (excluding sales from disabled companies)
 */
export function getSalesCurrencies(
  sales: Sale[],
  warehouses: Warehouse[],
  companies: Company[]
): string[] {
  const nonDisabledCompanyIds = new Set(
    companies.filter((c) => c.status !== 'desativada').map((c) => c.id)
  );
  const currencies = new Set<string>();
  sales.forEach((s) => {
    const wh = warehouses.find((w) => w.id === s.warehouseId);
    if (wh && nonDisabledCompanyIds.has(wh.companyId)) {
      const comp = companies.find((c) => c.id === wh.companyId);
      if (comp?.currency) {
        currencies.add(comp.currency);
      }
    }
  });
  return Array.from(currencies);
}

/**
 * Generate chart comparison data and period metrics
 */
export function computeDashboardData({
  sales,
  period,
  selectedCompanyId,
  selectedCurrency,
  warehouses,
  companies,
  referenceDate = new Date(),
}: {
  sales: Sale[];
  period: DashboardPeriod;
  selectedCompanyId: string;
  selectedCurrency?: string;
  warehouses: Warehouse[];
  companies: Company[];
  referenceDate?: Date;
}): {
  chartData: ChartDataPoint[];
  metrics: PeriodMetrics;
  periodLabel: string;
  currentPeriodRangeDescription: string;
  previousPeriodRangeDescription: string;
} {
  // 1. Filter sales by company and status
  const validSales = filterSalesByCompany(sales, selectedCompanyId, warehouses, companies);

  // 2. Map sales with their company currency
  const salesWithCurrency = validSales.map((s) => {
    const wh = warehouses.find((w) => w.id === s.warehouseId);
    const comp = companies.find((c) => c.id === wh?.companyId);
    return {
      ...s,
      currency: comp?.currency || 'Kz',
      dateObj: new Date(s.date),
      dateStr: toISODateOnly(s.date),
    };
  });

  // Check currencies
  const distinctCurrencies = Array.from(new Set(salesWithCurrency.map((s) => s.currency)));
  const isMultiCurrency = selectedCompanyId === 'todas' && distinctCurrencies.length > 1;
  const activeCurrency = selectedCurrency || (distinctCurrencies[0] || 'Kz');

  // Filter by currency if multi-currency exists
  const targetSales = isMultiCurrency
    ? salesWithCurrency.filter((s) => s.currency === activeCurrency)
    : salesWithCurrency;

  // 3. Compute ranges based on period
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  let chartData: ChartDataPoint[] = [];
  let currentTotal = 0;
  let previousTotal = 0;
  let currentCount = 0;
  let previousCount = 0;
  let periodLabel = '';
  let currentPeriodRangeDescription = '';
  let previousPeriodRangeDescription = '';

  if (period === 'semana') {
    // Current week: Monday to Sunday
    const dayOfWeek = ref.getDay(); // 0 = Sun, 1 = Mon ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(ref);
    currentMonday.setDate(ref.getDate() - daysFromMonday);

    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(currentMonday.getDate() - 7);

    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);

    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);

    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const shortDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const formatShort = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    currentPeriodRangeDescription = `Semana Atual (${formatShort(currentMonday)} a ${formatShort(currentSunday)})`;
    previousPeriodRangeDescription = `Semana Anterior (${formatShort(prevMonday)} a ${formatShort(prevSunday)})`;
    periodLabel = 'Semana';

    // Map 7 days
    for (let i = 0; i < 7; i++) {
      const cDate = new Date(currentMonday);
      cDate.setDate(currentMonday.getDate() + i);
      const cStr = toISODateOnly(cDate);

      const pDate = new Date(prevMonday);
      pDate.setDate(prevMonday.getDate() + i);
      const pStr = toISODateOnly(pDate);

      const cDaySales = targetSales.filter((s) => s.dateStr === cStr);
      const pDaySales = targetSales.filter((s) => s.dateStr === pStr);

      const cVal = cDaySales.reduce((acc, s) => acc + s.total, 0);
      const pVal = pDaySales.reduce((acc, s) => acc + s.total, 0);

      currentTotal += cVal;
      previousTotal += pVal;
      currentCount += cDaySales.length;
      previousCount += pDaySales.length;

      chartData.push({
        label: shortDays[i],
        tooltipLabel: `${dayNames[i]} (${formatShort(cDate)})`,
        currentValue: cVal,
        previousValue: pVal,
        currentSalesCount: cDaySales.length,
        previousSalesCount: pDaySales.length,
      });
    }
  } else if (period === 'mes') {
    // Current month vs Previous month
    const curYear = ref.getFullYear();
    const curMonth = ref.getMonth();

    const prevYear = curMonth === 0 ? curYear - 1 : curYear;
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;

    const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const maxDays = Math.max(daysInCurMonth, daysInPrevMonth);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    currentPeriodRangeDescription = `${monthNames[curMonth]} ${curYear}`;
    previousPeriodRangeDescription = `${monthNames[prevMonth]} ${prevYear}`;
    periodLabel = 'Mês';

    for (let d = 1; d <= maxDays; d++) {
      const dayPad = String(d).padStart(2, '0');
      const curMonthPad = String(curMonth + 1).padStart(2, '0');
      const prevMonthPad = String(prevMonth + 1).padStart(2, '0');

      const cStr = `${curYear}-${curMonthPad}-${dayPad}`;
      const pStr = `${prevYear}-${prevMonthPad}-${dayPad}`;

      const cDaySales = d <= daysInCurMonth ? targetSales.filter((s) => s.dateStr === cStr) : [];
      const pDaySales = d <= daysInPrevMonth ? targetSales.filter((s) => s.dateStr === pStr) : [];

      const cVal = cDaySales.reduce((acc, s) => acc + s.total, 0);
      const pVal = pDaySales.reduce((acc, s) => acc + s.total, 0);

      currentTotal += cVal;
      previousTotal += pVal;
      currentCount += cDaySales.length;
      previousCount += pDaySales.length;

      chartData.push({
        label: `${d}`,
        tooltipLabel: `Dia ${d} de ${monthNames[curMonth]}`,
        currentValue: cVal,
        previousValue: pVal,
        currentSalesCount: cDaySales.length,
        previousSalesCount: pDaySales.length,
      });
    }
  } else {
    // Year: 12 months
    const curYear = ref.getFullYear();
    const prevYear = curYear - 1;

    const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fullMonths = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    currentPeriodRangeDescription = `Ano ${curYear}`;
    previousPeriodRangeDescription = `Ano ${prevYear}`;
    periodLabel = 'Ano';

    for (let m = 0; m < 12; m++) {
      const mPad = String(m + 1).padStart(2, '0');
      const cPrefix = `${curYear}-${mPad}`;
      const pPrefix = `${prevYear}-${mPad}`;

      const cMonthSales = targetSales.filter((s) => s.dateStr.startsWith(cPrefix));
      const pMonthSales = targetSales.filter((s) => s.dateStr.startsWith(pPrefix));

      const cVal = cMonthSales.reduce((acc, s) => acc + s.total, 0);
      const pVal = pMonthSales.reduce((acc, s) => acc + s.total, 0);

      currentTotal += cVal;
      previousTotal += pVal;
      currentCount += cMonthSales.length;
      previousCount += pMonthSales.length;

      chartData.push({
        label: shortMonths[m],
        tooltipLabel: `${fullMonths[m]} (${curYear} vs. ${prevYear})`,
        currentValue: cVal,
        previousValue: pVal,
        currentSalesCount: cMonthSales.length,
        previousSalesCount: pMonthSales.length,
      });
    }
  }

  // Averages & Changes
  const currentAverageTicket = currentCount > 0 ? currentTotal / currentCount : 0;
  const previousAverageTicket = previousCount > 0 ? previousTotal / previousCount : 0;

  const totalChangePercent = calculatePercentageChange(currentTotal, previousTotal);
  const countChangePercent = calculatePercentageChange(currentCount, previousCount);
  const ticketChangePercent = calculatePercentageChange(currentAverageTicket, previousAverageTicket);

  // Multi-currency breakdown if applicable
  const currencyTotals: Record<string, { current: number; previous: number; count: number }> = {};
  if (isMultiCurrency) {
    distinctCurrencies.forEach((curr) => {
      const currSales = salesWithCurrency.filter((s) => s.currency === curr);
      // We can compute current period sales for each currency
      let currTotal = 0;
      let prevTotal = 0;
      let cCount = 0;

      if (period === 'semana') {
        const dayOfWeek = ref.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(ref);
        currentMonday.setDate(ref.getDate() - daysFromMonday);
        const prevMonday = new Date(currentMonday);
        prevMonday.setDate(currentMonday.getDate() - 7);

        for (let i = 0; i < 7; i++) {
          const cDate = new Date(currentMonday);
          cDate.setDate(currentMonday.getDate() + i);
          const cStr = toISODateOnly(cDate);
          const pDate = new Date(prevMonday);
          pDate.setDate(prevMonday.getDate() + i);
          const pStr = toISODateOnly(pDate);

          const cSales = currSales.filter((s) => s.dateStr === cStr);
          const pSales = currSales.filter((s) => s.dateStr === pStr);
          currTotal += cSales.reduce((a, s) => a + s.total, 0);
          prevTotal += pSales.reduce((a, s) => a + s.total, 0);
          cCount += cSales.length;
        }
      } else if (period === 'mes') {
        const curYear = ref.getFullYear();
        const curMonth = ref.getMonth();
        const prevYear = curMonth === 0 ? curYear - 1 : curYear;
        const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
        const cPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
        const pPrefix = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

        const cSales = currSales.filter((s) => s.dateStr.startsWith(cPrefix));
        const pSales = currSales.filter((s) => s.dateStr.startsWith(pPrefix));
        currTotal = cSales.reduce((a, s) => a + s.total, 0);
        prevTotal = pSales.reduce((a, s) => a + s.total, 0);
        cCount = cSales.length;
      } else {
        const curYear = String(ref.getFullYear());
        const prevYear = String(ref.getFullYear() - 1);
        const cSales = currSales.filter((s) => s.dateStr.startsWith(curYear));
        const pSales = currSales.filter((s) => s.dateStr.startsWith(prevYear));
        currTotal = cSales.reduce((a, s) => a + s.total, 0);
        prevTotal = pSales.reduce((a, s) => a + s.total, 0);
        cCount = cSales.length;
      }

      currencyTotals[curr] = { current: currTotal, previous: prevTotal, count: cCount };
    });
  }

  return {
    chartData,
    metrics: {
      currentTotal,
      previousTotal,
      currentCount,
      previousCount,
      currentAverageTicket,
      previousAverageTicket,
      totalChangePercent,
      countChangePercent,
      ticketChangePercent,
      currency: activeCurrency,
      isMultiCurrency,
      currencyTotals,
    },
    periodLabel,
    currentPeriodRangeDescription,
    previousPeriodRangeDescription,
  };
}

/**
 * Compute Top Selling Products in the selected period and company
 */
export function computeTopProducts({
  sales,
  period,
  selectedCompanyId,
  selectedCurrency,
  warehouses,
  companies,
  products,
  referenceDate = new Date(),
  limit = 8,
}: {
  sales: Sale[];
  period: DashboardPeriod;
  selectedCompanyId: string;
  selectedCurrency?: string;
  warehouses: Warehouse[];
  companies: Company[];
  products: Product[];
  referenceDate?: Date;
  limit?: number;
}): TopProductItem[] {
  const validSales = filterSalesByCompany(sales, selectedCompanyId, warehouses, companies);

  // Map sales with currency & dateStr
  const salesWithCurrency = validSales.map((s) => {
    const wh = warehouses.find((w) => w.id === s.warehouseId);
    const comp = companies.find((c) => c.id === wh?.companyId);
    return {
      ...s,
      currency: comp?.currency || 'Kz',
      dateStr: toISODateOnly(s.date),
    };
  });

  const distinctCurrencies = Array.from(new Set(salesWithCurrency.map((s) => s.currency)));
  const isMultiCurrency = selectedCompanyId === 'todas' && distinctCurrencies.length > 1;
  const activeCurrency = selectedCurrency || (distinctCurrencies[0] || 'Kz');

  const targetSales = isMultiCurrency
    ? salesWithCurrency.filter((s) => s.currency === activeCurrency)
    : salesWithCurrency;

  // Filter sales that fall in the CURRENT period
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  let currentPeriodSales: typeof targetSales = [];

  if (period === 'semana') {
    const dayOfWeek = ref.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(ref);
    currentMonday.setDate(ref.getDate() - daysFromMonday);
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);

    const startStr = toISODateOnly(currentMonday);
    const endStr = toISODateOnly(currentSunday);

    currentPeriodSales = targetSales.filter((s) => s.dateStr >= startStr && s.dateStr <= endStr);
  } else if (period === 'mes') {
    const curYear = ref.getFullYear();
    const curMonthPad = String(ref.getMonth() + 1).padStart(2, '0');
    const prefix = `${curYear}-${curMonthPad}`;
    currentPeriodSales = targetSales.filter((s) => s.dateStr.startsWith(prefix));
  } else {
    const curYear = String(ref.getFullYear());
    currentPeriodSales = targetSales.filter((s) => s.dateStr.startsWith(curYear));
  }

  // Aggregate by product
  const productAgg: Record<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      category: string;
      quantity: number;
      totalRevenue: number;
    }
  > = {};

  let totalPeriodRevenue = 0;

  currentPeriodSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const prodId = item.productId;
      const matchedProd = products.find((p) => p.id === prodId);
      const name = item.productName || matchedProd?.name || 'Produto sem nome';
      const sku = item.productSku || matchedProd?.sku || 'SEM-SKU';
      const category = matchedProd?.category || 'Geral';
      const subtotal = item.subtotal || item.quantity * item.unitPrice;

      totalPeriodRevenue += subtotal;

      if (!productAgg[prodId]) {
        productAgg[prodId] = {
          productId: prodId,
          name,
          sku,
          category,
          quantity: 0,
          totalRevenue: 0,
        };
      }

      productAgg[prodId].quantity += item.quantity;
      productAgg[prodId].totalRevenue += subtotal;
    });
  });

  const sortedList = Object.values(productAgg)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      percentageOfTotal: totalPeriodRevenue > 0 ? (item.totalRevenue / totalPeriodRevenue) * 100 : 0,
      currency: activeCurrency,
    }));

  return sortedList;
}
