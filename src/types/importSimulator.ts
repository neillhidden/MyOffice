export type DataProvenance = 'informado' | 'estimativa';

export type CurrencyCode = 'AOA' | 'USD' | 'EUR' | 'CNY' | 'ZAR' | 'GBP' | 'BRL';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  shortLabel: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: 'AOA', symbol: 'Kz', label: 'Kz (AOA — Kwanza)', shortLabel: 'Kz' },
  { code: 'USD', symbol: 'US$', label: 'USD / Dólar Americano', shortLabel: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR / Euro', shortLabel: 'EUR' },
  { code: 'CNY', symbol: '¥', label: 'CNY / Yuan Chinês (RMB)', shortLabel: 'CNY' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR / Rand Sul-Africano', shortLabel: 'ZAR' },
  { code: 'GBP', symbol: '£', label: 'GBP / Libra Esterlina', shortLabel: 'GBP' },
  { code: 'BRL', symbol: 'R$', label: 'BRL / Real Brasileiro', shortLabel: 'BRL' },
];

export function getCurrencySymbol(code: CurrencyCode): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol || code;
}

export function getCurrencyDisplayCode(code: CurrencyCode): string {
  return code === 'AOA' ? 'Kz' : code;
}

export function formatOriginalCurrency(
  amount: number | null | undefined,
  currency: CurrencyCode
): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return 'Não informado';
  }
  if (currency === 'AOA') {
    return `${Math.round(amount).toLocaleString('pt-AO')} Kz`;
  }
  const sym = getCurrencySymbol(currency);
  return `${sym} ${amount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} (${currency})`;
}

/**
 * Estrutura interna obrigatória para valores monetários:
 * Guarda sempre valor original + moeda original + câmbio utilizado + valor convertido na moeda-base.
 */
export interface MonetaryRecord {
  amount: number | null;
  currency: CurrencyCode;
  exchangeRate: number | null;
  baseAmount: number | null;
}

export function resolveExchangeRate(
  originCurrency: CurrencyCode,
  baseCurrency: CurrencyCode,
  exchangeRates: Record<CurrencyCode, number | null>,
  fallbackUsdRate?: number | null
): number | null {
  if (originCurrency === baseCurrency) return 1;
  const configured = exchangeRates?.[originCurrency];
  if (configured !== undefined && configured !== null && configured > 0) {
    return configured;
  }
  if (originCurrency === 'USD' && fallbackUsdRate && fallbackUsdRate > 0) {
    return fallbackUsdRate;
  }
  return null;
}

export function createMonetaryRecord(
  amount: number | null | undefined,
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
  exchangeRates: Record<CurrencyCode, number | null>,
  fallbackUsdRate?: number | null
): MonetaryRecord {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    const rate = resolveExchangeRate(currency, baseCurrency, exchangeRates, fallbackUsdRate);
    return {
      amount: null,
      currency,
      exchangeRate: rate,
      baseAmount: null,
    };
  }
  if (currency === baseCurrency) {
    return {
      amount,
      currency,
      exchangeRate: 1,
      baseAmount: amount,
    };
  }
  const rate = resolveExchangeRate(currency, baseCurrency, exchangeRates, fallbackUsdRate);
  return {
    amount,
    currency,
    exchangeRate: rate,
    baseAmount: rate !== null && rate > 0 ? amount * rate : null,
  };
}

export type TransportMethod = 'aereo_kg' | 'maritimo' | 'custo_fixo' | 'personalizado';

export type ChargeableWeightRule = 'real' | 'volumetrico' | 'maior';

export type PricingMode = 'preco_venda' | 'margem_desejada' | 'markup_desejado';

export type RoundingMode = 'inteiro' | 'duas_casas' | 'multiplo_50' | 'multiplo_100';

/**
 * Configuração da Base Tributável para Impostos Percentuais:
 * [x] Mercadoria  [x] Frete  [ ] Seguro  [ ] Outros custos
 */
export interface TaxableBaseConfig {
  includeMerchandise: boolean;
  includeFreight: boolean;
  includeInsurance: boolean;
  includeOtherCosts: boolean;
}

export interface TaxConfigItem {
  id: string;
  name: string;
  enabled: boolean;
  type: 'percent' | 'fixed_amount';
  currency: CurrencyCode; // Para valores fixos (ex: Seguro em USD, Taxa Fornecedor em CNY, Taxa Local em AOA)
  value: number | null;
  provenance: DataProvenance;
}

export interface CommercialExpenseItem {
  id: string;
  name: string;
  enabled: boolean;
  type: 'fixed_total_kz' | 'fixed_unit_kz' | 'percent_revenue';
  currency?: CurrencyCode;
  value: number | null;
  provenance: DataProvenance;
}

export interface PriceScenarioItem {
  id: string;
  label: string;
  description: string;
  salePriceKz: number | null;
  isCustom: boolean;
}

export interface ClassificationThresholds {
  goodMarginMinPercent: number;
  goodRoiMinPercent: number;
  tightMarginMinPercent: number;
  tightRoiMinPercent: number;
}

export interface ImportSimulation {
  id: string;
  createdAt: string;
  updatedAt: string;
  overallProvenance: DataProvenance;

  // 1. Configuração Multimoeda
  purchaseCurrency: CurrencyCode; // Moeda de compra da mercadoria (USD, EUR, CNY, ZAR, AOA...)
  baseCurrency: CurrencyCode; // Moeda-base da operação (Padrão: AOA / Kz)
  exchangeRates: Record<CurrencyCode, number | null>; // Taxa de conversão de cada moeda para a moeda-base
  exchangeRateUsdToKz: number | null; // Mantido sincronizado com exchangeRates[purchaseCurrency] para compatibilidade
  exchangeProvenance: DataProvenance;

  // 1. Dados do Produto
  productName: string;
  supplierName: string;
  unitPriceUsd: number | null; // Valor unitário na moeda de compra (purchaseCurrency)
  unitPriceProvenance: DataProvenance;
  moq: number | null;
  desiredQuantity: number | null;
  grossWeightPerUnitKg: number | null;
  weightProvenance: DataProvenance;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;

  // 3. Transporte Internacional Multimoeda
  transportMethod: TransportMethod;
  freightCurrency: CurrencyCode; // Moeda em que o frete foi cobrado (USD, EUR, CNY, AOA...)
  freightRatePerKgKz: number | null; // Preço por kg na moeda do frete (freightCurrency)
  fixedFreightCostKz: number | null; // Custo total do frete na moeda do frete (freightCurrency)
  freightProvenance: DataProvenance;
  volumetricDivisor: number;
  chargeableWeightRule: ChargeableWeightRule;

  // 4 & 5. Base Tributável + Impostos e Taxas
  taxableBaseConfig: TaxableBaseConfig;
  taxes: TaxConfigItem[];

  // 5. Despesas Comerciais (Separadas do custo de aquisição do stock)
  commercialExpenses: CommercialExpenseItem[];

  // 6. Orçamento (na moeda-base)
  availableBudgetKz: number | null;

  // 8. Precificação
  pricingMode: PricingMode;
  simulatedSalePriceKz: number | null;
  targetMarginPercent: number | null;
  targetMarkupPercent: number | null;
  costBasisForPricing: 'completo' | 'posto';

