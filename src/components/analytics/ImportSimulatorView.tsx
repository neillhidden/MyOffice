import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Package,
  DollarSign,
  Plane,
  Ship,
  Truck,
  Landmark,
  Megaphone,
  Wallet,
  Scale,
  Tag,
  Copy,
  Save,
  FilePlus2,
  AlertTriangle,
  Plus,
  Trash2,
  Coins,
  ArrowRightLeft,
} from 'lucide-react';
import {
  ImportSimulation,
  DataProvenance,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  TransportMethod,
  ChargeableWeightRule,
  PricingMode,
  RoundingMode,
  ClassificationThresholds,
  DEFAULT_CLASSIFICATION_THRESHOLDS,
  INITIAL_SIMULATIONS,
  createBlankSimulation,
  computeSimulationMetrics,
  applyRounding,
  getCurrencySymbol,
  getCurrencyDisplayCode,
  formatOriginalCurrency,
  normalizeSimulation,
} from '../../types/importSimulator';
import { useStock } from '../../context/StockContext';
import { PositiveBadge } from '../common/PositiveBadge';
import { ImportComparatorPanel } from './ImportComparatorPanel';
import { SimulatorHelpTooltip } from './SimulatorHelpTooltip';

const STORAGE_KEY_SIMS = 'myoffice_import_simulations_v2_multicurrency';
const STORAGE_KEY_THRESHOLDS = 'myoffice_import_thresholds_v1';

const TAX_HELP_MAP: Record<string, string> = {
  'tax-agt': 'tax_agt',
  'tax-direitos': 'tax_direitos',
  'tax-desalfandegamento': 'tax_desalfandegamento',
  'tax-transportadora': 'tax_transportadora',
  'tax-seguro': 'tax_seguro',
  'tax-outras': 'tax_outras',
};

const EXPENSE_HELP_MAP: Record<string, string> = {
  'exp-publicidade': 'exp_publicidade',
  'exp-embalagem': 'exp_embalagem',
  'exp-entrega': 'exp_entrega',
  'exp-comissao-vendedor': 'exp_comissao_vendedor',
  'exp-comissao-pagamento': 'exp_comissao_pagamento',
  'exp-outras': 'exp_outras',
};

