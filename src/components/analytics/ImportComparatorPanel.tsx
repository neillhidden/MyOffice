import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Copy,
  Trash2,
  Sliders,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import {
  ImportSimulation,
  SimulationComputedMetrics,
  ClassificationThresholds,
  CurrencyCode,
  computeSimulationMetrics,
  applyRounding,
  formatOriginalCurrency,
  getCurrencySymbol,
  getCurrencyDisplayCode,
  normalizeSimulation,
} from '../../types/importSimulator';
import { PositiveBadge } from '../common/PositiveBadge';
import { SimulatorHelpTooltip } from './SimulatorHelpTooltip';

interface ImportComparatorPanelProps {
  currentSim: ImportSimulation;
  metrics: SimulationComputedMetrics;
  savedSimulations: ImportSimulation[];
  thresholds: ClassificationThresholds;
  onUpdateThresholds: (next: ClassificationThresholds) => void;
  onUpdateSim: (updater: (prev: ImportSimulation) => ImportSimulation) => void;
  onSelectSavedSim: (sim: ImportSimulation) => void;
  onDuplicateSim: (sim: ImportSimulation) => void;
  onDeleteSim: (id: string) => void;
  formatKzVal: (val: number | null | undefined) => string;
}

type SensitivityVariable = 'frete_kg' | 'cambio' | 'preco_origem' | 'impostos' | 'preco_venda';
type ComparatorSortKey =
  | 'maior_margem'
  | 'maior_roi'
  | 'menor_investimento'
  | 'menor_custo_unitario'
  | 'menor_risco';

function buildDefaultFreightSteps(sim: ImportSimulation): number[] {
  const fCurr = sim.freightCurrency || 'AOA';
  const isPerKg = sim.transportMethod === 'aereo_kg';

  if (isPerKg) {
    const currentRate = sim.freightRatePerKgKz;
    if (fCurr === 'AOA') {
      if (
        currentRate === null ||
        currentRate === 0 ||
        [5000, 8000, 10000, 12000, 15000].includes(currentRate)
      ) {
        return [5000, 8000, 10000, 12000, 15000];
      }
      return [
        Math.max(500, Math.round((currentRate * 0.6) / 500) * 500),
        Math.max(500, Math.round((currentRate * 0.8) / 500) * 500),
        currentRate,
        Math.round((currentRate * 1.2) / 500) * 500,
        Math.round((currentRate * 1.5) / 500) * 500,
      ];
    }
    // Foreign currency per kg (e.g., USD/kg, EUR/kg, CNY/kg)
    const baseRate = currentRate && currentRate > 0 ? currentRate : fCurr === 'CNY' ? 65 : 12;
    return [
      Math.max(1, Math.round(baseRate * 0.7 * 10) / 10),
      Math.max(1, Math.round(baseRate * 0.85 * 10) / 10),
      baseRate,
      Math.round(baseRate * 1.15 * 10) / 10,
      Math.round(baseRate * 1.35 * 10) / 10,
    ];
  } else {
    // Fixed / maritime freight total
    const currentFixed = sim.fixedFreightCostKz;
    if (fCurr === 'AOA') {
      const baseFixed = currentFixed && currentFixed > 0 ? currentFixed : 50000;
      return [
        Math.round((baseFixed * 0.7) / 1000) * 1000,
        Math.round((baseFixed * 0.85) / 1000) * 1000,
        baseFixed,
        Math.round((baseFixed * 1.15) / 1000) * 1000,
        Math.round((baseFixed * 1.35) / 1000) * 1000,
      ];
    }
    const baseFixed = currentFixed && currentFixed > 0 ? currentFixed : 150;
    return [
      Math.round(baseFixed * 0.7 * 10) / 10,
      Math.round(baseFixed * 0.85 * 10) / 10,
      baseFixed,
      Math.round(baseFixed * 1.15 * 10) / 10,
      Math.round(baseFixed * 1.35 * 10) / 10,
    ];
  }
}