  // 9. Cenários de Preço
  priceScenarios: PriceScenarioItem[];

  // 15. Configuração de Arredondamento
  roundingMode: RoundingMode;
}

export interface SimulationComputedMetrics {
  // Validação de preenchimento
  hasProductPrice: boolean;
  hasExchangeRate: boolean;
  hasQuantity: boolean;
  hasTransportInfo: boolean;
  hasBudget: boolean;
  hasSalePrice: boolean;
  isBelowMoq: boolean;

  // Registos Monetários Estruturados (Original + Câmbio + Base)
  unitProductMonetary: MonetaryRecord;
  merchandiseMonetary: MonetaryRecord;
  freightRatePerKgMonetary: MonetaryRecord;
  freightTotalMonetary: MonetaryRecord;

  // 1 & 2. Mercadoria e Câmbio
  unitPriceKz: number | null;
  merchandiseTotalOriginal: number | null;
  merchandiseTotalUsd: number | null;
  merchandiseTotalKz: number | null;

  // 3. Transporte e Pesos
  totalRealWeightKg: number | null;
  unitVolumetricWeightKg: number | null;
  totalVolumetricWeightKg: number | null;
  chargeableWeightTotalKg: number | null;
  freightOriginalTotal: number | null;
  freightExchangeRateUsed: number | null;
  freightTotalKz: number | null;

  // 4 & 5. Base Tributável, Impostos e Taxas Consolidados na Moeda-Base
  taxableValueKz: number; // Valor tributável conforme checkboxes
  impostosTotalKz: number;
  taxasAduaneirasLogisticaKz: number;
  taxesBreakdown: {
    id: string;
    name: string;
    enabled: boolean;
    type: 'percent' | 'fixed_amount';
    monetary: MonetaryRecord;
    amountKz: number;
    provenance: DataProvenance;
    isImposto: boolean;
  }[];

  // Custo Posto em Armazém (Landed Cost)
  landedCostTotalKz: number | null;
  landedCostUnitKz: number | null;

  // Despesas Comerciais
  commercialFixedBatchKz: number;
  commercialFixedUnitKz: number;
  commercialFixedTotalKz: number;
  commercialPercentTotalRate: number;
  commercialVariableTotalKz: number;
  commercialExpensesTotalKz: number;
  commercialExpenseUnitKz: number;
  commercialBreakdown: {
    id: string;
    name: string;
    enabled: boolean;
    type: CommercialExpenseItem['type'];
    monetary: MonetaryRecord;
    totalBaseKz: number;
  }[];

  // 7. Custo Completo
  fullCostTotalKz: number | null;
  fullCostUnitKz: number | null;

  // 6. Orçamento
  maxUnitsByLandedCost: number | null;
  maxUnitsByFullCost: number | null;
  budgetUsedKz: number | null;
  remainingCapitalKz: number | null;
  fitsInBudget: boolean | null;
  budgetExceededByKz: number | null;
  recommendedQuantityForBudget: number | null;

  // 8. Precificação
  effectiveSalePriceKz: number | null;
  minimumSalePriceBreakevenKz: number | null;
  recommendedSalePriceKz: number | null;
  profitPerUnitKz: number | null;
  totalProfitKz: number | null;
  totalRevenueKz: number | null;
  marginPercent: number | null;
  markupPercent: number | null;
  roiPercent: number | null;

  // 10. Ponto de Equilíbrio
  breakEvenUnits: number | null;
  breakEvenExact: number | null;

  // 13. Classificação
  classification: 'Boa oportunidade' | 'Margem apertada' | 'Alto risco' | 'Dados insuficientes';
  classificationReasons: string[];
}

export function applyRounding(value: number, mode: RoundingMode): number {
  if (!Number.isFinite(value)) return 0;
  switch (mode) {
    case 'inteiro':
      return Math.round(value);
    case 'duas_casas':
      return Math.round(value * 100) / 100;
    case 'multiplo_50':
      return Math.round(value / 50) * 50;
    case 'multiplo_100':
      return Math.round(value / 100) * 100;
    default:
      return Math.round(value);
  }
}

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number | null> = {
  AOA: 1,
  USD: 1200,
  EUR: 1300,
  CNY: 168,
  ZAR: 66,
  GBP: 1520,
  BRL: 240,
};

export const DEFAULT_TAXABLE_BASE_CONFIG: TaxableBaseConfig = {
  includeMerchandise: true,
  includeFreight: true,
  includeInsurance: true,
  includeOtherCosts: false,
};

/**
 * Normaliza simulações antigas do localStorage para garantir todos os campos multimoeda
 */
export function normalizeSimulation(raw: Partial<ImportSimulation>): ImportSimulation {
  const purchaseCurrency: CurrencyCode = raw.purchaseCurrency || 'USD';
  const baseCurrency: CurrencyCode = raw.baseCurrency || 'AOA';
  const legacyUsdRate = raw.exchangeRateUsdToKz ?? 925;

  const exchangeRates: Record<CurrencyCode, number | null> = {
    ...DEFAULT_EXCHANGE_RATES,
    USD: legacyUsdRate,
    ...(raw.exchangeRates || {}),
    [baseCurrency]: 1,
  };

  const freightCurrency: CurrencyCode = raw.freightCurrency || 'AOA';

  const taxableBaseConfig: TaxableBaseConfig = {
    ...DEFAULT_TAXABLE_BASE_CONFIG,
    ...(raw.taxableBaseConfig || {}),
  };

  const normalizedTaxes: TaxConfigItem[] = (raw.taxes || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    enabled: Boolean(t.enabled),
    type: t.type === 'percent' ? 'percent' : 'fixed_amount',
    currency: t.currency || 'AOA',
    value: t.value ?? null,
    provenance: t.provenance || 'informado',
  }));

  const normalizedExpenses: CommercialExpenseItem[] = (raw.commercialExpenses || []).map(
    (e: any) => ({
      ...e,
      currency: e.currency || 'AOA',
    })
  );

  return {
    ...(raw as ImportSimulation),
    purchaseCurrency,
    baseCurrency,
    exchangeRates,
    freightCurrency,
    taxableBaseConfig,
    taxes: normalizedTaxes,
    commercialExpenses: normalizedExpenses,
  };
}