export const ImportSimulatorView: React.FC = () => {
  const { suppliers } = useStock();

  const [savedSimulations, setSavedSimulations] = useState<ImportSimulation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SIMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => normalizeSimulation(s));
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SIMULATIONS.map((s) => normalizeSimulation(s));
  });

  const [thresholds, setThresholds] = useState<ClassificationThresholds>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
      if (raw) return { ...DEFAULT_CLASSIFICATION_THRESHOLDS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT_CLASSIFICATION_THRESHOLDS;
  });

  const [currentSim, setCurrentSim] = useState<ImportSimulation>(() =>
    normalizeSimulation(savedSimulations[0])
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showAllCurrenciesTable, setShowAllCurrenciesTable] = useState<boolean>(false);
  const [newTaxName, setNewTaxName] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIMS, JSON.stringify(savedSimulations));
    } catch {
      // ignore
    }
  }, [savedSimulations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(thresholds));
    } catch {
      // ignore
    }
  }, [thresholds]);

  const handleUpdateSim = (updater: (prev: ImportSimulation) => ImportSimulation) => {
    setCurrentSim((prev) => {
      const normalizedPrev = normalizeSimulation(prev);
      const updated = updater({ ...normalizedPrev, updatedAt: new Date().toISOString() });
      return normalizeSimulation(updated);
    });
  };

  const metrics = useMemo(
    () => computeSimulationMetrics(currentSim, thresholds),
    [currentSim, thresholds]
  );

  const baseCurr: CurrencyCode = currentSim.baseCurrency || 'AOA';
  const baseSymbol = getCurrencySymbol(baseCurr);
  const purchaseCurr: CurrencyCode = currentSim.purchaseCurrency || 'USD';
  const freightCurr: CurrencyCode = currentSim.freightCurrency || 'AOA';

  // Moedas estrangeiras ativamente em uso nesta simulação (para exibir câmbio direto no topo)
  const usedForeignCurrencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    if (purchaseCurr !== baseCurr) set.add(purchaseCurr);
    if (freightCurr !== baseCurr) set.add(freightCurr);
    currentSim.taxes.forEach((t) => {
      if (t.type === 'fixed_amount' && t.currency && t.currency !== baseCurr) {
        set.add(t.currency);
      }
    });
    currentSim.commercialExpenses.forEach((e) => {
      if (e.type !== 'percent_revenue' && e.currency && e.currency !== baseCurr) {
        set.add(e.currency);
      }
    });
    if (set.size === 0 && baseCurr !== 'USD') {
      set.add('USD');
    }
    return Array.from(set);
  }, [purchaseCurr, freightCurr, baseCurr, currentSim.taxes, currentSim.commercialExpenses]);

  // Formatador consistente para a Moeda-Base (padrão Kz / AOA)
  const formatBaseVal = (val: number | null | undefined): string => {
    if (val === null || val === undefined || !Number.isFinite(val)) {
      return 'Não informado';
    }
    const rounded = applyRounding(val, currentSim.roundingMode);
    if (currentSim.roundingMode === 'duas_casas') {
      return `${rounded.toLocaleString('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${baseSymbol}`;
    }
    return `${Math.round(rounded).toLocaleString('pt-AO')} ${baseSymbol}`;
  };

  const handleExchangeRateChange = (code: CurrencyCode, rawVal: string) => {
    const num = rawVal === '' ? null : Math.max(0, Number(rawVal));
    handleUpdateSim((prev) => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [code]: num,
      },
      exchangeRateUsdToKz: code === 'USD' ? num : prev.exchangeRateUsdToKz,
    }));
  };

  const handleSaveCurrentSimulation = () => {
    const nameToSave = currentSim.productName.trim() || 'Produto sem nome';
    const updatedSim: ImportSimulation = normalizeSimulation({
      ...currentSim,
      productName: nameToSave,
      updatedAt: new Date().toISOString(),
    });
    setCurrentSim(updatedSim);
    setSavedSimulations((prev) => {
      const exists = prev.some((s) => s.id === updatedSim.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedSim.id ? updatedSim : s));
      }
      return [updatedSim, ...prev];
    });
    setSaveFeedback('Simulação guardada com sucesso');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleCreateBlank = () => {
    const blank = createBlankSimulation();
    setCurrentSim(blank);
  };

  const handleDuplicateSimulation = (simToDup: ImportSimulation = currentSim) => {
    const copy: ImportSimulation = normalizeSimulation({
      ...JSON.parse(JSON.stringify(simToDup)),
      id: `sim-${Date.now()}`,
      productName: `${simToDup.productName || 'Produto'} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSavedSimulations((prev) => [copy, ...prev]);
    setCurrentSim(copy);
    setSaveFeedback('Simulação duplicada — altere qualquer parâmetro para comparar');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleDeleteSimulation = (id: string) => {
    setSavedSimulations((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (currentSim.id === id && filtered.length > 0) {
        setCurrentSim(normalizeSimulation(filtered[0]));
      }
      return filtered;
    });
  };

  const handleAddCustomTax = () => {
    const trimmed = newTaxName.trim();
    if (!trimmed) return;
    handleUpdateSim((prev) => ({
      ...prev,
      taxes: [
        ...prev.taxes,
        {
          id: `tax-custom-${Date.now()}`,
          name: trimmed,
          enabled: true,
          type: 'fixed_amount',
          currency: 'AOA',
          value: 0,
          provenance: 'informado',
        },
      ],
    }));
    setNewTaxName('');
  };

  const renderProvenanceToggle = (
    value: DataProvenance,
    onChange: (next: DataProvenance) => void
  ) => (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value === 'informado' ? 'estimativa' : 'informado')}
        title="Clique para alternar entre valor Informado pelo utilizador ou Estimativa"
        className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
          value === 'informado'
            ? 'bg-slate-100 dark:bg-dm-page text-slate-800 dark:text-dm-text border border-slate-200 dark:border-dm-border'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
        }`}
      >
        {value === 'informado' ? 'Informado' : 'Estimativa'}
      </button>
      <SimulatorHelpTooltip helpKey="natureza_dados" />
    </div>
  );

  return (
    <div id="import-simulator-view" className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dm-text tracking-tight">
            Simulador de Importação e Rentabilidade (Multimoeda)
          </h1>
          <p className="text-xs text-slate-600 dark:text-dm-muted mt-1 leading-relaxed">
            Separação entre Moeda de Origem (USD, EUR, CNY, ZAR, Kz) e Moeda-Base da Operação (
            {getCurrencyDisplayCode(baseCurr)}). Passe o rato ou toque em{' '}
            <span className="font-semibold text-slate-800 dark:text-dm-text">(?)</span> para ver a
            explicação de cada campo.
          </p>
        </div>

        {saveFeedback && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-dm-surface border border-emerald-200 dark:border-dm-border text-xs font-medium text-emerald-800 dark:text-dm-text flex items-center gap-2 shrink-0">
            <PositiveBadge label={saveFeedback} />
          </div>
        )}
      </div>

      {/* Cápsula Única de Topo (Seletor de Simulação | Origem dos Dados | Arredondamento | Ações) */}
      <div className="dm-filter-capsule bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-2xl p-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-y-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-dm-border">
          {/* Segmento 1: Simulação Ativa */}
          <div className="px-3 py-1 flex items-center gap-2 w-full sm:w-auto">
            <Calculator className="w-4 h-4 text-slate-400 dark:text-dm-muted shrink-0" />
            <span className="text-xs font-medium text-slate-600 dark:text-dm-muted whitespace-nowrap">
              Simulação:
            </span>
            <SimulatorHelpTooltip helpKey="simulacao_ativa" />
            <select
              id="select-active-simulation"
              value={
                savedSimulations.some((s) => s.id === currentSim.id) ? currentSim.id : '__custom__'
              }
              onChange={(e) => {
                const found = savedSimulations.find((s) => s.id === e.target.value);
                if (found) setCurrentSim(normalizeSimulation(found));
              }}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer min-w-[180px] flex-1"
            >
              {!savedSimulations.some((s) => s.id === currentSim.id) && (
                <option value="__custom__">
                  {currentSim.productName.trim() || 'Nova Simulação (Não guardada)'}
                </option>
              )}
              {savedSimulations.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.productName || 'Sem nome'} ({getCurrencyDisplayCode(sim.purchaseCurrency)} →{' '}
                  {getCurrencyDisplayCode(sim.baseCurrency)})
                </option>
              ))}
            </select>
          </div>

          {/* Segmento 2: Identificação global Informado vs Estimativa */}
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-dm-muted whitespace-nowrap">
              Natureza:
            </span>
            {renderProvenanceToggle(currentSim.overallProvenance, (next) =>
              handleUpdateSim((prev) => ({ ...prev, overallProvenance: next }))
            )}
          </div>

          {/* Segmento 3: Arredondamento Configurável */}
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-dm-muted whitespace-nowrap">
              Arredondamento:
            </span>
            <SimulatorHelpTooltip helpKey="arredondamento" />
            <select
              id="select-rounding-mode"
              value={currentSim.roundingMode}
              onChange={(e) =>
                handleUpdateSim((prev) => ({
                  ...prev,
                  roundingMode: e.target.value as RoundingMode,
                }))
              }
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              <option value="inteiro">Inteiro (1 {baseSymbol})</option>
              <option value="duas_casas">2 Casas Decimais</option>
              <option value="multiplo_50">Múltiplos de 50 {baseSymbol}</option>
              <option value="multiplo_100">Múltiplos de 100 {baseSymbol}</option>
            </select>
          </div>
        </div>

        {/* Botões de Ação na extremidade direita da cápsula */}
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-dm-border">
          <button
            type="button"
            id="btn-sim-blank"
            onClick={handleCreateBlank}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-xs font-medium text-slate-700 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-slate-100 dark:bg-dm-page rounded-xl border border-transparent dark:border-dm-border transition-colors cursor-pointer"
            title="Criar simulação limpa sem valores assumidos"
          >
            <FilePlus2 className="w-3.5 h-3.5 shrink-0" />
            <span>Nova em Branco</span>
          </button>

          <button
            type="button"
            id="btn-sim-duplicate"
            onClick={() => handleDuplicateSimulation(currentSim)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-xs font-medium text-slate-700 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-slate-100 dark:bg-dm-page rounded-xl border border-transparent dark:border-dm-border transition-colors cursor-pointer"
            title="Duplicar simulação atual e alterar apenas um parâmetro"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span>Duplicar</span>
          </button>

          <button
            type="button"
            id="btn-sim-save"
            onClick={handleSaveCurrentSimulation}
            className="dm-btn-primary inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer ml-auto sm:ml-0"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>Guardar Simulação</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          1. CONFIGURAÇÃO DE MOEDAS E TAXAS DE CÂMBIO (ARQUITETURA MULTIMOEDA)
          ==================================================================== */}
      <div
        id="sim-currency-config-card"
        className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-dm-border">
          <div className="flex items-center gap-2.5">
            <Coins className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  1. Configuração de Moedas & Taxas de Câmbio
                </h2>
                <SimulatorHelpTooltip helpKey="sec_moedas" />
              </div>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                Defina a Moeda de Origem da compra, a Moeda-Base de consolidação (Padrão: Kz / AOA)
                e as taxas de conversão
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {renderProvenanceToggle(currentSim.exchangeProvenance, (next) =>
              handleUpdateSim((prev) => ({ ...prev, exchangeProvenance: next }))
            )}
            <button
              type="button"
              onClick={() => setShowAllCurrenciesTable(!showAllCurrenciesTable)}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-600 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text bg-slate-100 dark:bg-dm-page rounded-lg border border-transparent dark:border-dm-border transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
              <span>
                {showAllCurrenciesTable
                  ? 'Mostrar apenas moedas ativas'
                  : 'Configurar todas as moedas (USD, EUR, CNY, ZAR...)'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start text-xs">
          {/* Moeda da Compra */}
          <div className="md:col-span-3 flex flex-col">
            <label
              htmlFor="select-purchase-currency"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
            >
              <span>Moeda da compra (Fornecedor)</span>
              <SimulatorHelpTooltip helpKey="moeda_compra" />
            </label>
            <select
              id="select-purchase-currency"
              value={purchaseCurr}
              onChange={(e) =>
                handleUpdateSim((prev) => ({
                  ...prev,
                  purchaseCurrency: e.target.value as CurrencyCode,
                }))
              }
              className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-semibold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Moeda-Base da Operação */}
          <div className="md:col-span-3 flex flex-col">
            <label
              htmlFor="select-base-currency"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
            >
              <span>Moeda-base (Consolidação)</span>
              <SimulatorHelpTooltip helpKey="moeda_base" />
            </label>
            <select
              id="select-base-currency"
              value={baseCurr}
              onChange={(e) =>
                handleUpdateSim((prev) => {
                  const nextBase = e.target.value as CurrencyCode;
                  return {
                    ...prev,
                    baseCurrency: nextBase,
                    exchangeRates: {
                      ...prev.exchangeRates,
                      [nextBase]: 1,
                    },
                  };
                })
              }
              className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-semibold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Taxas de Câmbio das Moedas em Uso */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(showAllCurrenciesTable
              ? SUPPORTED_CURRENCIES.filter((c) => c.code !== baseCurr).map((c) => c.code)
              : usedForeignCurrencies
            ).map((code) => {
              const rateVal = currentSim.exchangeRates?.[code] ?? null;
              const codeDisplay = getCurrencyDisplayCode(code);
              return (
                <div key={code} className="flex flex-col">
                  <label
                    htmlFor={`input-exchange-rate-${code.toLowerCase()}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>
                      Taxa de câmbio ({codeDisplay} → {baseSymbol})
                    </span>
                    <SimulatorHelpTooltip helpKey="taxa_cambio" />
                  </label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border">
                    <span className="font-mono font-semibold text-slate-700 dark:text-dm-text whitespace-nowrap">
                      1 {codeDisplay} =
                    </span>
                    <input
                      id={`input-exchange-rate-${code.toLowerCase()}`}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Não informado"
                      value={rateVal ?? ''}
                      onChange={(e) => handleExchangeRateChange(code, e.target.value)}
                      className="w-full h-7 px-2 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text focus:outline-none"
                    />
                    <span className="font-mono font-semibold text-slate-600 dark:text-dm-muted shrink-0">
                      {baseSymbol}
                    </span>
                  </div>
                </div>
              );
            })}
            {usedForeignCurrencies.length === 0 && !showAllCurrenciesTable && (
              <div className="sm:col-span-2 h-10 mt-6 px-3.5 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border text-slate-600 dark:text-dm-muted flex items-center">
                <span>
                  Todos os custos atuais estão na moeda-base ({getCurrencyDisplayCode(baseCurr)}) —
                  sem conversão cambial necessária.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo Rápido de Topo (4 Cartões Principais Consolidados na Moeda-Base) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                <span>Custo Posto (Lote)</span>
                <SimulatorHelpTooltip helpKey="card_custo_posto" />
              </span>
              <span className="text-xs text-slate-500 dark:text-dm-muted font-mono tabular-nums">
                Unit: {formatBaseVal(metrics.landedCostUnitKz)}
              </span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-2">
              {formatBaseVal(metrics.landedCostTotalKz)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-2 pt-2 border-t border-slate-100 dark:border-dm-border">
            Mercadoria + Frete + Impostos ({baseSymbol})
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                <span>Investimento Completo</span>
                <SimulatorHelpTooltip helpKey="card_investimento_completo" />
              </span>
              <span className="text-xs text-slate-500 dark:text-dm-muted font-mono tabular-nums">
                Unit: {formatBaseVal(metrics.fullCostUnitKz)}
              </span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-2">
              {formatBaseVal(metrics.fullCostTotalKz)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-2 pt-2 border-t border-slate-100 dark:border-dm-border">
            Custo Posto + Comerciais ({formatBaseVal(metrics.commercialExpensesTotalKz)})
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                <span>Lucro Líquido (100%)</span>
                <SimulatorHelpTooltip helpKey="card_lucro_liquido" />
              </span>
              <span className="text-xs font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                Unit: {formatBaseVal(metrics.profitPerUnitKz)}
              </span>
            </div>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-2 ${
                metrics.totalProfitKz === null
                  ? 'text-slate-400 dark:text-dm-muted'
                  : metrics.totalProfitKz >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBaseVal(metrics.totalProfitKz)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-2 pt-2 border-t border-slate-100 dark:border-dm-border font-mono tabular-nums">
            Margem:{' '}
            {metrics.marginPercent !== null
              ? `${metrics.marginPercent.toFixed(1).replace('.', ',')}%`
              : 'Não informado'}{' '}
            · ROI:{' '}
            {metrics.roiPercent !== null
              ? `${metrics.roiPercent.toFixed(1).replace('.', ',')}%`
              : 'Não informado'}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                <span>Saldo de Orçamento</span>
                <SimulatorHelpTooltip helpKey="card_saldo_orcamento" />
              </span>
              {metrics.fitsInBudget !== null &&
                (metrics.fitsInBudget ? (
                  <PositiveBadge label="Dentro do orçamento" />
                ) : (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Excedido
                  </span>
                ))}
            </div>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-2 ${
                metrics.remainingCapitalKz === null
                  ? 'text-slate-400 dark:text-dm-muted'
                  : metrics.remainingCapitalKz >= 0
                  ? 'text-slate-900 dark:text-dm-text'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBaseVal(metrics.remainingCapitalKz)}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-2 pt-2 border-t border-slate-100 dark:border-dm-border">
            Máx. no orçamento:{' '}
            <strong className="font-mono tabular-nums text-slate-700 dark:text-dm-text">
              {metrics.recommendedQuantityForBudget !== null
                ? `${metrics.recommendedQuantityForBudget} unidades`
                : 'Não informado'}
            </strong>
          </p>
        </div>
      </div>

      {/* ====================================================================
          ETAPA 1: PRODUTO, TRANSPORTE INTERNACIONAL & CONVERSÃO CENTRALIZADA
          ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/80 dark:border-dm-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
            Etapa 1 — Dados do Produto, Transporte Internacional & Conversão de Moedas
          </h2>
          <span className="text-xs text-slate-500 dark:text-dm-muted">
            Preencha os custos na moeda de origem; o sistema converte tudo para {baseSymbol}
          </span>
        </div>

        {/* Par 1: Dados do Produto (6 cols) + Transporte Internacional (6 cols) lado a lado com alturas equilibradas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* DADOS DO PRODUTO */}
          <div className="lg:col-span-6 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                        2. Dados do Produto & Mercadoria
                      </h3>
                      <SimulatorHelpTooltip helpKey="sec_dados_produto" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                      Identificação, quantidades, peso unitário e dimensões da embalagem
                    </p>
                  </div>
                </div>
                {renderProvenanceToggle(currentSim.unitPriceProvenance, (next) =>
                  handleUpdateSim((prev) => ({ ...prev, unitPriceProvenance: next }))
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                <div className="sm:col-span-7">
                  <label
                    htmlFor="input-sim-product-name"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>Nome do produto</span>
                    <SimulatorHelpTooltip helpKey="nome_produto" />
                  </label>
                  <input
                    id="input-sim-product-name"
                    type="text"
                    placeholder="Ex: Kit Skincare, Mini Seladora..."
                    value={currentSim.productName}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({ ...prev, productName: e.target.value }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg text-slate-900 dark:text-dm-text font-medium focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label
                    htmlFor="input-sim-supplier"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>Fornecedor</span>
                    <SimulatorHelpTooltip helpKey="fornecedor" />
                  </label>
                  <input
                    id="input-sim-supplier"
                    type="text"
                    list="sim-suppliers-datalist"
                    placeholder="Não informado"
                    value={currentSim.supplierName}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({ ...prev, supplierName: e.target.value }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                  <datalist id="sim-suppliers-datalist">
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.name} />
                    ))}
                  </datalist>
                </div>

                {/* Padrão de Campo Monetário Internacional para Preço por Unidade */}
                <div className="sm:col-span-12 p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border space-y-2">
                  <label
                    htmlFor="input-sim-price-usd"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-dm-text"
                  >
                    <span>Preço unitário do produto (Moeda de Origem)</span>
                    <SimulatorHelpTooltip helpKey="preco_unitario_origem" />
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="input-sim-price-usd"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Não informado"
                      value={currentSim.unitPriceUsd ?? ''}
                      onChange={(e) =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          unitPriceUsd:
                            e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="flex-1 h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text focus:outline-none"
                    />
                    <select
                      aria-label="Moeda do preço unitário"
                      value={purchaseCurr}
                      onChange={(e) =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          purchaseCurrency: e.target.value as CurrencyCode,
                        }))
                      }
                      className="h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono font-bold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-dm-muted pt-1">
                    <span>
                      {purchaseCurr === baseCurr
                        ? `Mesma moeda-base (${baseSymbol}) — sem conversão`
                        : `Conversão: ${formatOriginalCurrency(
                            currentSim.unitPriceUsd,
                            purchaseCurr
                          )} × ${
                            metrics.unitProductMonetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'
                          } ${baseSymbol}`}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                      Equivalente: {formatBaseVal(metrics.unitPriceKz)} / un.
                    </span>
                  </div>
                </div>

                {/* MOQ, Quantidade Desejada e Peso Bruto em 3 colunas alinhadas pelo topo */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="input-sim-moq"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>MOQ (Mínimo)</span>
                    <SimulatorHelpTooltip helpKey="moq" />
                  </label>
                  <input
                    id="input-sim-moq"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Não informado"
                    value={currentSim.moq ?? ''}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        moq: e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="input-sim-quantity"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>Quantidade (un.)</span>
                    <SimulatorHelpTooltip helpKey="quantidade_desejada" />
                  </label>
                  <input
                    id="input-sim-quantity"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Não informado"
                    value={currentSim.desiredQuantity ?? ''}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        desiredQuantity:
                          e.target.value === ''
                            ? null
                            : Math.max(1, Math.round(Number(e.target.value))),
                      }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="input-sim-weight-kg"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>Peso bruto / un. (kg)</span>
                    <SimulatorHelpTooltip helpKey="peso_bruto_unitario" />
                  </label>
                  <input
                    id="input-sim-weight-kg"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Não informado"
                    value={currentSim.grossWeightPerUnitKg ?? ''}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        grossWeightPerUnitKg:
                          e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                </div>

                {/* Dimensões da embalagem (cm) */}
                <div className="sm:col-span-12">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]">
                    <span>
                      Dimensões da embalagem por unidade (cm) — Comprimento × Largura × Altura
                    </span>
                    <SimulatorHelpTooltip helpKey="dimensoes_embalagem" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="Comp. (cm)"
                      value={currentSim.packageLengthCm ?? ''}
                      onChange={(e) =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          packageLengthCm:
                            e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="Larg. (cm)"
                      value={currentSim.packageWidthCm ?? ''}
                      onChange={(e) =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          packageWidthCm:
                            e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="Alt. (cm)"
                      value={currentSim.packageHeightCm ?? ''}
                      onChange={(e) =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          packageHeightCm:
                            e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {metrics.isBelowMoq && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    A quantidade desejada ({currentSim.desiredQuantity} un.) é inferior ao MOQ do
                    fornecedor ({currentSim.moq} un.).
                  </span>
                </div>
              )}
            </div>

            {/* Resumo Duplo da Mercadoria (Moeda Original + Moeda-Base) */}
            <div className="pt-4 border-t border-slate-100 dark:border-dm-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-dm-muted">
                  <span>Mercadoria Original ({getCurrencyDisplayCode(purchaseCurr)})</span>
                  <SimulatorHelpTooltip helpKey="mercadoria_original_convertida" />
                </span>
                <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text block mt-1">
                  {formatOriginalCurrency(metrics.merchandiseTotalOriginal, purchaseCurr)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-dm-muted">
                  <span>Mercadoria Convertida ({baseSymbol})</span>
                  <SimulatorHelpTooltip helpKey="mercadoria_original_convertida" />
                </span>
                <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text block mt-1">
                  {formatBaseVal(metrics.merchandiseTotalKz)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. TRANSPORTE INTERNACIONAL & PESO TAXÁVEL (MULTIMOEDA) */}
          <div className="lg:col-span-6 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                        3. Transporte Internacional & Peso Taxável
                      </h3>
                      <SimulatorHelpTooltip helpKey="sec_transporte" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                      Informe o frete na moeda em que foi cobrado (USD, EUR, CNY, Kz...)
                    </p>
                  </div>
                </div>
                {renderProvenanceToggle(currentSim.freightProvenance, (next) =>
                  handleUpdateSim((prev) => ({ ...prev, freightProvenance: next }))
                )}
              </div>

              {/* Escolha da modalidade — 2×2 em mobile/tablet e 4 botões uniformes sem cortar texto */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {(
                  [
                    {
                      id: 'aereo_kg',
                      label: 'Aéreo / kg',
                      icon: Plane,
                      helpKey: 'modalidade_aereo_kg',
                    },
                    {
                      id: 'maritimo',
                      label: 'Marítimo',
                      icon: Ship,
                      helpKey: 'modalidade_maritimo',
                    },
                    {
                      id: 'custo_fixo',
                      label: 'Custo fixo',
                      icon: Truck,
                      helpKey: 'modalidade_custo_fixo',
                    },
                    {
                      id: 'personalizado',
                      label: 'Personalizado',
                      icon: Scale,
                      helpKey: 'modalidade_personalizado',
                    },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = currentSim.transportMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        handleUpdateSim((prev) => ({
                          ...prev,
                          transportMethod: m.id as TransportMethod,
                        }))
                      }
                      className={`flex items-center justify-between gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-dm-text dark:text-dm-page dark:border-dm-text font-semibold'
                          : 'bg-slate-50 dark:bg-dm-page text-slate-700 dark:text-dm-muted border-slate-200 dark:border-dm-border hover:text-slate-900 dark:hover:text-dm-text'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 leading-tight text-left">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{m.label}</span>
                      </span>
                      <SimulatorHelpTooltip helpKey={m.helpKey} />
                    </button>
                  );
                })}
              </div>

              {/* Padrão de Campo Monetário Internacional para o Frete */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border space-y-2.5 text-xs">
                {currentSim.transportMethod === 'aereo_kg' ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="input-sim-freight-rate-kg"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-dm-text"
                      >
                        <span>Preço do transporte por kg</span>
                        <SimulatorHelpTooltip helpKey="preco_frete_kg" />
                      </label>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                        <span>Moeda do frete</span>
                        <SimulatorHelpTooltip helpKey="moeda_frete" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="input-sim-freight-rate-kg"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Não informado"
                        value={currentSim.freightRatePerKgKz ?? ''}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            freightRatePerKgKz:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="flex-1 h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text focus:outline-none"
                      />
                      <select
                        id="select-freight-currency"
                        aria-label="Moeda do transporte por kg"
                        value={freightCurr}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            freightCurrency: e.target.value as CurrencyCode,
                          }))
                        }
                        className="h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono font-bold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.shortLabel}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono font-semibold text-slate-500 dark:text-dm-muted shrink-0">
                        / kg
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="input-sim-fixed-freight"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-dm-text"
                      >
                        <span>
                          {currentSim.transportMethod === 'maritimo'
                            ? 'Custo total do frete (Marítimo)'
                            : currentSim.transportMethod === 'custo_fixo'
                            ? 'Custo fixo de transporte'
                            : 'Custo personalizado de transporte'}
                        </span>
                        <SimulatorHelpTooltip helpKey="custo_fixo_frete" />
                      </label>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                        <span>Moeda do frete</span>
                        <SimulatorHelpTooltip helpKey="moeda_frete" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="input-sim-fixed-freight"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Não informado"
                        value={currentSim.fixedFreightCostKz ?? ''}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            fixedFreightCostKz:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="flex-1 h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text focus:outline-none"
                      />
                      <select
                        id="select-freight-currency"
                        aria-label="Moeda do custo de frete"
                        value={freightCurr}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            freightCurrency: e.target.value as CurrencyCode,
                          }))
                        }
                        className="h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono font-bold text-slate-900 dark:text-dm-text focus:outline-none cursor-pointer"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.shortLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Se a moeda do frete for diferente da moeda-base, permitir editar rapidamente o câmbio aqui mesmo */}
                {freightCurr !== baseCurr && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-dm-border">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-dm-muted">
                      <span>
                        Taxa {getCurrencyDisplayCode(freightCurr)} → {baseSymbol}:
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={currentSim.exchangeRates?.[freightCurr] ?? ''}
                        onChange={(e) => handleExchangeRateChange(freightCurr, e.target.value)}
                        className="w-24 h-8 px-2 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text"
                      />
                      <span>{baseSymbol}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-dm-muted">
                      Conversão:{' '}
                      {metrics.freightOriginalTotal !== null
                        ? `${formatOriginalCurrency(metrics.freightOriginalTotal, freightCurr)} × ${
                            metrics.freightExchangeRateUsed?.toLocaleString('pt-AO') ?? '—'
                          } ${baseSymbol}`
                        : 'Não informado'}
                    </span>
                  </div>
                )}

                {/* Exibição obrigatória: Frete Original + Equivalente em Moeda-Base */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-dm-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 dark:text-dm-muted">
                    Frete original:{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-dm-text">
                      {formatOriginalCurrency(metrics.freightOriginalTotal, freightCurr)}
                    </strong>
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text">
                    Equivalente: {formatBaseVal(metrics.freightTotalKz)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                <div className="sm:col-span-5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]">
                    <span>Divisor volumétrico</span>
                    <SimulatorHelpTooltip helpKey="divisor_volumetrico" />
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={currentSim.volumetricDivisor}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        volumetricDivisor: Math.max(1, Number(e.target.value) || 5000),
                      }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-7">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]">
                    <span>Critério de peso cobrado</span>
                    <SimulatorHelpTooltip helpKey="criterio_peso" />
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'real', label: 'Real' },
                        { id: 'volumetrico', label: 'Volumétrico' },
                        { id: 'maior', label: 'Maior' },
                      ] as const
                    ).map((rule) => (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            chargeableWeightRule: rule.id as ChargeableWeightRule,
                          }))
                        }
                        className={`h-10 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          currentSim.chargeableWeightRule === rule.id
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-dm-text dark:text-dm-page dark:border-dm-text font-semibold'
                            : 'bg-slate-50 dark:bg-dm-page text-slate-600 dark:text-dm-muted border-slate-200 dark:border-dm-border'
                        }`}
                      >
                        {rule.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-dm-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-dm-muted">
                  <span>Peso Real</span>
                  <SimulatorHelpTooltip helpKey="peso_real_total" />
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text block mt-1">
                  {metrics.totalRealWeightKg !== null
                    ? `${metrics.totalRealWeightKg.toFixed(2).replace('.', ',')} kg`
                    : 'Não inf.'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-dm-muted">
                  <span>Volumétrico</span>
                  <SimulatorHelpTooltip helpKey="peso_volumetrico_total" />
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text block mt-1">
                  {metrics.totalVolumetricWeightKg !== null
                    ? `${metrics.totalVolumetricWeightKg.toFixed(2).replace('.', ',')} kg`
                    : 'Não inf.'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-dm-muted">
                  <span>Peso Cobrado</span>
                  <SimulatorHelpTooltip helpKey="peso_cobrado" />
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text block mt-1">
                  {metrics.chargeableWeightTotalKg !== null
                    ? `${metrics.chargeableWeightTotalKg.toFixed(2).replace('.', ',')} kg`
                    : 'Não inf.'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-dm-muted">
                  <span>Frete ({baseSymbol})</span>
                  <SimulatorHelpTooltip helpKey="frete_moeda_base" />
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text block mt-1">
                  {formatBaseVal(metrics.freightTotalKz)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CONVERSÃO CENTRALIZADA DE CUSTOS (LARGURA TOTAL LOGO ABAIXO DO PRODUTO E FRETE) */}
        <div className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-dm-border">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                    4. Conversão Centralizada de Custos (Moeda de Origem → {baseSymbol})
                  </h3>
                  <SimulatorHelpTooltip helpKey="sec_conversao_centralizada" />
                </div>
                <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                  Conferência direta de como o produto, o frete e as taxas são convertidos para a
                  moeda-base da operação
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dm-border text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
                  <th className="py-2.5 pr-4">Rubrica</th>
                  <th className="py-2.5 px-4 text-right">Valor Original (Moeda de Origem)</th>
                  <th className="py-2.5 px-4 text-right">Taxa de Câmbio Aplicada</th>
                  <th className="py-2.5 pl-4 text-right">Valor Convertido ({baseSymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dm-border font-mono tabular-nums">
                <tr>
                  <td className="py-2.5 pr-4 font-sans font-medium text-slate-800 dark:text-dm-text">
                    Produto (Unitário)
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-800 dark:text-dm-text">
                    {formatOriginalCurrency(
                      metrics.unitProductMonetary.amount,
                      metrics.unitProductMonetary.currency
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500 dark:text-dm-muted">
                    {metrics.unitProductMonetary.currency === baseCurr
                      ? '1 (Moeda-Base)'
                      : metrics.unitProductMonetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-slate-900 dark:text-dm-text">
                    {formatBaseVal(metrics.unitProductMonetary.baseAmount)}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 pr-4 font-sans font-medium text-slate-800 dark:text-dm-text">
                    Mercadoria (Lote Total)
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-800 dark:text-dm-text">
                    {formatOriginalCurrency(
                      metrics.merchandiseMonetary.amount,
                      metrics.merchandiseMonetary.currency
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500 dark:text-dm-muted">
                    {metrics.merchandiseMonetary.currency === baseCurr
                      ? '1 (Moeda-Base)'
                      : metrics.merchandiseMonetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-slate-900 dark:text-dm-text">
                    {formatBaseVal(metrics.merchandiseMonetary.baseAmount)}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 pr-4 font-sans font-medium text-slate-800 dark:text-dm-text">
                    Frete Internacional
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-800 dark:text-dm-text">
                    {formatOriginalCurrency(
                      metrics.freightTotalMonetary.amount,
                      metrics.freightTotalMonetary.currency
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500 dark:text-dm-muted">
                    {metrics.freightTotalMonetary.currency === baseCurr
                      ? '1 (Moeda-Base)'
                      : metrics.freightTotalMonetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-slate-900 dark:text-dm-text">
                    {formatBaseVal(metrics.freightTotalMonetary.baseAmount)}
                  </td>
                </tr>

                {metrics.taxesBreakdown
                  .filter((t) => t.enabled)
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4 font-sans text-slate-600 dark:text-dm-muted">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-800 dark:text-dm-text">
                        {t.type === 'percent'
                          ? `${t.monetary.amount ?? 0}%`
                          : formatOriginalCurrency(t.monetary.amount, t.monetary.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500 dark:text-dm-muted">
                        {t.type === 'percent' || t.monetary.currency === baseCurr
                          ? '1 (Moeda-Base)'
                          : t.monetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'}
                      </td>
                      <td className="py-2.5 pl-4 text-right font-semibold text-slate-900 dark:text-dm-text">
                        {formatBaseVal(t.amountKz)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ETAPA 2: IMPOSTOS, CUSTO POSTO EM ARMAZÉM & DESPESAS COMERCIAIS
          ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/80 dark:border-dm-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
            Etapa 2 — Impostos Aduaneiros, Custo Posto em Armazém & Despesas Comerciais
          </h2>
          <span className="text-xs text-slate-500 dark:text-dm-muted">
            O Custo Posto em Armazém consolida a aquisição do stock; as despesas comerciais ficam
            separadas
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 5. IMPOSTOS E TAXAS ADUANEIRAS + BASE TRIBUTÁVEL CONFIGURÁVEL (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                        5. Impostos, Taxas Aduaneiras & Base Tributável ({baseSymbol})
                      </h3>
                      <SimulatorHelpTooltip helpKey="sec_impostos_taxas" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                      Configure sobre quais custos incidem os impostos percentuais e a moeda de cada
                      taxa
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuração da Base Tributável */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-dm-text">
                    <span>Base Tributável (Incidência Percentual)</span>
                    <SimulatorHelpTooltip helpKey="base_tributavel" />
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text">
                    Valor Tributável: {formatBaseVal(metrics.taxableValueKz)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(
                    [
                      {
                        key: 'includeMerchandise',
                        label: 'Mercadoria',
                        helpKey: 'incidencia_mercadoria',
                      },
                      { key: 'includeFreight', label: 'Frete', helpKey: 'incidencia_frete' },
                      { key: 'includeInsurance', label: 'Seguro', helpKey: 'incidencia_seguro' },
                      {
                        key: 'includeOtherCosts',
                        label: 'Outros custos',
                        helpKey: 'incidencia_outros',
                      },
                    ] as const
                  ).map((item) => {
                    const checked = Boolean(currentSim.taxableBaseConfig?.[item.key]);
                    return (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? 'bg-white dark:bg-dm-surface border-slate-900 dark:border-dm-text font-semibold text-slate-900 dark:text-dm-text'
                            : 'bg-slate-100/60 dark:bg-dm-surface/40 border-slate-200 dark:border-dm-border text-slate-500 dark:text-dm-muted'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 leading-tight">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                taxableBaseConfig: {
                                  ...prev.taxableBaseConfig,
                                  [item.key]: e.target.checked,
                                },
                              }))
                            }
                            className="rounded border-slate-300 dark:border-dm-border shrink-0"
                          />
                          <span>{item.label}</span>
                        </span>
                        <SimulatorHelpTooltip helpKey={item.helpKey} />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Impostos e Taxas (colunas estáveis: Checkbox + Nome | Tipo | Valor | Moeda) */}
              <div className="space-y-2.5 text-xs">
                {currentSim.taxes.map((tax) => {
                  const computedItem = metrics.taxesBreakdown.find((b) => b.id === tax.id);
                  const isCustom = tax.id.startsWith('tax-custom-');
                  const specificHelpKey = TAX_HELP_MAP[tax.id] || 'item_imposto_taxa';
                  return (
                    <div
                      key={tax.id}
                      className={`p-3 rounded-xl border transition-colors space-y-2 ${
                        tax.enabled
                          ? 'bg-slate-50/90 dark:bg-dm-page border-slate-200 dark:border-dm-border'
                          : 'bg-white dark:bg-dm-surface border-slate-200/60 dark:border-dm-border/60 opacity-75'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <label className="sm:col-span-5 flex items-center gap-2 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={tax.enabled}
                            onChange={(e) =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                taxes: prev.taxes.map((t) =>
                                  t.id === tax.id ? { ...t, enabled: e.target.checked } : t
                                ),
                              }))
                            }
                            className="rounded border-slate-300 dark:border-dm-border shrink-0"
                          />
                          <span className="font-medium text-slate-800 dark:text-dm-text leading-snug">
                            {tax.name}
                          </span>
                          <SimulatorHelpTooltip helpKey={specificHelpKey} />
                        </label>

                        <div className="sm:col-span-7 flex items-center justify-end gap-1.5">
                          <select
                            value={tax.type}
                            onChange={(e) =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                taxes: prev.taxes.map((t) =>
                                  t.id === tax.id
                                    ? {
                                        ...t,
                                        type: e.target.value as 'percent' | 'fixed_amount',
                                      }
                                    : t
                                ),
                              }))
                            }
                            className="w-28 h-9 px-2 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg text-xs text-slate-700 dark:text-dm-text shrink-0"
                          >
                            <option value="percent">% Percentual</option>
                            <option value="fixed_amount">Valor Fixo</option>
                          </select>

                          <input
                            type="number"
                            min={0}
                            step={tax.type === 'percent' ? '0.5' : 'any'}
                            placeholder="Não inf."
                            value={tax.value ?? ''}
                            onChange={(e) => {
                              const val =
                                e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                              handleUpdateSim((prev) => ({
                                ...prev,
                                taxes: prev.taxes.map((t) =>
                                  t.id === tax.id
                                    ? {
                                        ...t,
                                        value: val,
                                        enabled: val !== null && val > 0 ? true : t.enabled,
                                      }
                                    : t
                                ),
                              }));
                            }}
                            className="w-24 h-9 px-2.5 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-xs text-right text-slate-900 dark:text-dm-text shrink-0"
                          />

                          {tax.type === 'fixed_amount' ? (
                            <select
                              aria-label={`Moeda para ${tax.name}`}
                              value={tax.currency || baseCurr}
                              onChange={(e) =>
                                handleUpdateSim((prev) => ({
                                  ...prev,
                                  taxes: prev.taxes.map((t) =>
                                    t.id === tax.id
                                      ? { ...t, currency: e.target.value as CurrencyCode }
                                      : t
                                  ),
                                }))
                              }
                              className="w-16 h-9 px-1.5 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono font-semibold text-xs text-slate-800 dark:text-dm-text cursor-pointer shrink-0"
                            >
                              {SUPPORTED_CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.shortLabel}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="w-16 h-9 inline-flex items-center justify-center font-mono text-xs text-slate-500 dark:text-dm-muted bg-slate-100/70 dark:bg-dm-surface/50 rounded-lg border border-slate-200/60 dark:border-dm-border shrink-0">
                              %
                            </span>
                          )}

                          {isCustom && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSim((prev) => ({
                                  ...prev,
                                  taxes: prev.taxes.filter((t) => t.id !== tax.id),
                                }))
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                              title="Remover taxa personalizada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Equivalente em Moeda-Base */}
                      {tax.enabled && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-dm-muted pt-1.5 border-t border-slate-200/50 dark:border-dm-border">
                          <span>
                            {tax.type === 'percent'
                              ? `Incide sobre valor tributável (${formatBaseVal(
                                  metrics.taxableValueKz
                                )})`
                              : tax.currency === baseCurr
                              ? `Moeda-base (${baseSymbol})`
                              : `Original: ${formatOriginalCurrency(
                                  tax.value,
                                  tax.currency
                                )} × Câmbio ${
                                  computedItem?.monetary.exchangeRate?.toLocaleString('pt-AO') ?? '—'
                                }`}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                            Equivalente: {formatBaseVal(computedItem?.amountKz ?? 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Adicionar nova taxa / custo de fornecedor em qualquer moeda */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar taxa (ex: Taxa fornecedor, Certificado...)"
                    value={newTaxName}
                    onChange={(e) => setNewTaxName(e.target.value)}
                    className="flex-1 h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg text-xs text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTax}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 bg-slate-100 dark:bg-dm-page hover:bg-slate-200 text-slate-800 dark:text-dm-text rounded-lg border border-slate-200 dark:border-dm-border text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Taxa</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Demonstrativo explícito: Mercadoria convertida + Frete convertido + Valor tributável + Impostos + Taxas = Custo Posto */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-dm-text mb-1">
                <span>Consolidação Aduaneira & Custo Posto em Armazém ({baseSymbol})</span>
                <SimulatorHelpTooltip helpKey="consolidacao_landed_cost" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-dm-muted">Mercadoria convertida:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-dm-text">
                  {formatBaseVal(metrics.merchandiseTotalKz)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-dm-muted">+ Frete convertido:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-dm-text">
                  {formatBaseVal(metrics.freightTotalKz)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-y border-dashed border-slate-200 dark:border-dm-border">
                <span className="font-semibold text-slate-700 dark:text-dm-text">
                  Valor tributável (conforme base selecionada):
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text">
                  {formatBaseVal(metrics.taxableValueKz)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-dm-muted">
                  + Impostos (AGT / Direitos):
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-dm-text">
                  {formatBaseVal(metrics.impostosTotalKz)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-dm-muted">
                  + Taxas aduaneiras e logísticas (Seguro, Desalfandegamento, Outras):
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-dm-text">
                  {formatBaseVal(metrics.taxasAduaneirasLogisticaKz)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-dm-border flex justify-between text-sm font-bold text-slate-900 dark:text-dm-text">
                <span>= Custo Total (Posto em Armazém):</span>
                <span className="font-mono tabular-nums">
                  {formatBaseVal(metrics.landedCostTotalKz)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. DESPESAS COMERCIAIS (SEPARADAS DO CUSTO DE IMPORTAÇÃO) (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                        6. Despesas Comerciais (Separadas do Stock)
                      </h3>
                      <SimulatorHelpTooltip helpKey="sec_despesas_comerciais" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                      Publicidade, embalagem, entrega e comissões não alteram o Custo Posto em
                      Armazém
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                  <span>Modo</span>
                  <SimulatorHelpTooltip helpKey="modo_despesa_comercial" />
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {currentSim.commercialExpenses.map((exp) => {
                  const expCurr = exp.currency || baseCurr;
                  const breakdownItem = metrics.commercialBreakdown.find((b) => b.id === exp.id);
                  const expHelpKey = EXPENSE_HELP_MAP[exp.id] || 'sec_despesas_comerciais';
                  return (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-xl border transition-colors space-y-2 ${
                        exp.enabled
                          ? 'bg-slate-50/90 dark:bg-dm-page border-slate-200 dark:border-dm-border'
                          : 'bg-white dark:bg-dm-surface border-slate-200/60 dark:border-dm-border/60 opacity-75'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <label className="sm:col-span-5 flex items-center gap-2 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={exp.enabled}
                            onChange={(e) =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                commercialExpenses: prev.commercialExpenses.map((item) =>
                                  item.id === exp.id ? { ...item, enabled: e.target.checked } : item
                                ),
                              }))
                            }
                            className="rounded border-slate-300 dark:border-dm-border shrink-0"
                          />
                          <span className="font-medium text-slate-800 dark:text-dm-text leading-snug">
                            {exp.name}
                          </span>
                          <SimulatorHelpTooltip helpKey={expHelpKey} />
                        </label>

                        <div className="sm:col-span-7 flex items-center justify-end gap-1.5">
                          <select
                            value={exp.type}
                            onChange={(e) =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                commercialExpenses: prev.commercialExpenses.map((item) =>
                                  item.id === exp.id
                                    ? {
                                        ...item,
                                        type: e.target.value as
                                          | 'fixed_total_kz'
                                          | 'fixed_unit_kz'
                                          | 'percent_revenue',
                                      }
                                    : item
                                ),
                              }))
                            }
                            className="w-28 h-9 px-2 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg text-xs text-slate-700 dark:text-dm-text shrink-0"
                          >
                            <option value="fixed_total_kz">Total (Lote)</option>
                            <option value="fixed_unit_kz">Por Unidade</option>
                            <option value="percent_revenue">% sobre Venda</option>
                          </select>

                          <input
                            type="number"
                            min={0}
                            step={exp.type === 'percent_revenue' ? '0.5' : 'any'}
                            placeholder="Não inf."
                            value={exp.value ?? ''}
                            onChange={(e) => {
                              const val =
                                e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                              handleUpdateSim((prev) => ({
                                ...prev,
                                commercialExpenses: prev.commercialExpenses.map((item) =>
                                  item.id === exp.id
                                    ? {
                                        ...item,
                                        value: val,
                                        enabled: val !== null && val > 0 ? true : item.enabled,
                                      }
                                    : item
                                ),
                              }));
                            }}
                            className="w-24 h-9 px-2.5 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums text-xs text-right text-slate-900 dark:text-dm-text shrink-0"
                          />

                          {exp.type !== 'percent_revenue' ? (
                            <select
                              value={expCurr}
                              onChange={(e) =>
                                handleUpdateSim((prev) => ({
                                  ...prev,
                                  commercialExpenses: prev.commercialExpenses.map((item) =>
                                    item.id === exp.id
                                      ? { ...item, currency: e.target.value as CurrencyCode }
                                      : item
                                  ),
                                }))
                              }
                              className="w-16 h-9 px-1.5 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono font-semibold text-xs text-slate-800 dark:text-dm-text cursor-pointer shrink-0"
                            >
                              {SUPPORTED_CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.shortLabel}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="w-16 h-9 inline-flex items-center justify-center font-mono text-xs text-slate-500 dark:text-dm-muted bg-slate-100/70 dark:bg-dm-surface/50 rounded-lg border border-slate-200/60 dark:border-dm-border shrink-0">
                              %
                            </span>
                          )}
                        </div>
                      </div>

                      {exp.enabled && exp.type !== 'percent_revenue' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-dm-muted pt-1.5 border-t border-slate-200/50 dark:border-dm-border">
                          <span>
                            {expCurr === baseCurr
                              ? `Moeda-base (${baseSymbol})`
                              : `Convertido de ${getCurrencyDisplayCode(expCurr)}`}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                            Equivalente (Lote): {formatBaseVal(breakdownItem?.totalBaseKz ?? 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                  <span>Custo de Importação (Stock)</span>
                  <SimulatorHelpTooltip helpKey="resumo_importacao_vs_comercial" />
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text text-sm block mt-1">
                  {formatBaseVal(metrics.landedCostTotalKz)}
                </span>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                  <span>Despesas Comerciais (Venda)</span>
                  <SimulatorHelpTooltip helpKey="resumo_importacao_vs_comercial" />
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text text-sm block mt-1">
                  {formatBaseVal(metrics.commercialExpensesTotalKz)} (
                  {formatBaseVal(metrics.commercialExpenseUnitKz)}/un.)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ETAPA 3: ORÇAMENTO, CUSTO UNITÁRIO CONSOLIDADO & PRECIFICAÇÃO
          ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/80 dark:border-dm-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dm-muted">
            Etapa 3 — Orçamento, Custo Unitário Consolidado & Precificação Inteligente
          </h2>
          <span className="text-xs text-slate-500 dark:text-dm-muted">
            Verifique se o lote cabe no capital disponível e defina o preço de venda ({baseSymbol})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 7. ORÇAMENTO & 8. CUSTO UNITÁRIO (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* 7. ORÇAMENTO */}
            <div className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-4 flex-1">
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <Wallet className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  7. Orçamento & Capital Disponível ({baseSymbol})
                </h3>
                <SimulatorHelpTooltip helpKey="sec_orcamento" />
              </div>

              <div className="text-xs space-y-3.5">
                <div>
                  <label
                    htmlFor="input-sim-budget-kz"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                  >
                    <span>Capital disponível para a operação ({baseSymbol})</span>
                    <SimulatorHelpTooltip helpKey="capital_disponivel" />
                  </label>
                  <input
                    id="input-sim-budget-kz"
                    type="number"
                    min={0}
                    step={5000}
                    placeholder="Ex: 200000"
                    value={currentSim.availableBudgetKz ?? ''}
                    onChange={(e) =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        availableBudgetKz:
                          e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                      <span>Capital Utilizado</span>
                      <SimulatorHelpTooltip helpKey="capital_utilizado" />
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-dm-text block mt-1">
                      {formatBaseVal(metrics.budgetUsedKz)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                      <span>Capital Restante</span>
                      <SimulatorHelpTooltip helpKey="capital_restante" />
                    </span>
                    <span
                      className={`font-mono tabular-nums font-bold block mt-1 ${
                        metrics.remainingCapitalKz !== null && metrics.remainingCapitalKz < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatBaseVal(metrics.remainingCapitalKz)}
                    </span>
                  </div>
                </div>

                {/* Mensagens obrigatórias de orçamento */}
                {metrics.fitsInBudget === false && metrics.budgetExceededByKz !== null && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 space-y-1">
                    <p className="font-bold">
                      “Esta operação ultrapassa o orçamento em{' '}
                      {formatBaseVal(metrics.budgetExceededByKz)}.”
                    </p>
                    {metrics.recommendedQuantityForBudget !== null && (
                      <p>
                        “Com este orçamento, a quantidade aproximada recomendada é{' '}
                        <strong className="font-mono tabular-nums underline">
                          {metrics.recommendedQuantityForBudget} unidades
                        </strong>
                        .”
                      </p>
                    )}
                  </div>
                )}

                {metrics.fitsInBudget === true && metrics.recommendedQuantityForBudget !== null && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border text-slate-700 dark:text-dm-text space-y-1">
                    <p>
                      “Com este orçamento, a quantidade aproximada recomendada é até{' '}
                      <strong className="font-mono tabular-nums">
                        {metrics.recommendedQuantityForBudget} unidades
                      </strong>{' '}
                      (pelo custo completo) ou{' '}
                      <strong className="font-mono tabular-nums">
                        {metrics.maxUnitsByLandedCost} unidades
                      </strong>{' '}
                      (apenas custo posto).”
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 8. CUSTO UNITÁRIO (POSTO VS COMPLETO) */}
            <div className="bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 space-y-3.5">
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-dm-border">
                <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                  8. Custo Unitário Consolidado ({baseSymbol})
                </h3>
                <SimulatorHelpTooltip helpKey="sec_custo_unitario_duplo" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200 dark:border-dm-border">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-dm-muted">
                    <span>Custo Posto Unitário</span>
                    <SimulatorHelpTooltip helpKey="custo_posto_unitario" />
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1.5 block">
                    {formatBaseVal(metrics.landedCostUnitKz)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-dm-muted block mt-1">
                    Custo de importação total ÷ qtd
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-900/20 dark:border-dm-text/40">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-dm-text">
                    <span>Custo Completo Unitário</span>
                    <SimulatorHelpTooltip helpKey="custo_completo_unitario" />
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-dm-text mt-1.5 block">
                    {formatBaseVal(metrics.fullCostUnitKz)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-dm-muted block mt-1">
                    (Importação + Comerciais) ÷ qtd
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 9. PRECIFICAÇÃO (MARKUP VS MARGEM) (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-dm-border">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-700 dark:text-dm-text shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-dm-text">
                        9. Precificação Inteligente na Moeda-Base ({baseSymbol})
                      </h3>
                      <SimulatorHelpTooltip helpKey="sec_precificacao" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-0.5">
                      Defina por preço de venda direto ou pela margem/markup pretendidos
                    </p>
                  </div>
                </div>

                {/* Base de Custo para Precificação */}
                <div className="inline-flex items-center gap-1.5">
                  <SimulatorHelpTooltip helpKey="base_custo_precificacao" />
                  <div className="inline-flex p-1 bg-slate-100 dark:bg-dm-page rounded-lg border border-slate-200/60 dark:border-dm-border text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSim((prev) => ({ ...prev, costBasisForPricing: 'completo' }))
                      }
                      className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                        currentSim.costBasisForPricing === 'completo'
                          ? 'bg-white dark:bg-dm-surface text-slate-900 dark:text-dm-text font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-dm-muted'
                      }`}
                    >
                      Sobre Custo Completo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSim((prev) => ({ ...prev, costBasisForPricing: 'posto' }))
                      }
                      className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                        currentSim.costBasisForPricing === 'posto'
                          ? 'bg-white dark:bg-dm-surface text-slate-900 dark:text-dm-text font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-dm-muted'
                      }`}
                    >
                      Sobre Custo Posto
                    </button>
                  </div>
                </div>
              </div>

              {/* Modos de Precificação: A) Preço de Venda | B) Margem Desejada | C) Markup Desejado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {(
                  [
                    { id: 'preco_venda', label: 'A) Informar Preço de Venda' },
                    { id: 'margem_desejada', label: 'B) Informar Margem (%)' },
                    { id: 'markup_desejado', label: 'C) Informar Markup (%)' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      handleUpdateSim((prev) => ({
                        ...prev,
                        pricingMode: mode.id as PricingMode,
                      }))
                    }
                    className={`min-h-[40px] py-2 px-3 rounded-lg border font-medium text-left transition-colors cursor-pointer ${
                      currentSim.pricingMode === mode.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-dm-text dark:text-dm-page dark:border-dm-text font-semibold'
                        : 'bg-slate-50 dark:bg-dm-page text-slate-700 dark:text-dm-muted border-slate-200 dark:border-dm-border'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Input dinâmico conforme modo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/80 dark:border-dm-border space-y-3 text-xs">
                {currentSim.pricingMode === 'preco_venda' && (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="input-sim-sale-price-kz"
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5 min-h-[20px]"
                      >
                        <span>Preço de venda por unidade ({baseSymbol})</span>
                        <SimulatorHelpTooltip helpKey="preco_venda_input" />
                      </label>
                      <input
                        id="input-sim-sale-price-kz"
                        type="number"
                        min={0}
                        step={500}
                        placeholder="Ex: 25000"
                        value={currentSim.simulatedSalePriceKz ?? ''}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            simulatedSalePriceKz:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-full h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text focus:outline-none"
                      />
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-xs text-slate-500 dark:text-dm-muted block">
                        Preço Recomendado (Margem ~30%)
                      </span>
                      <button
                        type="button"
                        disabled={metrics.recommendedSalePriceKz === null}
                        onClick={() =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            simulatedSalePriceKz: metrics.recommendedSalePriceKz,
                          }))
                        }
                        className="mt-1.5 inline-flex items-center h-9 px-3 rounded-lg bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-dm-text hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                      >
                        {formatBaseVal(metrics.recommendedSalePriceKz)} · Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {currentSim.pricingMode === 'margem_desejada' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted">
                        <span>Margem de Lucro Desejada sobre a Receita (%)</span>
                        <SimulatorHelpTooltip helpKey="margem_lucro" />
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[25, 30, 40, 50].map((presetPct) => (
                          <button
                            key={presetPct}
                            type="button"
                            onClick={() =>
                              handleUpdateSim((prev) => ({
                                ...prev,
                                targetMarginPercent: presetPct,
                              }))
                            }
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border font-mono tabular-nums text-xs font-semibold text-slate-800 dark:text-dm-text hover:bg-slate-100 cursor-pointer"
                          >
                            {presetPct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <input
                        type="number"
                        min={1}
                        max={95}
                        step="0.5"
                        value={currentSim.targetMarginPercent ?? ''}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            targetMarginPercent:
                              e.target.value === ''
                                ? null
                                : Math.min(95, Math.max(0, Number(e.target.value))),
                          }))
                        }
                        className="w-36 h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text"
                      />
                      <div>
                        <span className="text-xs text-slate-500 dark:text-dm-muted block">
                          Preço de Venda Necessário Calculado:
                        </span>
                        <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text">
                          {formatBaseVal(metrics.effectiveSalePriceKz)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {currentSim.pricingMode === 'markup_desejado' && (
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-dm-muted mb-1.5">
                        <span>Markup Desejado sobre o Custo (%)</span>
                        <SimulatorHelpTooltip helpKey="markup_lucro" />
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={currentSim.targetMarkupPercent ?? ''}
                        onChange={(e) =>
                          handleUpdateSim((prev) => ({
                            ...prev,
                            targetMarkupPercent:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-36 h-10 px-3 bg-white dark:bg-dm-surface border border-slate-200 dark:border-dm-border rounded-lg font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-dm-muted block">
                        Preço de Venda Calculado pelo Markup:
                      </span>
                      <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text">
                        {formatBaseVal(metrics.effectiveSalePriceKz)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Indicadores de Lucro, Margem vs Markup e ROI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                    <span>Preço Mínimo (Empate)</span>
                    <SimulatorHelpTooltip helpKey="preco_minimo_empate" />
                  </span>
                  <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text mt-1 block">
                    {formatBaseVal(metrics.minimumSalePriceBreakevenKz)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                    <span>Lucro por Unidade</span>
                    <SimulatorHelpTooltip helpKey="lucro_por_unidade" />
                  </span>
                  <span
                    className={`font-mono tabular-nums font-bold text-sm mt-1 block ${
                      metrics.profitPerUnitKz === null
                        ? 'text-slate-400'
                        : metrics.profitPerUnitKz >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatBaseVal(metrics.profitPerUnitKz)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                    <span>Margem (Lucro / Venda)</span>
                    <SimulatorHelpTooltip helpKey="margem_lucro" />
                  </span>
                  <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text mt-1 block">
                    {metrics.marginPercent !== null
                      ? `${metrics.marginPercent.toFixed(1).replace('.', ',')}%`
                      : 'Não informado'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dm-page border border-slate-200/70 dark:border-dm-border">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-dm-muted">
                    <span>Markup (Lucro / Custo)</span>
                    <SimulatorHelpTooltip helpKey="markup_lucro" />
                  </span>
                  <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-dm-text mt-1 block">
                    {metrics.markupPercent !== null
                      ? `${metrics.markupPercent.toFixed(1).replace('.', ',')}%`
                      : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-100 dark:border-dm-border flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-dm-muted">
              <span>
                <strong>Fórmulas:</strong> Margem = (Lucro ÷ Preço de Venda) × 100 · Markup = (Lucro
                ÷ Custo) × 100
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-dm-text">
                Receita Total (100%): {formatBaseVal(metrics.totalRevenueKz)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Etapa 4 — Cenários, Ponto de Equilíbrio, Escoamento, Sensibilidade, Resultado Final e Comparador */}
      <ImportComparatorPanel
        currentSim={currentSim}
        metrics={metrics}
        savedSimulations={savedSimulations}
        thresholds={thresholds}
        onUpdateThresholds={setThresholds}
        onUpdateSim={handleUpdateSim}
        onSelectSavedSim={(sim) => setCurrentSim(normalizeSimulation(sim))}
        onDuplicateSim={handleDuplicateSimulation}
        onDeleteSim={handleDeleteSimulation}
        formatKzVal={formatBaseVal}
      />
    </div>
  );
};