export const ImportComparatorPanel: React.FC<ImportComparatorPanelProps> = ({
  currentSim: rawCurrentSim,
  metrics,
  savedSimulations,
  thresholds,
  onUpdateThresholds,
  onUpdateSim,
  onSelectSavedSim,
  onDuplicateSim,
  onDeleteSim,
  formatKzVal,
}) => {
  const currentSim = useMemo(() => normalizeSimulation(rawCurrentSim), [rawCurrentSim]);
  const [selectedSellThroughPct, setSelectedSellThroughPct] = useState<number>(100);
  const [sensitivityVar, setSensitivityVar] = useState<SensitivityVariable>('frete_kg');
  const [customFreightSteps, setCustomFreightSteps] = useState<number[]>(() =>
    buildDefaultFreightSteps(normalizeSimulation(rawCurrentSim))
  );
  const [comparatorSort, setComparatorSort] = useState<ComparatorSortKey>('maior_margem');
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);

  const baseCurr: CurrencyCode = currentSim.baseCurrency || 'AOA';
  const baseSymbol = getCurrencySymbol(baseCurr);
  const purchaseCurr: CurrencyCode = currentSim.purchaseCurrency || 'USD';
  const purchaseCurrDisplay = getCurrencyDisplayCode(purchaseCurr);
  const freightCurr: CurrencyCode = currentSim.freightCurrency || 'AOA';
  const freightCurrDisplay = getCurrencyDisplayCode(freightCurr);
  const freightSymbol = getCurrencySymbol(freightCurr);
  const isFreightPerKg = currentSim.transportMethod === 'aereo_kg';

  // Keep freight sensitivity steps aligned when simulation id, freight currency, transport method, or active freight rate changes
  useEffect(() => {
    setCustomFreightSteps(buildDefaultFreightSteps(currentSim));
  }, [
    currentSim.id,
    currentSim.freightCurrency,
    currentSim.transportMethod,
    currentSim.freightRatePerKgKz,
    currentSim.fixedFreightCostKz,
  ]);

  const costUnitForScenarios =
    currentSim.costBasisForPricing === 'posto'
      ? metrics.landedCostUnitKz
      : metrics.fullCostUnitKz;

  const qty =
    currentSim.desiredQuantity && currentSim.desiredQuantity > 0
      ? currentSim.desiredQuantity
      : 0;

  // Auto-generate scenario prices when not custom
  const effectiveScenarios = useMemo(() => {
    const baseCost = costUnitForScenarios ?? 0;
    const defaultMultipliers = [1.15, 1.28, 1.42, 1.7];
    return currentSim.priceScenarios.map((scen, idx) => {
      const autoPrice =
        baseCost > 0
          ? applyRounding(baseCost * (defaultMultipliers[idx] || 1.4), currentSim.roundingMode)
          : null;
      const salePrice = scen.isCustom && scen.salePriceKz !== null ? scen.salePriceKz : autoPrice;
      const profitUnit =
        salePrice !== null && costUnitForScenarios !== null
          ? salePrice - costUnitForScenarios
          : null;
      const profitTotal = profitUnit !== null && qty > 0 ? profitUnit * qty : null;
      const marginPct =
        salePrice !== null && salePrice > 0 && profitUnit !== null
          ? (profitUnit / salePrice) * 100
          : null;
      const markupPct =
        costUnitForScenarios !== null && costUnitForScenarios > 0 && profitUnit !== null
          ? (profitUnit / costUnitForScenarios) * 100
          : null;
      return {
        ...scen,
        effectivePrice: salePrice,
        profitUnit,
        profitTotal,
        marginPct,
        markupPct,
      };
    });
  }, [currentSim.priceScenarios, currentSim.roundingMode, costUnitForScenarios, qty]);

  // 11. Simulação de Escoamento do Stock (25%, 50%, 75%, 100%)
  // Distingue claramente:
  // A) Lucro das Unidades Vendidas = Receita Vendida - Custo das Unidades Vendidas
  // B) Saldo de Caixa / Recuperação do Lote = Receita Vendida - Investimento Total Realizado até ao momento
  // C) Stock Remanescente = Unidades em Stock e seu Valor de Custo Posto em Armazém
  const sellThroughRows = useMemo(() => {
    const rates = [25, 50, 75, 100];
    const price = metrics.effectiveSalePriceKz;
    const landedUnit = metrics.landedCostUnitKz;
    const landedTotal = metrics.landedCostTotalKz;
    const useFullCostBasis = currentSim.costBasisForPricing !== 'posto';

    return rates.map((pct) => {
      const unitsSold = qty > 0 ? Math.round((qty * pct) / 100) : 0;
      const unitsRemaining = qty > 0 ? Math.max(0, qty - unitsSold) : 0;
      const revenue = price !== null && qty > 0 ? price * unitsSold : null;

      // Custo proporcional das unidades vendidas:
      // (Unidades Vendidas × Custo Posto Unitário) + Despesas Comerciais Proporcionais às Unidades Vendidas
      const proportionalCommercialKz =
        qty > 0 && revenue !== null
          ? (unitsSold / qty) * metrics.commercialFixedBatchKz +
            unitsSold * metrics.commercialFixedUnitKz +
            revenue * (metrics.commercialPercentTotalRate / 100)
          : 0;

      const costOfSoldUnits =
        landedUnit !== null && qty > 0
          ? landedUnit * unitsSold + (useFullCostBasis ? proportionalCommercialKz : 0)
          : null;

      const profitOnSoldUnits =
        revenue !== null && costOfSoldUnits !== null ? revenue - costOfSoldUnits : null;

      const marginOnSoldUnits =
        revenue !== null && revenue > 0 && profitOnSoldUnits !== null
          ? (profitOnSoldUnits / revenue) * 100
          : null;

      // Investimento realizado no lote até ao momento:
      // Custo Posto Total do Lote + Despesas Comerciais Fixas + Despesas Variáveis sobre as vendas realizadas
      const batchInvestedSoFar =
        landedTotal !== null
          ? landedTotal +
            (useFullCostBasis
              ? metrics.commercialFixedTotalKz +
                (revenue !== null ? revenue * (metrics.commercialPercentTotalRate / 100) : 0)
              : 0)
          : null;

      const cashBalanceAfterSales =
        revenue !== null && batchInvestedSoFar !== null ? revenue - batchInvestedSoFar : null;

      const roiOnBatch =
        batchInvestedSoFar !== null && batchInvestedSoFar > 0 && cashBalanceAfterSales !== null
          ? (cashBalanceAfterSales / batchInvestedSoFar) * 100
          : null;

      // Valor de custo do stock remanescente (avaliado pelo Custo Posto Unitário em armazém)
      const remainingStockCostKz =
        landedUnit !== null && qty > 0 ? unitsRemaining * landedUnit : null;

      return {
        pct,
        unitsSold,
        unitsRemaining,
        revenue,
        costOfSoldUnits,
        profitOnSoldUnits,
        marginOnSoldUnits,
        batchInvestedSoFar,
        cashBalanceAfterSales,
        roiOnBatch,
        remainingStockCostKz,
      };
    });
  }, [qty, currentSim.costBasisForPricing, metrics]);

  // Moeda ativa para teste de sensibilidade cambial
  const activeSensitivityForeignCurr: CurrencyCode = useMemo(() => {
    if (purchaseCurr !== baseCurr) return purchaseCurr;
    if (freightCurr !== baseCurr) return freightCurr;
    return baseCurr === 'USD' ? 'EUR' : 'USD';
  }, [purchaseCurr, freightCurr, baseCurr]);

  const activeSensitivityForeignDisplay = getCurrencyDisplayCode(activeSensitivityForeignCurr);

  // 12. Análise de Sensibilidade Multimoeda
  const sensitivityRows = useMemo(() => {
    if (sensitivityVar === 'frete_kg') {
      return customFreightSteps.map((rateVal) => {
        const clone: ImportSimulation = isFreightPerKg
          ? {
              ...currentSim,
              transportMethod: 'aereo_kg',
              freightRatePerKgKz: rateVal,
            }
          : {
              ...currentSim,
              fixedFreightCostKz: rateVal,
            };
        const m = computeSimulationMetrics(clone, thresholds);
        const unitSuffix = isFreightPerKg ? '/kg' : ' (lote)';
        const formattedStep =
          freightCurr === 'AOA'
            ? `${rateVal.toLocaleString('pt-AO')} Kz${unitSuffix}`
            : `${formatOriginalCurrency(rateVal, freightCurr)}${unitSuffix}`;

        const convertedNote =
          freightCurr !== baseCurr && m.freightTotalKz !== null
            ? ` → ${formatKzVal(m.freightTotalKz)}`
            : '';

        return {
          label: `${formattedStep}${convertedNote}`,
          isCurrent: isFreightPerKg
            ? currentSim.freightRatePerKgKz === rateVal
            : currentSim.fixedFreightCostKz === rateVal,
          rawVal: rateVal,
          metrics: m,
        };
      });
    }

    if (sensitivityVar === 'cambio') {
      const targetCurr = activeSensitivityForeignCurr;
      const activeEx =
        currentSim.exchangeRates?.[targetCurr] ??
        (targetCurr === 'USD' ? currentSim.exchangeRateUsdToKz : null) ??
        925;
      const steps = [
        Math.round(activeEx * 0.9),
        Math.round(activeEx * 0.95),
        activeEx,
        Math.round(activeEx * 1.05),
        Math.round(activeEx * 1.15),
      ];
      return steps.map((exRate) => {
        const clone: ImportSimulation = {
          ...currentSim,
          exchangeRates: {
            ...currentSim.exchangeRates,
            [targetCurr]: exRate,
          },
          exchangeRateUsdToKz:
            targetCurr === 'USD' ? exRate : currentSim.exchangeRateUsdToKz,
        };
        const m = computeSimulationMetrics(clone, thresholds);
        return {
          label: `1 ${activeSensitivityForeignDisplay} = ${exRate.toLocaleString('pt-AO')} ${baseSymbol}`,
          isCurrent: activeEx === exRate,
          rawVal: exRate,
          metrics: m,
        };
      });
    }

    if (sensitivityVar === 'preco_origem') {
      const baseOrig = currentSim.unitPriceUsd || 10;
      const multipliers = [0.8, 0.9, 1.0, 1.1, 1.25];
      return multipliers.map((mult) => {
        const origVal = Math.round(baseOrig * mult * 100) / 100;
        const clone: ImportSimulation = {
          ...currentSim,
          unitPriceUsd: origVal,
        };
        const m = computeSimulationMetrics(clone, thresholds);
        return {
          label: formatOriginalCurrency(origVal, purchaseCurr),
          isCurrent: mult === 1.0,
          rawVal: origVal,
          metrics: m,
        };
      });
    }

    if (sensitivityVar === 'impostos') {
      const agtRates = [0, 5, 10, 14, 20];
      const currentAgt = currentSim.taxes.find((t) => t.id === 'tax-agt');
      const currentAgtVal = currentAgt && currentAgt.enabled ? currentAgt.value ?? 0 : 0;
      return agtRates.map((pct) => {
        const clone: ImportSimulation = {
          ...currentSim,
          taxes: currentSim.taxes.map((t) =>
            t.id === 'tax-agt' ? { ...t, enabled: pct > 0, value: pct } : t
          ),
        };
        const m = computeSimulationMetrics(clone, thresholds);
        return {
          label: `Imposto AGT ${pct}%`,
          isCurrent: currentAgtVal === pct,
          rawVal: pct,
          metrics: m,
        };
      });
    }

    // preco_venda
    const baseSale = metrics.effectiveSalePriceKz || 25000;
    const steps = [0.8, 0.9, 1.0, 1.15, 1.3].map((mult) =>
      applyRounding(baseSale * mult, currentSim.roundingMode)
    );
    return steps.map((sPrice) => {
      const clone: ImportSimulation = {
        ...currentSim,
        pricingMode: 'preco_venda',
        simulatedSalePriceKz: sPrice,
      };
      const m = computeSimulationMetrics(clone, thresholds);
      return {
        label: `${sPrice.toLocaleString('pt-AO')} ${baseSymbol}`,
        isCurrent: sPrice === metrics.effectiveSalePriceKz,
        rawVal: sPrice,
        metrics: m,
      };
    });
  }, [
    currentSim,
    sensitivityVar,
    customFreightSteps,
    thresholds,
    metrics.effectiveSalePriceKz,
    purchaseCurr,
    freightCurr,
    baseCurr,
    baseSymbol,
    isFreightPerKg,
    activeSensitivityForeignCurr,
    activeSensitivityForeignDisplay,
    formatKzVal,
  ]);

  // 14. Comparador de Produtos ordenável
  const comparedSimulations = useMemo(() => {
    const list = savedSimulations.map((rawSim) => {
      const sim = normalizeSimulation(rawSim);
      const m = computeSimulationMetrics(sim, thresholds);
      const riskScore =
        m.classification === 'Boa oportunidade'
          ? 1
          : m.classification === 'Margem apertada'
          ? 2
          : m.classification === 'Alto risco'
          ? 3
          : 4;
      return {
        sim,
        m,
        riskScore,
      };
    });

    return list.sort((a, b) => {
      switch (comparatorSort) {
        case 'maior_margem':
          return (b.m.marginPercent ?? -999) - (a.m.marginPercent ?? -999);
        case 'maior_roi':
          return (b.m.roiPercent ?? -999) - (a.m.roiPercent ?? -999);
        case 'menor_investimento':
          return (a.m.fullCostTotalKz ?? 999999999) - (b.m.fullCostTotalKz ?? 999999999);
        case 'menor_custo_unitario':
          return (a.m.fullCostUnitKz ?? 999999999) - (b.m.fullCostUnitKz ?? 999999999);
        case 'menor_risco':
          if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
          return (b.m.roiPercent ?? 0) - (a.m.roiPercent ?? 0);
        default:
          return 0;
      }
    });
  }, [savedSimulations, thresholds, comparatorSort]);

  const selectedSellRow =
    sellThroughRows.find((r) => r.pct === selectedSellThroughPct) ?? sellThroughRows[3];

  return (
    <div className="space-y-8">
      {/* ====================================================================
          ETAPA 4: CENÁRIOS, PONTO DE EQUILÍBRIO, ESCOAMENTO, SENSIBILIDADE E COMPARADOR
          ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-dm-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dm-muted block">
              Etapa 4 · Análise de Viabilidade, Escoamento & Comparação
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-dm-text mt-0.5">
              Cenários de Preço, Ponto de Equilíbrio, Escoamento do Stock e Sensibilidade
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-dm-muted">
            Simulações parciais, testes de stress e resumo final consolidado
          </span>
        </div>

        {/* CENÁRIOS DE PREÇO & PONTO DE EQUILÍBRIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Cenários de Preço (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                      10. Cenários de Preço (Editáveis na Moeda-Base {baseSymbol})
                    </h3>
                    <SimulatorHelpTooltip helpKey="sec_cenarios_preco" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                    Custo base considerado:{' '}
                    <strong className="font-mono tabular-nums text-slate-800 dark:text-dm-text">
                      {formatKzVal(costUnitForScenarios)}
                    </strong>{' '}
                    ({currentSim.costBasisForPricing === 'completo' ? 'Custo Completo' : 'Custo Posto'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSim((prev) => ({
                      ...prev,
                      priceScenarios: prev.priceScenarios.map((s) => ({
                        ...s,
                        isCustom: false,
                        salePriceKz: null,
                      })),
                    }))
                  }
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-slate-100 dark:bg-dm-page rounded-lg border border-transparent dark:border-dm-border transition-colors cursor-pointer"
                  title="Recalcular cenários automaticamente com base no custo atual"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recalcular Automático</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dm-border text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
                      <th className="py-2.5 px-3">Cenário</th>
                      <th className="py-2.5 px-3">Preço de Venda ({baseSymbol})</th>
                      <th className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1">
                          <span>Lucro / un.</span>
                          <SimulatorHelpTooltip helpKey="lucro_por_unidade" />
                        </span>
                      </th>
                      <th className="py-2.5 px-3 text-right">Lucro Total</th>
                      <th className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1">
                          <span>Margem</span>
                          <SimulatorHelpTooltip helpKey="margem_lucro" />
                        </span>
                      </th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dm-border">
                    {effectiveScenarios.map((scen) => {
                      const isSelectedPrice =
                        scen.effectivePrice !== null &&
                        metrics.effectiveSalePriceKz === scen.effectivePrice;
                      return (
                        <tr key={scen.id} className="hover:bg-slate-50/70 dark:hover:bg-dm-elevated">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 dark:text-dm-text block">
                              {scen.label}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-dm-muted">
                              {scen.description}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={scen.effectivePrice ?? ''}
                              placeholder="Não informado"
                              onChange={(e) => {
                                const val =
                                  e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                                onUpdateSim((prev) => ({
                                  ...prev,
                                  priceScenarios: prev.priceScenarios.map((item) =>
                                    item.id === scen.id
                                      ? { ...item, salePriceKz: val, isCustom: true }
                                      : item
                                  ),
                                }));
                              }}
                              className="w-32 h-9 px-2.5 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-dm-text focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                            {scen.profitUnit === null ? (
                              <span className="text-slate-400 dark:text-dm-muted">Não informado</span>
                            ) : (
                              <span
                                className={
                                  scen.profitUnit >= 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {formatKzVal(scen.profitUnit)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-dm-text">
                            {formatKzVal(scen.profitTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                            {scen.marginPct === null ? (
                              <span className="text-slate-400 dark:text-dm-muted">—</span>
                            ) : (
                              <span
                                className={
                                  scen.marginPct >= thresholds.goodMarginMinPercent
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : scen.marginPct >= thresholds.tightMarginMinPercent
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {scen.marginPct.toFixed(1).replace('.', ',')}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isSelectedPrice ? (
                              <PositiveBadge label="Em uso" />
                            ) : (
                              <button
                                type="button"
                                disabled={scen.effectivePrice === null}
                                onClick={() => {
                                  if (scen.effectivePrice !== null) {
                                    onUpdateSim((prev) => ({
                                      ...prev,
                                      pricingMode: 'preco_venda',
                                      simulatedSalePriceKz: scen.effectivePrice,
                                    }));
                                  }
                                }}
                                className="dm-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 cursor-pointer"
                              >
                                Usar preço
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ponto de Equilíbrio (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                    11. Ponto de Equilíbrio (Break-Even)
                  </h3>
                  <SimulatorHelpTooltip helpKey="sec_ponto_equilibrio" />
                </div>
                <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                  Recuperação do investimento total consolidado em {baseSymbol}
                </p>
              </div>

              {metrics.breakEvenUnits !== null && qty > 0 ? (
                <div className="space-y-4 pt-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-dm-muted">
                      Unidades para empatar o capital:
                    </span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text">
                      {metrics.breakEvenUnits} de {qty} un.
                    </span>
                  </div>

                  {/* Progress bar of break-even inside batch */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-dm-page rounded-full overflow-hidden border border-slate-200/60 dark:border-dm-border">
                      <div
                        className={`h-full transition-all ${
                          metrics.breakEvenUnits <= qty * 0.7
                            ? 'bg-emerald-500 dark:bg-dm-text'
                            : metrics.breakEvenUnits <= qty
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((metrics.breakEvenUnits / qty) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-dm-muted">
                      <span>0 un.</span>
                      <span>
                        Equilíbrio: {metrics.breakEvenUnits} un. (
                        {Math.round((metrics.breakEvenUnits / qty) * 100)}% do stock)
                      </span>
                      <span>{qty} un.</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/80 dark:border-dm-border space-y-2 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-dm-text leading-relaxed">
                      “Precisas vender aproximadamente{' '}
                      <span className="font-mono tabular-nums underline">{metrics.breakEvenUnits} unidades</span>{' '}
                      para recuperar o investimento considerado.”
                    </p>
                    {metrics.breakEvenUnits < qty ? (
                      <p className="text-slate-600 dark:text-dm-muted leading-relaxed">
                        “Após{' '}
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-dm-text">
                          {metrics.breakEvenUnits} unidades
                        </span>
                        , as restantes{' '}
                        <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                          {qty - metrics.breakEvenUnits} vendas
                        </span>{' '}
                        passam a gerar resultado positivo sobre o lote inteiro.”
                      </p>
                    ) : (
                      <p className="text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                        Atenção: O preço atual exige vender mais unidades ({metrics.breakEvenUnits}) do
                        que a quantidade total do lote ({qty}) para recuperar o investimento.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-dm-muted">
                  Não informado — insira os custos, a quantidade e o preço de venda para calcular o
                  ponto de equilíbrio.
                </div>
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 dark:border-dm-border flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-dm-muted">
                <span>Preço Mínimo (Lucro Zero):</span>
                <SimulatorHelpTooltip helpKey="preco_minimo_empate" />
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text">
                {formatKzVal(metrics.minimumSalePriceBreakevenKz)}
              </span>
            </div>
          </div>
        </div>

        {/* RENTABILIDADE E SIMULAÇÃO DE ESCOAMENTO DO STOCK (25%, 50%, 75%, 100%) */}
        <div className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-dm-border">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  12. Rentabilidade por Taxa de Escoamento do Stock (25% • 50% • 75% • 100%)
                </h3>
                <SimulatorHelpTooltip helpKey="sec_escoamento_stock" />
              </div>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                Distingue o <strong>Lucro das Unidades Vendidas</strong> do{' '}
                <strong>Saldo de Caixa / Recuperação do Lote</strong> e do{' '}
                <strong>Stock Remanescente</strong> ({baseSymbol})
              </p>
            </div>

            <div className="inline-flex p-1 bg-slate-100 dark:bg-dm-page rounded-lg border border-slate-200/60 dark:border-dm-border self-start">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSelectedSellThroughPct(pct)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSellThroughPct === pct
                      ? 'bg-white dark:bg-dm-surface text-slate-900 dark:text-dm-text shadow-2xs'
                      : 'text-slate-500 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text'
                  }`}
                >
                  {pct}% vendido
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {sellThroughRows.map((row) => {
              const isSelected = row.pct === selectedSellThroughPct;
              const unitProfitPositive = row.profitOnSoldUnits !== null && row.profitOnSoldUnits > 0;
              const cashPositive = row.cashBalanceAfterSales !== null && row.cashBalanceAfterSales >= 0;

              return (
                <div
                  key={row.pct}
                  onClick={() => setSelectedSellThroughPct(row.pct)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-50/90 dark:bg-dm-page border-slate-900 dark:border-dm-text'
                      : 'bg-white dark:bg-dm-surface border-slate-200/80 dark:border-dm-border hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-dm-text">
                        {row.pct}% do Stock Vendido
                      </span>
                      <span className="text-xs font-mono tabular-nums font-semibold text-slate-600 dark:text-dm-muted">
                        {row.unitsSold} / {qty} un.
                      </span>
                    </div>

                    {/* Bloco A: Resultado Operacional das Unidades Vendidas */}
                    <div className="space-y-2 text-xs pt-2.5 border-t border-slate-100 dark:border-dm-border">
                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-dm-muted">
                          <span>Receita vendida:</span>
                          <SimulatorHelpTooltip helpKey="escoamento_receita" />
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                          {formatKzVal(row.revenue)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-dm-muted">
                          <span>Custo das vendidas:</span>
                          <SimulatorHelpTooltip helpKey="escoamento_custo_vendidas" />
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-dm-muted">
                          {formatKzVal(row.costOfSoldUnits)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-dm-text">
                          <span>Lucro das vendidas:</span>
                          <SimulatorHelpTooltip helpKey="escoamento_lucro_vendidas" />
                        </span>
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            row.profitOnSoldUnits === null
                              ? 'text-slate-400'
                              : unitProfitPositive
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {row.profitOnSoldUnits !== null && row.profitOnSoldUnits > 0 ? '+' : ''}
                          {formatKzVal(row.profitOnSoldUnits)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-dm-muted">
                          <span>Margem das vendidas:</span>
                          <SimulatorHelpTooltip helpKey="escoamento_margem" />
                        </span>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-dm-text">
                          {row.marginOnSoldUnits !== null
                            ? `${row.marginOnSoldUnits.toFixed(1).replace('.', ',')}%`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Bloco B: Saldo de Caixa / Recuperação do Lote */}
                    <div className="space-y-2 text-xs pt-2.5 mt-2.5 border-t border-dashed border-slate-200 dark:border-dm-border">
                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-dm-text">
                          <span>Saldo de caixa (lote):</span>
                          <SimulatorHelpTooltip helpKey="escoamento_saldo_caixa" />
                        </span>
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            row.cashBalanceAfterSales === null
                              ? 'text-slate-400'
                              : cashPositive
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {row.cashBalanceAfterSales !== null && row.cashBalanceAfterSales > 0
                            ? '+'
                            : ''}
                          {formatKzVal(row.cashBalanceAfterSales)}
                        </span>
                      </div>

                      {row.cashBalanceAfterSales !== null && row.cashBalanceAfterSales < 0 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                          Por recuperar do lote:{' '}
                          <strong className="font-mono tabular-nums">
                            {formatKzVal(Math.abs(row.cashBalanceAfterSales))}
                          </strong>
                        </p>
                      ) : row.cashBalanceAfterSales !== null ? (
                        <div className="flex justify-between items-center text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-dm-muted">
                            <span>ROI recuperado no lote:</span>
                            <SimulatorHelpTooltip helpKey="roi_indicador" />
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                            +{row.roiOnBatch !== null ? row.roiOnBatch.toFixed(1).replace('.', ',') : '0,0'}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Bloco C: Stock Remanescente */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-dm-border flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-dm-muted">
                      <span>Em stock ({row.unitsRemaining} un.):</span>
                      <SimulatorHelpTooltip helpKey="escoamento_stock_remanescente" />
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-dm-text">
                      {formatKzVal(row.remainingStockCostKz)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicação detalhada do cenário de escoamento selecionado */}
          {selectedSellRow && selectedSellRow.revenue !== null && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/80 dark:border-dm-border text-xs text-slate-600 dark:text-dm-muted flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-dm-text">
                  Leitura do cenário de {selectedSellRow.pct}% ({selectedSellRow.unitsSold} vendidas ·{' '}
                  {selectedSellRow.unitsRemaining} em stock):
                </p>
                <p>
                  As <strong>{selectedSellRow.unitsSold} unidades vendidas</strong> geram receita de{' '}
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-dm-text">
                    {formatKzVal(selectedSellRow.revenue)}
                  </strong>{' '}
                  para um custo proporcional de{' '}
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-dm-text">
                    {formatKzVal(selectedSellRow.costOfSoldUnits)}
                  </strong>
                  , resultando num <strong>lucro das unidades vendidas</strong> de{' '}
                  <strong className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {selectedSellRow.profitOnSoldUnits !== null &&
                    selectedSellRow.profitOnSoldUnits > 0
                      ? '+'
                      : ''}
                    {formatKzVal(selectedSellRow.profitOnSoldUnits)}
                  </strong>
                  .
                </p>
              </div>
              <div className="md:text-right shrink-0 space-y-1">
                <span className="block text-xs">
                  Saldo de caixa frente ao lote ({formatKzVal(selectedSellRow.batchInvestedSoFar)}):{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      (selectedSellRow.cashBalanceAfterSales ?? 0) >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {(selectedSellRow.cashBalanceAfterSales ?? 0) > 0 ? '+' : ''}
                    {formatKzVal(selectedSellRow.cashBalanceAfterSales)}
                  </strong>
                </span>
                <span className="block text-xs">
                  Valor de custo ainda em stock ({selectedSellRow.unitsRemaining} un.):{' '}
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-dm-text">
                    {formatKzVal(selectedSellRow.remainingStockCostKz)}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ANÁLISE DE SENSIBILIDADE */}
        <div className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-dm-border">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  13. Análise de Sensibilidade (Teste de Stress Multimoeda)
                </h3>
                <SimulatorHelpTooltip helpKey="sec_sensibilidade" />
              </div>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                Simule o impacto de oscilações no frete ({freightCurrDisplay}), câmbio (
                {activeSensitivityForeignDisplay} → {baseSymbol}), preço de compra (
                {purchaseCurrDisplay}), impostos ou preço de venda
              </p>
            </div>

            <div className="inline-flex flex-wrap p-1 bg-slate-100 dark:bg-dm-page rounded-lg border border-slate-200/60 dark:border-dm-border gap-1">
              {(
                [
                  {
                    id: 'frete_kg',
                    label: isFreightPerKg
                      ? `Frete / kg (${freightCurrDisplay})`
                      : `Frete Lote (${freightCurrDisplay})`,
                  },
                  {
                    id: 'cambio',
                    label: `Câmbio ${activeSensitivityForeignDisplay} → ${baseSymbol}`,
                  },
                  { id: 'preco_origem', label: `Preço Fornecedor (${purchaseCurrDisplay})` },
                  { id: 'impostos', label: 'Impostos (%)' },
                  { id: 'preco_venda', label: `Preço de Venda (${baseSymbol})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSensitivityVar(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    sensitivityVar === tab.id
                      ? 'bg-white dark:bg-dm-surface text-slate-900 dark:text-dm-text shadow-2xs'
                      : 'text-slate-500 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {sensitivityVar === 'frete_kg' && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-dm-page p-3 rounded-xl border border-slate-200/70 dark:border-dm-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-600 dark:text-dm-muted font-medium">
                  Escalões de Frete (
                  {isFreightPerKg ? `${freightSymbol}/kg` : `${freightSymbol} fixo`}) editáveis:
                </span>
                {customFreightSteps.map((stepVal, idx) => (
                  <div key={idx} className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={freightCurr === 'AOA' ? 500 : 1}
                      value={stepVal}
                      onChange={(e) => {
                        const next = [...customFreightSteps];
                        next[idx] = Math.max(0, Number(e.target.value) || 0);
                        setCustomFreightSteps(next);
                      }}
                      className="w-24 h-9 px-2.5 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-xs text-slate-900 dark:text-dm-text"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCustomFreightSteps(buildDefaultFreightSteps(currentSim))}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-white dark:bg-dm-surface rounded-lg border border-slate-200/70 dark:border-dm-border cursor-pointer"
                title="Repor escalões padrão para a moeda de frete atual"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repor escalões ({freightCurrDisplay})</span>
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dm-border text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
                  <th className="py-2.5 px-3">Cenário Testado</th>
                  <th className="py-2.5 px-3 text-right">Custo Posto / un.</th>
                  <th className="py-2.5 px-3 text-right">Custo Completo / un.</th>
                  <th className="py-2.5 px-3 text-right">Investimento Total</th>
                  <th className="py-2.5 px-3 text-right">Lucro / un.</th>
                  <th className="py-2.5 px-3 text-right">Lucro Total</th>
                  <th className="py-2.5 px-3 text-right">Margem</th>
                  <th className="py-2.5 px-3 text-right">ROI</th>
                  <th className="py-2.5 px-3 text-center">Orçamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dm-border">
                {sensitivityRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.isCurrent
                        ? 'bg-slate-100/80 dark:bg-dm-elevated font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-dm-elevated'
                    }
                  >
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-900 dark:text-dm-text">
                      {row.label}{' '}
                      {row.isCurrent && (
                        <span className="ml-1.5 text-xs font-sans text-slate-500 dark:text-dm-muted">
                          (Atual)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-dm-text">
                      {formatKzVal(row.metrics.landedCostUnitKz)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                      {formatKzVal(row.metrics.fullCostUnitKz)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-dm-text">
                      {formatKzVal(row.metrics.fullCostTotalKz)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${
                        (row.metrics.profitPerUnitKz ?? 0) >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatKzVal(row.metrics.profitPerUnitKz)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                      {formatKzVal(row.metrics.totalProfitKz)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {row.metrics.marginPercent !== null
                        ? `${row.metrics.marginPercent.toFixed(1).replace('.', ',')}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {row.metrics.roiPercent !== null
                        ? `${row.metrics.roiPercent.toFixed(1).replace('.', ',')}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.metrics.fitsInBudget === null ? (
                        <span className="text-slate-400">—</span>
                      ) : row.metrics.fitsInBudget ? (
                        <PositiveBadge label="Cabe" />
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Excede {formatKzVal(row.metrics.budgetExceededByKz)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAINEL EXECUTIVO DE RESULTADO FINAL */}
        <div
          id="sim-final-result-panel"
          className="bg-white dark:bg-dm-surface border border-slate-200/90 dark:border-dm-border rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-dm-border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-dm-text">
                  14. Resultado Final Consolidado ({baseSymbol})
                </h3>
                <SimulatorHelpTooltip helpKey="sec_resultado_final" />
                <span className="text-xs text-slate-500 dark:text-dm-muted">
                  ·{' '}
                  {currentSim.overallProvenance === 'estimativa'
                    ? 'Valores com Estimativa'
                    : 'Valores Informados'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                Resumo consolidado na moeda-base ({baseSymbol}) preservando o registo das moedas de
                origem ({purchaseCurrDisplay}, {freightCurrDisplay}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowThresholdConfig(!showThresholdConfig)}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-slate-100 dark:bg-dm-page rounded-lg border border-transparent dark:border-dm-border transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Critérios de Classificação</span>
              </button>
            </div>
          </div>

          {/* Configuração dos critérios de classificação */}
          {showThresholdConfig && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1.5 min-h-[20px]">
                  Margem Mín. "Boa Oportunidade" (%)
                </label>
                <input
                  type="number"
                  value={thresholds.goodMarginMinPercent}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      goodMarginMinPercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1.5 min-h-[20px]">
                  ROI Mín. "Boa Oportunidade" (%)
                </label>
                <input
                  type="number"
                  value={thresholds.goodRoiMinPercent}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      goodRoiMinPercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1.5 min-h-[20px]">
                  Margem Mín. "Margem Apertada" (%)
                </label>
                <input
                  type="number"
                  value={thresholds.tightMarginMinPercent}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      tightMarginMinPercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1.5 min-h-[20px]">
                  ROI Mín. "Margem Apertada" (%)
                </label>
                <input
                  type="number"
                  value={thresholds.tightRoiMinPercent}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      tightRoiMinPercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text"
                />
              </div>
            </div>
          )}

          {/* Grid de Indicadores Finais conforme especificação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted block">
                PRODUTO
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-dm-text mt-1 block truncate">
                {currentSim.productName.trim() || 'Não informado'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>ORÇAMENTO ({baseSymbol})</span>
                <SimulatorHelpTooltip helpKey="capital_disponivel" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {formatKzVal(currentSim.availableBudgetKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>QUANTIDADE POSSÍVEL</span>
                <SimulatorHelpTooltip helpKey="quantidade_desejada" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {currentSim.desiredQuantity !== null
                  ? `${currentSim.desiredQuantity} unidades${
                      metrics.recommendedQuantityForBudget !== null
                        ? ` (Máx: ${metrics.recommendedQuantityForBudget} un.)`
                        : ''
                    }`
                  : 'Não informado'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>CUSTO POSTO / UN.</span>
                <SimulatorHelpTooltip helpKey="custo_posto_unitario" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {formatKzVal(metrics.landedCostUnitKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>CUSTO COMPLETO / UN.</span>
                <SimulatorHelpTooltip helpKey="custo_completo_unitario" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {formatKzVal(metrics.fullCostUnitKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>PREÇO DE VENDA SIMULADO</span>
                <SimulatorHelpTooltip helpKey="preco_venda_input" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {formatKzVal(metrics.effectiveSalePriceKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>LUCRO / UN.</span>
                <SimulatorHelpTooltip helpKey="lucro_por_unidade" />
              </span>
              <span
                className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                  metrics.profitPerUnitKz === null
                    ? 'text-slate-400 dark:text-dm-muted'
                    : metrics.profitPerUnitKz >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatKzVal(metrics.profitPerUnitKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>LUCRO TOTAL (100% LOTE)</span>
                <SimulatorHelpTooltip helpKey="card_lucro_liquido" />
              </span>
              <span
                className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                  metrics.totalProfitKz === null
                    ? 'text-slate-400 dark:text-dm-muted'
                    : metrics.totalProfitKz >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatKzVal(metrics.totalProfitKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>MARGEM</span>
                <SimulatorHelpTooltip helpKey="margem_lucro" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {metrics.marginPercent !== null
                  ? `${metrics.marginPercent.toFixed(1).replace('.', ',')}%`
                  : 'Não informado'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>ROI</span>
                <SimulatorHelpTooltip helpKey="roi_indicador" />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1 block">
                {metrics.roiPercent !== null
                  ? `${metrics.roiPercent.toFixed(1).replace('.', ',')}%`
                  : 'Não informado'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>CAPITAL RESTANTE</span>
                <SimulatorHelpTooltip helpKey="capital_restante" />
              </span>
              <span
                className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                  metrics.remainingCapitalKz === null
                    ? 'text-slate-400 dark:text-dm-muted'
                    : metrics.remainingCapitalKz >= 0
                    ? 'text-slate-900 dark:text-dm-text'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatKzVal(metrics.remainingCapitalKz)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-dm-page border border-slate-200/60 dark:border-dm-border flex flex-col justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dm-muted">
                <span>CLASSIFICAÇÃO FINANCEIRA</span>
                <SimulatorHelpTooltip helpKey="classificacao_financeira" />
              </span>
              <div className="mt-1">
                {metrics.classification === 'Boa oportunidade' ? (
                  <PositiveBadge label="Boa oportunidade" />
                ) : metrics.classification === 'Margem apertada' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Margem apertada
                  </span>
                ) : metrics.classification === 'Alto risco' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alto risco
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 dark:text-dm-muted">
                    Dados insuficientes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nota explicativa da classificação */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border text-xs text-slate-600 dark:text-dm-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              {metrics.classificationReasons.map((reason, idx) => (
                <p key={idx} className="font-medium text-slate-800 dark:text-dm-text">
                  • {reason}
                </p>
              ))}
            </div>
            <span className="text-xs italic text-slate-400 dark:text-dm-muted shrink-0">
              Nota: Avalia apenas a viabilidade financeira dos dados inseridos; não garante procura
              comercial.
            </span>
          </div>
        </div>

        {/* COMPARADOR DE PRODUTOS E SIMULAÇÕES GUARDADAS */}
        <div
          id="sim-comparator-section"
          className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl overflow-hidden shadow-xs"
        >
          <div className="p-5 border-b border-slate-100 dark:border-dm-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  15. Comparador de Produtos & Simulações Guardadas ({comparedSimulations.length})
                </h3>
                <SimulatorHelpTooltip helpKey="sec_comparador" />
              </div>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                Compare produtos lado a lado consolidados na moeda-base, com indicação da moeda de
                origem do produto e do frete
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-dm-muted" />
              <span className="text-xs text-slate-500 dark:text-dm-muted">Ordenar por:</span>
              <select
                id="select-comparator-sort"
                value={comparatorSort}
                onChange={(e) => setComparatorSort(e.target.value as ComparatorSortKey)}
                className="h-9 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none"
              >
                <option value="maior_margem">Maior margem</option>
                <option value="maior_roi">Maior ROI</option>
                <option value="menor_investimento">Menor investimento</option>
                <option value="menor_custo_unitario">Menor custo unitário</option>
                <option value="menor_risco">Menor risco financeiro</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-dm-surface border-b border-slate-200 dark:border-dm-border text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
                  <th className="py-3 px-4">Produto & Moedas Origem</th>
                  <th className="py-3 px-4 text-right">Qtd.</th>
                  <th className="py-3 px-4 text-right">Peso Total</th>
                  <th className="py-3 px-4 text-right">Custo Unit. (Completo)</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-right">Capital / Investimento</th>
                  <th className="py-3 px-4 text-right">Lucro Potencial</th>
                  <th className="py-3 px-4 text-right">Margem</th>
                  <th className="py-3 px-4 text-right">ROI</th>
                  <th className="py-3 px-4 text-center">Classificação</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dm-border">
                {comparedSimulations.map(({ sim, m }) => {
                  const isActive = sim.id === currentSim.id;
                  return (
                    <tr
                      key={sim.id}
                      onClick={() => onSelectSavedSim(sim)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-slate-100/70 dark:bg-dm-elevated'
                          : 'hover:bg-slate-50/80 dark:hover:bg-dm-elevated'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-dm-text">
                            {sim.productName || 'Sem nome'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-dm-muted">
                            {sim.overallProvenance === 'estimativa' ? 'Estimativa' : 'Informado'} ·
                            Compra: {getCurrencyDisplayCode(sim.purchaseCurrency)} · Frete:{' '}
                            {getCurrencyDisplayCode(sim.freightCurrency)} → Base:{' '}
                            {getCurrencyDisplayCode(sim.baseCurrency)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-dm-text">
                        {sim.desiredQuantity ?? '—'} un.
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-dm-muted">
                        {m.chargeableWeightTotalKg !== null
                          ? `${m.chargeableWeightTotalKg.toFixed(2)} kg`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                        {formatKzVal(m.fullCostUnitKz)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-dm-text">
                        {formatKzVal(m.effectiveSalePriceKz)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                        {formatKzVal(m.fullCostTotalKz)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                          (m.totalProfitKz ?? 0) >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatKzVal(m.totalProfitKz)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {m.marginPercent !== null
                          ? `${m.marginPercent.toFixed(1).replace('.', ',')}%`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {m.roiPercent !== null ? `${m.roiPercent.toFixed(1).replace('.', ',')}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.classification === 'Boa oportunidade' ? (
                          <PositiveBadge label="Boa oportunidade" />
                        ) : m.classification === 'Margem apertada' ? (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            Margem apertada
                          </span>
                        ) : m.classification === 'Alto risco' ? (
                          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            Alto risco
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Incompleto</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectSavedSim(sim)}
                            className="dm-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                          >
                            {isActive ? 'Aberta' : 'Ver detalhes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateSim(sim)}
                            title="Duplicar simulação para testar um parâmetro"
                            className="dm-icon-action p-1.5 text-slate-500 hover:text-slate-900 dark:text-dm-muted dark:hover:text-dm-text rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {savedSimulations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteSim(sim.id)}
                              title="Eliminar simulação"
                              className="dm-icon-action p-1.5 text-slate-500 hover:text-rose-600 dark:text-dm-muted dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