export function computeSimulationMetrics(
  rawSim: ImportSimulation,
  thresholds: ClassificationThresholds
): SimulationComputedMetrics {
  const sim = normalizeSimulation(rawSim);
  const baseCurr = sim.baseCurrency || 'AOA';
  const purchCurr = sim.purchaseCurrency || 'USD';
  const freightCurr = sim.freightCurrency || 'AOA';

  const qty = sim.desiredQuantity !== null && sim.desiredQuantity > 0 ? sim.desiredQuantity : null;
  const hasProductPrice = sim.unitPriceUsd !== null && sim.unitPriceUsd >= 0;
  const hasQuantity = qty !== null && qty > 0;

  // 1 & 2. Conversão Centralizada da Mercadoria (Moeda da Compra -> Moeda-Base)
  const unitProductMonetary = createMonetaryRecord(
    sim.unitPriceUsd,
    purchCurr,
    baseCurr,
    sim.exchangeRates,
    sim.exchangeRateUsdToKz
  );

  const merchandiseOriginalTotal =
    hasProductPrice && hasQuantity ? sim.unitPriceUsd! * qty! : null;

  const merchandiseMonetary = createMonetaryRecord(
    merchandiseOriginalTotal,
    purchCurr,
    baseCurr,
    sim.exchangeRates,
    sim.exchangeRateUsdToKz
  );

  const hasExchangeRate = unitProductMonetary.exchangeRate !== null && unitProductMonetary.exchangeRate > 0;
  const unitPriceKz = unitProductMonetary.baseAmount;
  const merchandiseTotalKz = merchandiseMonetary.baseAmount;

  const isBelowMoq =
    qty !== null && sim.moq !== null && sim.moq > 0 && qty < sim.moq;

  // 3. Transporte Internacional & Peso Volumétrico
  const hasRealWeight =
    sim.grossWeightPerUnitKg !== null && sim.grossWeightPerUnitKg >= 0;
  const totalRealWeightKg =
    hasRealWeight && hasQuantity ? sim.grossWeightPerUnitKg! * qty! : null;

  const hasDimensions =
    sim.packageLengthCm !== null &&
    sim.packageLengthCm > 0 &&
    sim.packageWidthCm !== null &&
    sim.packageWidthCm > 0 &&
    sim.packageHeightCm !== null &&
    sim.packageHeightCm > 0;

  const divisor = sim.volumetricDivisor > 0 ? sim.volumetricDivisor : 5000;
  const unitVolumetricWeightKg = hasDimensions
    ? (sim.packageLengthCm! * sim.packageWidthCm! * sim.packageHeightCm!) / divisor
    : null;

  const totalVolumetricWeightKg =
    unitVolumetricWeightKg !== null && hasQuantity
      ? unitVolumetricWeightKg * qty!
      : null;

  let chargeableWeightTotalKg: number | null = null;
  if (sim.chargeableWeightRule === 'real') {
    chargeableWeightTotalKg = totalRealWeightKg;
  } else if (sim.chargeableWeightRule === 'volumetrico') {
    chargeableWeightTotalKg = totalVolumetricWeightKg ?? totalRealWeightKg;
  } else {
    if (totalRealWeightKg !== null && totalVolumetricWeightKg !== null) {
      chargeableWeightTotalKg = Math.max(totalRealWeightKg, totalVolumetricWeightKg);
    } else {
      chargeableWeightTotalKg = totalRealWeightKg ?? totalVolumetricWeightKg;
    }
  }

  const freightRatePerKgMonetary = createMonetaryRecord(
    sim.freightRatePerKgKz,
    freightCurr,
    baseCurr,
    sim.exchangeRates,
    sim.exchangeRateUsdToKz
  );

  let freightOriginalTotal: number | null = null;
  if (sim.transportMethod === 'aereo_kg') {
    if (
      chargeableWeightTotalKg !== null &&
      sim.freightRatePerKgKz !== null &&
      sim.freightRatePerKgKz >= 0
    ) {
      freightOriginalTotal = chargeableWeightTotalKg * sim.freightRatePerKgKz;
    }
  } else {
    if (sim.fixedFreightCostKz !== null && sim.fixedFreightCostKz >= 0) {
      freightOriginalTotal = sim.fixedFreightCostKz;
    }
  }

  const freightTotalMonetary = createMonetaryRecord(
    freightOriginalTotal,
    freightCurr,
    baseCurr,
    sim.exchangeRates,
    sim.exchangeRateUsdToKz
  );

  const freightTotalKz = freightTotalMonetary.baseAmount;
  const hasTransportInfo = freightTotalKz !== null;

  // 4 & 5. Impostos e Taxas Aduaneiras (Consolidação em Moeda-Base + Base Tributável Configurável)
  const merchandiseVal = merchandiseTotalKz ?? 0;
  const freightVal = freightTotalKz ?? 0;

  // Primeiro passo: Converter taxas de valor fixo (Seguro, Desalfandegamento, Taxa Fornecedor/Transportadora, Outras) para a moeda-base
  let insuranceBaseKz = 0;
  let otherFixedTaxesBaseKz = 0;

  const fixedTaxMonetaries = new Map<string, MonetaryRecord>();
  sim.taxes.forEach((t) => {
    if (t.type === 'fixed_amount') {
      const mon = createMonetaryRecord(
        t.enabled ? t.value : 0,
        t.currency || baseCurr,
        baseCurr,
        sim.exchangeRates,
        sim.exchangeRateUsdToKz
      );
      fixedTaxMonetaries.set(t.id, mon);
      if (t.enabled && mon.baseAmount !== null && mon.baseAmount > 0) {
        if (t.id === 'tax-seguro') {
          insuranceBaseKz += mon.baseAmount;
        } else {
          otherFixedTaxesBaseKz += mon.baseAmount;
        }
      }
    }
  });

  // Se Seguro for percentual, incide sobre (Mercadoria + Frete) convertidos na moeda-base
  sim.taxes.forEach((t) => {
    if (t.id === 'tax-seguro' && t.enabled && t.type === 'percent' && t.value !== null && t.value > 0) {
      insuranceBaseKz += ((merchandiseVal + freightVal) * t.value) / 100;
    }
  });

  // Calcular Valor Tributável conforme as opções selecionadas pelo utilizador:
  // [ ] Mercadoria  [ ] Frete  [ ] Seguro  [ ] Outros custos
  let taxableValueKz = 0;
  if (sim.taxableBaseConfig.includeMerchandise) taxableValueKz += merchandiseVal;
  if (sim.taxableBaseConfig.includeFreight) taxableValueKz += freightVal;
  if (sim.taxableBaseConfig.includeInsurance) taxableValueKz += insuranceBaseKz;
  if (sim.taxableBaseConfig.includeOtherCosts) taxableValueKz += otherFixedTaxesBaseKz;

  let impostosTotalKz = 0;
  let taxasAduaneirasLogisticaKz = 0;

  const taxesBreakdown = sim.taxes.map((t) => {
    const isImposto = t.id === 'tax-agt' || t.id === 'tax-direitos';
    let amountKz = 0;
    let monetary: MonetaryRecord;

    if (t.type === 'percent') {
      if (t.enabled && t.value !== null && t.value > 0) {
        if (t.id === 'tax-seguro') {
          amountKz = ((merchandiseVal + freightVal) * t.value) / 100;
        } else {
          amountKz = (taxableValueKz * t.value) / 100;
        }
      }
      monetary = {
        amount: t.value,
        currency: baseCurr,
        exchangeRate: 1,
        baseAmount: amountKz,
      };
    } else {
      monetary = createMonetaryRecord(
        t.value,
        t.currency || baseCurr,
        baseCurr,
        sim.exchangeRates,
        sim.exchangeRateUsdToKz
      );
      if (t.enabled && monetary.baseAmount !== null && monetary.baseAmount > 0) {
        amountKz = monetary.baseAmount;
      }
    }

    if (t.enabled) {
      if (isImposto) {
        impostosTotalKz += amountKz;
      } else {
        taxasAduaneirasLogisticaKz += amountKz;
      }
    }

    return {
      id: t.id,
      name: t.name,
      enabled: t.enabled,
      type: t.type,
      monetary,
      amountKz,
      provenance: t.provenance,
      isImposto,
    };
  });

  // Custo Posto em Armazém (Landed Cost Consolidado na Moeda-Base)
  const canComputeLandedCost = merchandiseTotalKz !== null;
  const landedCostTotalKz = canComputeLandedCost
    ? merchandiseTotalKz! + (freightTotalKz ?? 0) + impostosTotalKz + taxasAduaneirasLogisticaKz
    : null;

  const landedCostUnitKz =
    landedCostTotalKz !== null && hasQuantity ? landedCostTotalKz / qty! : null;

  // 5. Despesas Comerciais (Com suporte a moeda própria convertida para Moeda-Base)
  let commercialFixedBatchKz = 0;
  let commercialFixedUnitKz = 0;
  let commercialFixedTotalKz = 0;
  let commercialPercentTotalRate = 0;

  const commercialBreakdown = sim.commercialExpenses.map((exp) => {
    const expCurr = exp.currency || baseCurr;
    const mon = createMonetaryRecord(
      exp.value,
      expCurr,
      baseCurr,
      sim.exchangeRates,
      sim.exchangeRateUsdToKz
    );
    let totalBaseKz = 0;

    if (exp.enabled && exp.value !== null && exp.value > 0) {
      if (exp.type === 'fixed_total_kz') {
        totalBaseKz = mon.baseAmount ?? 0;
        commercialFixedBatchKz += totalBaseKz;
        commercialFixedTotalKz += totalBaseKz;
      } else if (exp.type === 'fixed_unit_kz') {
        const unitBaseVal = mon.baseAmount ?? 0;
        commercialFixedUnitKz += unitBaseVal;
        totalBaseKz = unitBaseVal * (qty ?? 1);
        commercialFixedTotalKz += totalBaseKz;
      } else if (exp.type === 'percent_revenue') {
        commercialPercentTotalRate += exp.value;
      }
    }

    return {
      id: exp.id,
      name: exp.name,
      enabled: exp.enabled,
      type: exp.type,
      monetary: mon,
      totalBaseKz,
    };
  });

  const baseFullUnitBeforeVar =
    landedCostUnitKz !== null && hasQuantity
      ? (landedCostTotalKz! + commercialFixedTotalKz) / qty!
      : null;

  const baseCostUnitForPricing =
    sim.costBasisForPricing === 'posto' ? landedCostUnitKz : baseFullUnitBeforeVar;

  // 8. Precificação (Preço Efetivo na Moeda-Base)
  let effectiveSalePriceKz: number | null = null;
  const varRateFraction = commercialPercentTotalRate / 100;

  if (sim.pricingMode === 'preco_venda') {
    effectiveSalePriceKz =
      sim.simulatedSalePriceKz !== null && sim.simulatedSalePriceKz > 0
        ? sim.simulatedSalePriceKz
        : null;
  } else if (sim.pricingMode === 'margem_desejada') {
    if (
      baseCostUnitForPricing !== null &&
      sim.targetMarginPercent !== null &&
      sim.targetMarginPercent > 0 &&
      sim.targetMarginPercent + commercialPercentTotalRate < 100
    ) {
      const targetM = sim.targetMarginPercent / 100;
      const rawPrice = baseCostUnitForPricing / (1 - targetM - varRateFraction);
      effectiveSalePriceKz = applyRounding(rawPrice, sim.roundingMode);
    }
  } else if (sim.pricingMode === 'markup_desejado') {
    if (
      baseCostUnitForPricing !== null &&
      sim.targetMarkupPercent !== null &&
      sim.targetMarkupPercent >= 0
    ) {
      const targetMk = sim.targetMarkupPercent / 100;
      const denom = 1 - varRateFraction * (1 + targetMk);
      if (denom > 0) {
        const rawPrice = (baseCostUnitForPricing * (1 + targetMk)) / denom;
        effectiveSalePriceKz = applyRounding(rawPrice, sim.roundingMode);
      }
    }
  }

  const commercialVariableTotalKz =
    effectiveSalePriceKz !== null && hasQuantity
      ? effectiveSalePriceKz * qty! * varRateFraction
      : 0;

  const commercialExpensesTotalKz = commercialFixedTotalKz + commercialVariableTotalKz;
  const commercialExpenseUnitKz = hasQuantity ? commercialExpensesTotalKz / qty! : 0;

  const fullCostTotalKz =
    landedCostTotalKz !== null ? landedCostTotalKz + commercialExpensesTotalKz : null;

  const fullCostUnitKz =
    fullCostTotalKz !== null && hasQuantity ? fullCostTotalKz / qty! : null;

  const minimumSalePriceBreakevenKz =
    baseFullUnitBeforeVar !== null && 1 - varRateFraction > 0
      ? applyRounding(baseFullUnitBeforeVar / (1 - varRateFraction), sim.roundingMode)
      : null;

  const recommendedSalePriceKz =
    baseFullUnitBeforeVar !== null && 1 - 0.3 - varRateFraction > 0
      ? applyRounding(baseFullUnitBeforeVar / (1 - 0.3 - varRateFraction), sim.roundingMode)
      : null;

  // 6. Orçamento
  const hasBudget = sim.availableBudgetKz !== null && sim.availableBudgetKz > 0;
  const investmentRequiredKz = fullCostTotalKz ?? landedCostTotalKz;

  const maxUnitsByLandedCost =
    hasBudget && landedCostUnitKz !== null && landedCostUnitKz > 0
      ? Math.floor(sim.availableBudgetKz! / landedCostUnitKz)
      : null;

  const maxUnitsByFullCost =
    hasBudget && fullCostUnitKz !== null && fullCostUnitKz > 0
      ? Math.floor(sim.availableBudgetKz! / fullCostUnitKz)
      : null;

  const budgetUsedKz = investmentRequiredKz;
  const remainingCapitalKz =
    hasBudget && investmentRequiredKz !== null
      ? sim.availableBudgetKz! - investmentRequiredKz
      : null;

  const fitsInBudget =
    remainingCapitalKz !== null ? remainingCapitalKz >= 0 : null;

  const budgetExceededByKz =
    remainingCapitalKz !== null && remainingCapitalKz < 0
      ? Math.abs(remainingCapitalKz)
      : null;

  const recommendedQuantityForBudget =
    sim.costBasisForPricing === 'posto'
      ? maxUnitsByLandedCost
      : maxUnitsByFullCost ?? maxUnitsByLandedCost;

  // 8 & 11. Lucro, Margem, Markup, ROI
  const hasSalePrice = effectiveSalePriceKz !== null && effectiveSalePriceKz > 0;
  const costUnitConsidered =
    sim.costBasisForPricing === 'posto' ? landedCostUnitKz : fullCostUnitKz;
  const totalCostConsidered =
    sim.costBasisForPricing === 'posto' ? landedCostTotalKz : fullCostTotalKz;

  const totalRevenueKz =
    hasSalePrice && hasQuantity ? effectiveSalePriceKz! * qty! : null;

  const profitPerUnitKz =
    hasSalePrice && costUnitConsidered !== null
      ? effectiveSalePriceKz! - costUnitConsidered
      : null;

  const totalProfitKz =
    totalRevenueKz !== null && totalCostConsidered !== null
      ? totalRevenueKz - totalCostConsidered
      : null;

  const marginPercent =
    hasSalePrice && profitPerUnitKz !== null && effectiveSalePriceKz! > 0
      ? (profitPerUnitKz / effectiveSalePriceKz!) * 100
      : null;

  const markupPercent =
    profitPerUnitKz !== null && costUnitConsidered !== null && costUnitConsidered > 0
      ? (profitPerUnitKz / costUnitConsidered) * 100
      : null;

  const roiPercent =
    totalProfitKz !== null && totalCostConsidered !== null && totalCostConsidered > 0
      ? (totalProfitKz / totalCostConsidered) * 100
      : null;

  // 10. Ponto de Equilíbrio
  const breakEvenExact =
    hasSalePrice && totalCostConsidered !== null && effectiveSalePriceKz! > 0
      ? totalCostConsidered / effectiveSalePriceKz!
      : null;

  const breakEvenUnits =
    breakEvenExact !== null ? Math.ceil(breakEvenExact) : null;

  // 13. Classificação Financeira Configurável
  let classification: SimulationComputedMetrics['classification'] = 'Dados insuficientes';
  const classificationReasons: string[] = [];

  if (marginPercent !== null && roiPercent !== null && profitPerUnitKz !== null) {
    if (profitPerUnitKz <= 0) {
      classification = 'Alto risco';
      classificationReasons.push('Preço de venda igual ou inferior ao custo unitário (operação com prejuízo).');
    } else if (fitsInBudget === false) {
      if (marginPercent < thresholds.tightMarginMinPercent) {
        classification = 'Alto risco';
        classificationReasons.push('Ultrapassa o orçamento disponível e possui margem muito baixa.');
      } else {
        classification = 'Margem apertada';
        classificationReasons.push(
          `A quantidade desejada ultrapassa o orçamento em ${Math.round(budgetExceededByKz || 0).toLocaleString('pt-AO')} Kz.`
        );
      }
    } else if (
      marginPercent >= thresholds.goodMarginMinPercent &&
      roiPercent >= thresholds.goodRoiMinPercent
    ) {
      classification = 'Boa oportunidade';
      classificationReasons.push(
        `Margem (${marginPercent.toFixed(1)}%) e ROI (${roiPercent.toFixed(1)}%) atingem os critérios mínimos definidos.`
      );
    } else if (
      marginPercent >= thresholds.tightMarginMinPercent &&
      roiPercent >= thresholds.tightRoiMinPercent
    ) {
      classification = 'Margem apertada';
      classificationReasons.push(
        `Viável financeiramente, mas com margem (${marginPercent.toFixed(1)}%) ou ROI (${roiPercent.toFixed(1)}%) abaixo do patamar ideal.`
      );
    } else {
      classification = 'Alto risco';
      classificationReasons.push(
        `Margem (${marginPercent.toFixed(1)}%) ou retorno sobre investimento (${roiPercent.toFixed(1)}%) abaixo do limite de segurança configurado.`
      );
    }

    if (breakEvenUnits !== null && qty !== null && breakEvenUnits > qty * 0.85) {
      classificationReasons.push(
        `Exige vender ${breakEvenUnits} de ${qty} unidades (${Math.round((breakEvenUnits / qty) * 100)}% do lote) apenas para empatar o capital.`
      );
    }
  } else {
    classificationReasons.push(
      'Preencha preço de compra, câmbio, quantidade e preço de venda para avaliar a viabilidade.'
    );
  }

  return {
    hasProductPrice,
    hasExchangeRate,
    hasQuantity,
    hasTransportInfo,
    hasBudget,
    hasSalePrice,
    isBelowMoq,
    unitProductMonetary,
    merchandiseMonetary,
    freightRatePerKgMonetary,
    freightTotalMonetary,
    unitPriceKz,
    merchandiseTotalOriginal: merchandiseOriginalTotal,
    merchandiseTotalUsd: merchandiseOriginalTotal,
    merchandiseTotalKz,
    totalRealWeightKg,
    unitVolumetricWeightKg,
    totalVolumetricWeightKg,
    chargeableWeightTotalKg,
    freightOriginalTotal,
    freightExchangeRateUsed: freightTotalMonetary.exchangeRate,
    freightTotalKz,
    taxableValueKz,
    impostosTotalKz,
    taxasAduaneirasLogisticaKz,
    taxesBreakdown,
    landedCostTotalKz,
    landedCostUnitKz,
    commercialFixedBatchKz,
    commercialFixedUnitKz,
    commercialFixedTotalKz,
    commercialPercentTotalRate,
    commercialVariableTotalKz,
    commercialExpensesTotalKz,
    commercialExpenseUnitKz,
    commercialBreakdown,
    fullCostTotalKz,
    fullCostUnitKz,
    maxUnitsByLandedCost,
    maxUnitsByFullCost,
    budgetUsedKz,
    remainingCapitalKz,
    fitsInBudget,
    budgetExceededByKz,
    recommendedQuantityForBudget,
    effectiveSalePriceKz,
    minimumSalePriceBreakevenKz,
    recommendedSalePriceKz,
    profitPerUnitKz,
    totalProfitKz,
    totalRevenueKz,
    marginPercent,
    markupPercent,
    roiPercent,
    breakEvenUnits,
    breakEvenExact,
    classification,
    classificationReasons,
  };
}

export const DEFAULT_CLASSIFICATION_THRESHOLDS: ClassificationThresholds = {
  goodMarginMinPercent: 25,
  goodRoiMinPercent: 30,
  tightMarginMinPercent: 15,
  tightRoiMinPercent: 18,
};

export function createBlankSimulation(): ImportSimulation {
  const now = new Date().toISOString();
  return {
    id: `sim-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    overallProvenance: 'informado',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      AOA: 1,
      USD: null,
      EUR: null,
      CNY: null,
      ZAR: null,
      GBP: null,
      BRL: null,
    },
    exchangeRateUsdToKz: null,
    exchangeProvenance: 'informado',
    productName: '',
    supplierName: '',
    unitPriceUsd: null,
    unitPriceProvenance: 'informado',
    moq: null,
    desiredQuantity: null,
    grossWeightPerUnitKg: null,
    weightProvenance: 'informado',
    packageLengthCm: null,
    packageWidthCm: null,
    packageHeightCm: null,
    transportMethod: 'aereo_kg',
    freightCurrency: 'AOA',
    freightRatePerKgKz: null,
    fixedFreightCostKz: null,
    freightProvenance: 'informado',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      {
        id: 'tax-agt',
        name: 'Imposto / AGT (%)',
        enabled: false,
        type: 'percent',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'tax-direitos',
        name: 'Direitos Aduaneiros (%)',
        enabled: false,
        type: 'percent',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'tax-desalfandegamento',
        name: 'Taxa de Desalfandegamento',
        enabled: false,
        type: 'fixed_amount',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'tax-transportadora',
        name: 'Taxa Fornecedor / Transportadora',
        enabled: false,
        type: 'fixed_amount',
        currency: 'USD',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'tax-seguro',
        name: 'Seguro Internacional de Carga',
        enabled: false,
        type: 'fixed_amount',
        currency: 'USD',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'tax-outras',
        name: 'Outras Taxas Locais',
        enabled: false,
        type: 'fixed_amount',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
    ],
    commercialExpenses: [
      {
        id: 'exp-publicidade',
        name: 'Publicidade / Tráfego Pago (Lote)',
        enabled: false,
        type: 'fixed_total_kz',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-embalagem',
        name: 'Embalagem Personalizada (por un.)',
        enabled: false,
        type: 'fixed_unit_kz',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-entrega',
        name: 'Entrega ao Cliente (por un.)',
        enabled: false,
        type: 'fixed_unit_kz',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-comissao-vendedor',
        name: 'Comissão de Vendedor (%)',
        enabled: false,
        type: 'percent_revenue',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-comissao-pagamento',
        name: 'Comissão de Pagamento / TPA (%)',
        enabled: false,
        type: 'percent_revenue',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-outras',
        name: 'Outras Despesas Comerciais (Lote)',
        enabled: false,
        type: 'fixed_total_kz',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
    ],
    availableBudgetKz: null,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: null,
    targetMarginPercent: 30,
    targetMarkupPercent: 45,
    costBasisForPricing: 'completo',
    priceScenarios: [
      {
        id: 'scen-conservador',
        label: 'Conservador',
        description: 'Giro rápido / Preço competitivo',
        salePriceKz: null,
        isCustom: false,
      },
      {
        id: 'scen-moderado',
        label: 'Moderado',
        description: 'Margem intermédia de entrada',
        salePriceKz: null,
        isCustom: false,
      },
      {
        id: 'scen-recomendado',
        label: 'Recomendado',
        description: 'Equilíbrio ideal entre margem e volume',
        salePriceKz: null,
        isCustom: false,
      },
      {
        id: 'scen-agressivo',
        label: 'Agressivo',
        description: 'Posicionamento premium / Alta margem',
        salePriceKz: null,
        isCustom: false,
      },
    ],
    roundingMode: 'inteiro',
  };
}

export const INITIAL_SIMULATIONS: ImportSimulation[] = [
  // 1. Kit Skincare
  {
    id: 'sim-kit-skincare',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-12T14:30:00Z',
    overallProvenance: 'estimativa',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      ...DEFAULT_EXCHANGE_RATES,
      USD: 925,
    },
    exchangeRateUsdToKz: 925,
    exchangeProvenance: 'informado',
    productName: 'Kit Skincare',
    supplierName: 'Guangzhou Beauty Care Co. (Alibaba)',
    unitPriceUsd: 10,
    unitPriceProvenance: 'informado',
    moq: 10,
    desiredQuantity: 10,
    grossWeightPerUnitKg: 0.5,
    weightProvenance: 'estimativa',
    packageLengthCm: 22,
    packageWidthCm: 15,
    packageHeightCm: 7,
    transportMethod: 'aereo_kg',
    freightCurrency: 'AOA',
    freightRatePerKgKz: 10000,
    fixedFreightCostKz: null,
    freightProvenance: 'estimativa',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      {
        id: 'tax-agt',
        name: 'Imposto / AGT (%)',
        enabled: false,
        type: 'percent',
        currency: 'AOA',
        value: 14,
        provenance: 'estimativa',
      },
      {
        id: 'tax-direitos',
        name: 'Direitos Aduaneiros (%)',
        enabled: false,
        type: 'percent',
        currency: 'AOA',
        value: 5,
        provenance: 'estimativa',
      },
      {
        id: 'tax-desalfandegamento',
        name: 'Taxa de Desalfandegamento',
        enabled: true,
        type: 'fixed_amount',
        currency: 'AOA',
        value: 7500,
        provenance: 'estimativa',
      },
      {
        id: 'tax-transportadora',
        name: 'Taxa Fornecedor / Transportadora',
        enabled: true,
        type: 'fixed_amount',
        currency: 'AOA',
        value: 3750,
        provenance: 'estimativa',
      },
      {
        id: 'tax-seguro',
        name: 'Seguro Internacional de Carga',
        enabled: false,
        type: 'fixed_amount',
        currency: 'USD',
        value: null,
        provenance: 'estimativa',
      },
      {
        id: 'tax-outras',
        name: 'Outras Taxas Locais',
        enabled: false,
        type: 'fixed_amount',
        currency: 'AOA',
        value: null,
        provenance: 'estimativa',
      },
    ],
    commercialExpenses: [
      {
        id: 'exp-publicidade',
        name: 'Publicidade / Tráfego Pago (Lote)',
        enabled: true,
        type: 'fixed_total_kz',
        currency: 'AOA',
        value: 15000,
        provenance: 'estimativa',
      },
      {
        id: 'exp-embalagem',
        name: 'Embalagem Personalizada (por un.)',
        enabled: true,
        type: 'fixed_unit_kz',
        currency: 'AOA',
        value: 300,
        provenance: 'estimativa',
      },
      {
        id: 'exp-entrega',
        name: 'Entrega ao Cliente (por un.)',
        enabled: true,
        type: 'fixed_unit_kz',
        currency: 'AOA',
        value: 500,
        provenance: 'estimativa',
      },
      {
        id: 'exp-comissao-vendedor',
        name: 'Comissão de Vendedor (%)',
        enabled: false,
        type: 'percent_revenue',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-comissao-pagamento',
        name: 'Comissão de Pagamento / TPA (%)',
        enabled: false,
        type: 'percent_revenue',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
      {
        id: 'exp-outras',
        name: 'Outras Despesas Comerciais (Lote)',
        enabled: false,
        type: 'fixed_total_kz',
        currency: 'AOA',
        value: null,
        provenance: 'informado',
      },
    ],
    availableBudgetKz: 200000,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: 25000,
    targetMarginPercent: 29.3,
    targetMarkupPercent: 41.4,
    costBasisForPricing: 'completo',
    priceScenarios: [
      {
        id: 'scen-conservador',
        label: 'Conservador',
        description: 'Preço baixo para escoamento rápido',
        salePriceKz: 20000,
        isCustom: true,
      },
      {
        id: 'scen-moderado',
        label: 'Moderado',
        description: 'Preço competitivo de mercado',
        salePriceKz: 22500,
        isCustom: true,
      },
      {
        id: 'scen-recomendado',
        label: 'Recomendado',
        description: 'Preço equilibrado',
        salePriceKz: 25000,
        isCustom: true,
      },
      {
        id: 'scen-agressivo',
        label: 'Agressivo',
        description: 'Preço com maior margem',
        salePriceKz: 30000,
        isCustom: true,
      },
    ],
    roundingMode: 'inteiro',
  },

  // 2. Mini Seladora (Com Frete em USD e Câmbio 1200 Kz para demonstrar o fluxo multimoeda)
  {
    id: 'sim-mini-seladora',
    createdAt: '2026-09-08T09:15:00Z',
    updatedAt: '2026-09-11T11:20:00Z',
    overallProvenance: 'estimativa',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      ...DEFAULT_EXCHANGE_RATES,
      USD: 1200,
    },
    exchangeRateUsdToKz: 1200,
    exchangeProvenance: 'informado',
    productName: 'Mini Seladora Portátil USB',
    supplierName: 'Yiwu Home Appliances Factory',
    unitPriceUsd: 1.8,
    unitPriceProvenance: 'informado',
    moq: 30,
    desiredQuantity: 40,
    grossWeightPerUnitKg: 0.12,
    weightProvenance: 'informado',
    packageLengthCm: 12,
    packageWidthCm: 5,
    packageHeightCm: 5,
    transportMethod: 'aereo_kg',
    freightCurrency: 'USD',
    freightRatePerKgKz: 10,
    fixedFreightCostKz: null,
    freightProvenance: 'estimativa',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      { id: 'tax-agt', name: 'Imposto / AGT (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-direitos', name: 'Direitos Aduaneiros (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-desalfandegamento', name: 'Taxa de Desalfandegamento', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 5000, provenance: 'estimativa' },
      { id: 'tax-transportadora', name: 'Taxa Fornecedor / Transportadora', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 2500, provenance: 'estimativa' },
      { id: 'tax-seguro', name: 'Seguro Internacional de Carga', enabled: false, type: 'fixed_amount', currency: 'USD', value: null, provenance: 'estimativa' },
      { id: 'tax-outras', name: 'Outras Taxas Locais', enabled: false, type: 'fixed_amount', currency: 'AOA', value: null, provenance: 'estimativa' },
    ],
    commercialExpenses: [
      { id: 'exp-publicidade', name: 'Publicidade / Tráfego Pago (Lote)', enabled: true, type: 'fixed_total_kz', currency: 'AOA', value: 16000, provenance: 'estimativa' },
      { id: 'exp-embalagem', name: 'Embalagem Personalizada (por un.)', enabled: true, type: 'fixed_unit_kz', currency: 'AOA', value: 150, provenance: 'estimativa' },
      { id: 'exp-entrega', name: 'Entrega ao Cliente (por un.)', enabled: false, type: 'fixed_unit_kz', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'exp-comissao-vendedor', name: 'Comissão de Vendedor (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-comissao-pagamento', name: 'Comissão de Pagamento / TPA (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-outras', name: 'Outras Despesas Comerciais (Lote)', enabled: false, type: 'fixed_total_kz', currency: 'AOA', value: null, provenance: 'informado' },
    ],
    availableBudgetKz: 250000,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: 6800,
    targetMarginPercent: 40,
    targetMarkupPercent: 66,
    costBasisForPricing: 'completo',
    priceScenarios: [
      { id: 'scen-conservador', label: 'Conservador', description: 'Preço baixo', salePriceKz: 5500, isCustom: true },
      { id: 'scen-moderado', label: 'Moderado', description: 'Preço intermédio', salePriceKz: 6200, isCustom: true },
      { id: 'scen-recomendado', label: 'Recomendado', description: 'Preço equilibrado', salePriceKz: 6800, isCustom: true },
      { id: 'scen-agressivo', label: 'Agressivo', description: 'Maior margem', salePriceKz: 7900, isCustom: true },
    ],
    roundingMode: 'inteiro',
  },

  // 3. Abridor Automático
  {
    id: 'sim-abridor-automatico',
    createdAt: '2026-09-09T11:00:00Z',
    updatedAt: '2026-09-11T16:40:00Z',
    overallProvenance: 'estimativa',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      ...DEFAULT_EXCHANGE_RATES,
      USD: 925,
    },
    exchangeRateUsdToKz: 925,
    exchangeProvenance: 'informado',
    productName: 'Abridor Automático de Garrafas Inox',
    supplierName: 'Shenzhen Smart Kitchen Ltd.',
    unitPriceUsd: 4.5,
    unitPriceProvenance: 'informado',
    moq: 20,
    desiredQuantity: 20,
    grossWeightPerUnitKg: 0.35,
    weightProvenance: 'informado',
    packageLengthCm: 24,
    packageWidthCm: 8,
    packageHeightCm: 8,
    transportMethod: 'aereo_kg',
    freightCurrency: 'AOA',
    freightRatePerKgKz: 10000,
    fixedFreightCostKz: null,
    freightProvenance: 'estimativa',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      { id: 'tax-agt', name: 'Imposto / AGT (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-direitos', name: 'Direitos Aduaneiros (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-desalfandegamento', name: 'Taxa de Desalfandegamento', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 6000, provenance: 'estimativa' },
      { id: 'tax-transportadora', name: 'Taxa Fornecedor / Transportadora', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 3000, provenance: 'estimativa' },
      { id: 'tax-seguro', name: 'Seguro Internacional de Carga', enabled: false, type: 'fixed_amount', currency: 'USD', value: null, provenance: 'estimativa' },
      { id: 'tax-outras', name: 'Outras Taxas Locais', enabled: false, type: 'fixed_amount', currency: 'AOA', value: null, provenance: 'estimativa' },
    ],
    commercialExpenses: [
      { id: 'exp-publicidade', name: 'Publicidade / Tráfego Pago (Lote)', enabled: true, type: 'fixed_total_kz', currency: 'AOA', value: 14000, provenance: 'estimativa' },
      { id: 'exp-embalagem', name: 'Embalagem Personalizada (por un.)', enabled: true, type: 'fixed_unit_kz', currency: 'AOA', value: 250, provenance: 'estimativa' },
      { id: 'exp-entrega', name: 'Entrega ao Cliente (por un.)', enabled: false, type: 'fixed_unit_kz', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'exp-comissao-vendedor', name: 'Comissão de Vendedor (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-comissao-pagamento', name: 'Comissão de Pagamento / TPA (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-outras', name: 'Outras Despesas Comerciais (Lote)', enabled: false, type: 'fixed_total_kz', currency: 'AOA', value: null, provenance: 'informado' },
    ],
    availableBudgetKz: 200000,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: 13500,
    targetMarginPercent: 35,
    targetMarkupPercent: 54,
    costBasisForPricing: 'completo',
    priceScenarios: [
      { id: 'scen-conservador', label: 'Conservador', description: 'Preço baixo', salePriceKz: 11000, isCustom: true },
      { id: 'scen-moderado', label: 'Moderado', description: 'Preço intermédio', salePriceKz: 12500, isCustom: true },
      { id: 'scen-recomendado', label: 'Recomendado', description: 'Preço equilibrado', salePriceKz: 13500, isCustom: true },
      { id: 'scen-agressivo', label: 'Agressivo', description: 'Maior margem', salePriceKz: 16000, isCustom: true },
    ],
    roundingMode: 'inteiro',
  },

  // 4. Touca de Cetim
  {
    id: 'sim-touca-cetim',
    createdAt: '2026-09-07T08:00:00Z',
    updatedAt: '2026-09-10T17:10:00Z',
    overallProvenance: 'estimativa',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      ...DEFAULT_EXCHANGE_RATES,
      USD: 925,
    },
    exchangeRateUsdToKz: 925,
    exchangeProvenance: 'informado',
    productName: 'Touca de Cetim Dupla Face Antifrizz',
    supplierName: 'Hangzhou Silk & Satin Textiles',
    unitPriceUsd: 0.95,
    unitPriceProvenance: 'informado',
    moq: 50,
    desiredQuantity: 80,
    grossWeightPerUnitKg: 0.06,
    weightProvenance: 'informado',
    packageLengthCm: 15,
    packageWidthCm: 12,
    packageHeightCm: 2,
    transportMethod: 'aereo_kg',
    freightCurrency: 'AOA',
    freightRatePerKgKz: 10000,
    fixedFreightCostKz: null,
    freightProvenance: 'estimativa',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      { id: 'tax-agt', name: 'Imposto / AGT (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-direitos', name: 'Direitos Aduaneiros (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-desalfandegamento', name: 'Taxa de Desalfandegamento', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 4500, provenance: 'estimativa' },
      { id: 'tax-transportadora', name: 'Taxa Fornecedor / Transportadora', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 2500, provenance: 'estimativa' },
      { id: 'tax-seguro', name: 'Seguro Internacional de Carga', enabled: false, type: 'fixed_amount', currency: 'USD', value: null, provenance: 'estimativa' },
      { id: 'tax-outras', name: 'Outras Taxas Locais', enabled: false, type: 'fixed_amount', currency: 'AOA', value: null, provenance: 'estimativa' },
    ],
    commercialExpenses: [
      { id: 'exp-publicidade', name: 'Publicidade / Tráfego Pago (Lote)', enabled: true, type: 'fixed_total_kz', currency: 'AOA', value: 12000, provenance: 'estimativa' },
      { id: 'exp-embalagem', name: 'Embalagem Personalizada (por un.)', enabled: true, type: 'fixed_unit_kz', currency: 'AOA', value: 100, provenance: 'estimativa' },
      { id: 'exp-entrega', name: 'Entrega ao Cliente (por un.)', enabled: false, type: 'fixed_unit_kz', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'exp-comissao-vendedor', name: 'Comissão de Vendedor (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-comissao-pagamento', name: 'Comissão de Pagamento / TPA (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-outras', name: 'Outras Despesas Comerciais (Lote)', enabled: false, type: 'fixed_total_kz', currency: 'AOA', value: null, provenance: 'informado' },
    ],
    availableBudgetKz: 200000,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: 3500,
    targetMarginPercent: 45,
    targetMarkupPercent: 80,
    costBasisForPricing: 'completo',
    priceScenarios: [
      { id: 'scen-conservador', label: 'Conservador', description: 'Preço baixo', salePriceKz: 2500, isCustom: true },
      { id: 'scen-moderado', label: 'Moderado', description: 'Preço intermédio', salePriceKz: 3000, isCustom: true },
      { id: 'scen-recomendado', label: 'Recomendado', description: 'Preço equilibrado', salePriceKz: 3500, isCustom: true },
      { id: 'scen-agressivo', label: 'Agressivo', description: 'Maior margem', salePriceKz: 4200, isCustom: true },
    ],
    roundingMode: 'inteiro',
  },

  // 5. Máscara
  {
    id: 'sim-mascara-facial',
    createdAt: '2026-09-06T12:00:00Z',
    updatedAt: '2026-09-09T15:00:00Z',
    overallProvenance: 'estimativa',
    purchaseCurrency: 'USD',
    baseCurrency: 'AOA',
    exchangeRates: {
      ...DEFAULT_EXCHANGE_RATES,
      USD: 925,
    },
    exchangeRateUsdToKz: 925,
    exchangeProvenance: 'informado',
    productName: 'Máscara Facial Colagénio (Caixa 20 un.)',
    supplierName: 'Guangzhou Bio-Cosmetics Co.',
    unitPriceUsd: 3.2,
    unitPriceProvenance: 'informado',
    moq: 25,
    desiredQuantity: 30,
    grossWeightPerUnitKg: 0.28,
    weightProvenance: 'estimativa',
    packageLengthCm: 16,
    packageWidthCm: 12,
    packageHeightCm: 4,
    transportMethod: 'aereo_kg',
    freightCurrency: 'AOA',
    freightRatePerKgKz: 10000,
    fixedFreightCostKz: null,
    freightProvenance: 'estimativa',
    volumetricDivisor: 5000,
    chargeableWeightRule: 'maior',
    taxableBaseConfig: {
      includeMerchandise: true,
      includeFreight: true,
      includeInsurance: false,
      includeOtherCosts: false,
    },
    taxes: [
      { id: 'tax-agt', name: 'Imposto / AGT (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-direitos', name: 'Direitos Aduaneiros (%)', enabled: false, type: 'percent', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'tax-desalfandegamento', name: 'Taxa de Desalfandegamento', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 5500, provenance: 'estimativa' },
      { id: 'tax-transportadora', name: 'Taxa Fornecedor / Transportadora', enabled: true, type: 'fixed_amount', currency: 'AOA', value: 2500, provenance: 'estimativa' },
      { id: 'tax-seguro', name: 'Seguro Internacional de Carga', enabled: false, type: 'fixed_amount', currency: 'USD', value: null, provenance: 'estimativa' },
      { id: 'tax-outras', name: 'Outras Taxas Locais', enabled: false, type: 'fixed_amount', currency: 'AOA', value: null, provenance: 'estimativa' },
    ],
    commercialExpenses: [
      { id: 'exp-publicidade', name: 'Publicidade / Tráfego Pago (Lote)', enabled: true, type: 'fixed_total_kz', currency: 'AOA', value: 12000, provenance: 'estimativa' },
      { id: 'exp-embalagem', name: 'Embalagem Personalizada (por un.)', enabled: true, type: 'fixed_unit_kz', currency: 'AOA', value: 150, provenance: 'estimativa' },
      { id: 'exp-entrega', name: 'Entrega ao Cliente (por un.)', enabled: false, type: 'fixed_unit_kz', currency: 'AOA', value: null, provenance: 'estimativa' },
      { id: 'exp-comissao-vendedor', name: 'Comissão de Vendedor (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-comissao-pagamento', name: 'Comissão de Pagamento / TPA (%)', enabled: false, type: 'percent_revenue', currency: 'AOA', value: null, provenance: 'informado' },
      { id: 'exp-outras', name: 'Outras Despesas Comerciais (Lote)', enabled: false, type: 'fixed_total_kz', currency: 'AOA', value: null, provenance: 'informado' },
    ],
    availableBudgetKz: 200000,
    pricingMode: 'preco_venda',
    simulatedSalePriceKz: 9000,
    targetMarginPercent: 30,
    targetMarkupPercent: 43,
    costBasisForPricing: 'completo',
    priceScenarios: [
      { id: 'scen-conservador', label: 'Conservador', description: 'Preço baixo', salePriceKz: 7500, isCustom: true },
      { id: 'scen-moderado', label: 'Moderado', description: 'Preço intermédio', salePriceKz: 8200, isCustom: true },
      { id: 'scen-recomendado', label: 'Recomendado', description: 'Preço equilibrado', salePriceKz: 9000, isCustom: true },
      { id: 'scen-agressivo', label: 'Agressivo', description: 'Maior margem', salePriceKz: 10500, isCustom: true },
    ],
    roundingMode: 'inteiro',
  },
];
