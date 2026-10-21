import { statementAccountMatch } from '../../utils/statementAccounts';
import { isBankReceipt } from '../../utils/homeDocumentImport';
import React, { useRef, useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { HomeModal } from '../home/HomeModal';
import { readFinancialFile } from '../../utils/financialFileReader';
import { fileDocument } from '../../utils/financialDocuments';
import {
  ImportDraft,
  tableDrafts,
  textDrafts,
  validateDraft,
  readImportAmount,
} from '../../utils/homeDocumentImport';
import {
  applyBusinessReceipt,
  businessCurrency,
  businessReceiptMatches,
} from '../../utils/businessDocumentImport';
import { FINANCIAL_CATEGORIES } from './LancamentosView';
import { HomeDocument } from '../../types/home';
import { csvTable } from '../../utils/financialTables';
import { createId } from '../../utils/ids';
const input =
  'w-full min-w-0 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated p-2 text-sm';
const button =
  'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs disabled:opacity-40';
const panel =
  'rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-3';
type Choice = { match: string; budget: string; limit: string };
export function BusinessDocumentsView() {
  const stock = useStock();
  const banks = stock.banks.map((b) => ({
    ...b,
    companyId: stock.getCompanyForBank(b.id)?.id,
  }));
  const [bankId, setBankId] = useState(''),
    [rows, setRows] = useState<ImportDraft[]>([]),
    [choices, setChoices] = useState<Record<string, Choice>>({});
  const [file, setFile] = useState<File | null>(null),
    [fileHash, setFileHash] = useState(''),
    [source, setSource] = useState('');
  const [sheets, setSheets] = useState<{ name: string; table: string[][] }[]>(
      [],
    ),
    [sheet, setSheet] = useState(0);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false),
    [attach, setAttach] = useState(true);
  const abort = useRef<AbortController | null>(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  const bank = banks.find((b) => b.id === bankId),
    company = stock.companies.find((c) => c.id === bank?.companyId);
  const selected = rows.filter((r) => r.selected);
  const choice = (id: string) =>
    choices[id] || { match: '', budget: '', limit: '' };
  const choose = (id: string, key: keyof Choice, value: string) => {
    setChoices((old) => ({ ...old, [id]: { ...choice(id), [key]: value } }));
    setConfirm(false);
  };
  const change = (
    id: string,
    key: keyof ImportDraft,
    value: string | boolean,
  ) => {
    setRows((old) =>
      old.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    );
    setConfirm(false);
  };
  const propose = (text: string, table?: string[][]) => {
    let next = table
      ? tableDrafts(table)
      : /^(?:Data|Date)[;\t,]/i.test(text.trim())
        ? tableDrafts(csvTable(text))
        : textDrafts(text, 'statement');
    if (!next.length) {
      const receipt = textDrafts(text, 'receipt');
      if (receipt[0]?.amount) next = receipt;
    }
    setRows(next);
    setChoices({});
    setError(
      next.length
        ? ''
        : 'Não identifiquei movimentos. Corrige o texto ou adiciona uma linha manual.',
    );
  };
  const read = async (f: File) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError('');
    setMessage('A ler documento…');
    setRows([]);
    setChoices({});
    setFile(f);
    setSource('');
    setConfirm(false);
    setAttach(
      f.size <= 1024 * 1024 &&
        ['application/pdf', 'image/png', 'image/jpeg'].includes(f.type),
    );
    try {
      const result = await readFinancialFile(
        f,
        'statement',
        (m) => {
          if (mounted.current && abort.current === controller) setMessage(m);
        },
        controller.signal,
      );
      const digest = await crypto.subtle.digest(
        'SHA-256',
        await f.arrayBuffer(),
      );
      if (
        !mounted.current ||
        controller.signal.aborted ||
        abort.current !== controller
      )
        return;
      setFileHash(
        Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join(''),
      );
      setSource(result.text);
      if (!isBankReceipt(result.text)) {
        const match = statementAccountMatch(result.text, banks.filter((b) => b.status === 'ativo' || b.status === 'ativa'));
        if (match.accountId) setBankId(match.accountId);
      }
      setSheets(result.sheets || []);
      setSheet(0);
      if (result.drafts) {
        setRows(result.drafts);
        setChoices({});
      } else propose(result.text, result.sheets?.[0]?.table);
    } catch (e) {
      if (mounted.current && abort.current === controller)
        setError(e instanceof Error ? e.message : 'Não foi possível ler.');
    } finally {
      if (mounted.current && abort.current === controller) {
        setBusy(false);
        setMessage('');
      }
    }
  };
  const prepare = (
    movements = stock.bankMovements,
    tools = stock.businessDocuments,
    document?: HomeDocument,
  ) => {
    if (!bank) throw new Error('Escolhe uma conta empresarial.');
      if (!isBankReceipt(source)) {
        const identification = statementAccountMatch(source, banks.filter((b) => b.status === 'ativo' || b.status === 'ativa'));
        if (identification.identified && identification.accountId !== bankId) throw new Error('A conta indicada no extrato não corresponde a uma única conta empresarial selecionada. Confere o número da conta ou IBAN.');
      }

    if (!selected.length) throw new Error('Seleciona pelo menos um movimento.');
    let result = { movements, tools };
    for (const row of selected) {
      const c = choice(row.id);
      result = applyBusinessReceipt(
        banks,
        stock.companies,
        result.movements,
        result.tools,
        { ...row, ...(selected.length === 1 && fileHash ? { fileHash } : {}) },
        bankId,
        selected.length === 1 ? document : undefined,
        c.match || undefined,
        c.budget
          ? c.budget === 'new'
            ? { limit: readImportAmount(c.limit) }
            : { id: c.budget }
          : undefined,
      );
    }
    return result;
  };
  const review = () => {
    try {
      prepare();
      setConfirm(true);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revê os dados.');
    }
  };
  const apply = async () => {
    setBusy(true);
    try {
      const document =
        attach && file && selected.length === 1
          ? await fileDocument(file, selected[0].title)
          : undefined;
      stock.updateBusinessDocuments((movements, tools) =>
        prepare(movements, tools, document),
      );
      setRows([]);
      setChoices({});
      setFile(null);
      setFileHash('');
      setSource('');
      setSheets([]);
      setConfirm(false);
      setError('');
      setMessage(
        'Movimentos aplicados. Comprovativos existentes foram reutilizados.',
      );
    } catch (e) {
      setConfirm(false);
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="space-y-6 max-w-[760px] w-full min-w-0">
      <div className="border-b border-slate-200/80 dark:border-dm-border pb-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-dm-text">
          Extratos e Comprovativos (Financeiro Business)
        </h2>
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1 leading-relaxed">
          Importação e conciliação inteligente em 3 passos. Leitura local em memória segura sem envio de documentos a servidores externos.
        </p>
      </div>

      {/* Passo 1. Conta */}
      <section className={`${panel} space-y-3`} aria-label="Passo 1: Conta empresarial">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-dm-muted">
            Passo 1 · Selecionar Conta Empresarial
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-dm-muted">
            {bankId ? 'Conta Vinculada' : 'Obrigatório'}
          </span>
        </div>

        <label className="block text-xs font-medium">
          <span>Conta bancária da empresa</span>
          <select
            aria-label="Conta empresarial do documento"
            className={`${input} min-h-[44px] h-11 mt-1 font-semibold`}
            value={bankId}
            onChange={(e) => {
              setBankId(e.target.value);
              setChoices({});
              setConfirm(false);
            }}
          >
            <option value="">Escolha a conta bancária da empresa…</option>
            {banks
              .filter(
                (b) =>
                  stock.companies.find((c) => c.id === b.companyId)?.status !==
                  'desativada',
              )
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {stock.getCompanyForBank(b.id)?.name || 'Sem empresa'} ·{' '}
                  {b.name} · {b.currency}
                </option>
              ))}
          </select>
        </label>

        {company?.status === 'parada' && (
          <p role="alert" className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
            Empresa parada — novas operações financeiras estão temporariamente bloqueadas.
          </p>
        )}
      </section>

      {/* Passo 2. Documento (Área única de importação para PDF, Excel, fotografia, CSV) */}
      <section className={`${panel} space-y-3`} aria-label="Passo 2: Carregar documento">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-dm-muted">
            Passo 2 · Carregar Extrato ou Comprovativo
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-dm-elevated text-slate-600 dark:text-dm-muted border border-slate-200 dark:border-dm-border">
              PDF
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-dm-elevated text-slate-600 dark:text-dm-muted border border-slate-200 dark:border-dm-border">
              Excel
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-dm-elevated text-slate-600 dark:text-dm-muted border border-slate-200 dark:border-dm-border">
              Fotografia
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-dm-elevated text-slate-600 dark:text-dm-muted border border-slate-200 dark:border-dm-border">
              CSV
            </span>
          </div>
        </div>

        <label className="block text-xs font-medium">
          <span>Ficheiro de extrato ou recibo (.pdf, .csv, .xlsx, .png, .jpg)</span>
          <input
            className={`${input} min-h-[44px] mt-1`}
            aria-label="Ler ficheiro Business"
            type="file"
            accept=".pdf,.csv,.xlsx,.png,.jpg,.jpeg,.webp"
            disabled={busy || company?.status === 'parada'}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void read(f);
            }}
          />
        </label>

        {sheets.length > 1 && (
          <label className="block text-xs font-medium">
            <span>Folha da folha de cálculo Excel</span>
            <select
              aria-label="Folha do Excel Business"
              className={`${input} min-h-[44px] mt-1`}
              value={sheet}
              onChange={(e) => {
                const index = Number(e.target.value);
                setSheet(index);
                try {
                  propose(source, sheets[index].table);
                } catch (err) {
                  setRows([]);
                  setError(
                    err instanceof Error ? err.message : 'Revê a folha.',
                  );
                }
              }}
            >
              {sheets.map((s, i) => (
                <option key={i} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            className={button + ' min-h-[44px] px-4 cursor-pointer'}
            disabled={busy || company?.status === 'parada'}
            onClick={() => {
              setFile(null);
              setFileHash('');
              setSource('');
              setRows((old) => [
                ...old,
                {
                  id: createId('business-draft'),
                  date: '',
                  title: '',
                  amount: '',
                  currency: '',
                  direction: '',
                  category: '',
                  subcategory: '',
                  selected: true,
                },
              ]);
              setConfirm(false);
            }}
          >
            Adicionar movimento manual
          </button>

          {busy && (
            <button className={button + ' min-h-[44px] px-4 cursor-pointer'} onClick={() => abort.current?.abort()}>
              Cancelar leitura
            </button>
          )}
        </div>

        <details className="pt-1">
          <summary className="text-xs text-slate-500 dark:text-dm-muted cursor-pointer hover:underline">
            Opção avançada: Colar ou corrigir texto do extrato manualmente
          </summary>
          <div className="mt-2 space-y-2">
            <textarea
              aria-label="Texto do documento Business"
              className={input + ' min-h-24 font-mono text-xs'}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Cole aqui o texto do comprovativo ou linhas do extrato..."
              maxLength={200000}
            />
            <button
              className={button + ' cursor-pointer'}
              disabled={busy || !source.trim()}
              onClick={() => {
                try {
                  propose(source);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Revê o texto.');
                }
              }}
            >
              Interpretar texto colado
            </button>
          </div>
        </details>

        {message && (
          <p role="status" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {message}
          </p>
        )}

        {(error || stock.businessDocumentsError) && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 font-medium">
            {error || stock.businessDocumentsError}
          </p>
        )}
      </section>

      {/* Passo 3. Revisão */}
      <section className={`${panel} space-y-4`} aria-label="Passo 3: Revisão de movimentos">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-dm-muted">
            Passo 3 · Revisão e Aplicação dos Movimentos
          </h3>
          {rows.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {rows.length} {rows.length === 1 ? 'movimento lido' : 'movimentos lidos'}
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-50 dark:bg-dm-elevated border border-dashed border-slate-200 dark:border-dm-border text-center text-xs text-slate-400 dark:text-dm-muted space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">Nenhum movimento pendente para revisão</p>
            <p className="text-[11px]">
              Selecione uma conta no Passo 1 e carregue um extrato ou comprovativo no Passo 2 para rever as movimentações.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-dm-muted">
              Confira os dados identificados. + Entrada aumenta o saldo; − Saída reduz. Apenas movimentos selecionados serão aplicados.
            </p>
            {rows.map((row, i) => {
          let matches: ReturnType<typeof businessReceiptMatches> = [];
          try {
            if (bank)
              matches = businessReceiptMatches(stock.bankMovements, row, bank);
          } catch {
            /* incomplete review */
          }
          const c = choice(row.id);
          return (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 dark:border-dm-border p-3 space-y-2"
            >
              <label className="text-xs flex gap-2">
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={(e) => change(row.id, 'selected', e.target.checked)}
                />
                Movimento {i + 1}
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    ['Data', 'date', 'date'],
                    ['Descrição', 'title', 'text'],
                    ['Valor sem sinal', 'amount', 'text'],
                    ['Referência da transação', 'reference', 'text'],
                  ] as const
                ).map(([label, key, type]) => (
                  <label key={key} className="text-xs">
                    {label}
                    <input
                      aria-label={`${label} Business ${i + 1}`}
                      className={input}
                      type={type}
                      value={row[key] || ''}
                      onChange={(e) => change(row.id, key, e.target.value)}
                    />
                  </label>
                ))}
                <label className="text-xs">
                  Sentido
                  <select
                    aria-label={`Sentido Business ${i + 1}`}
                    className={input}
                    value={row.direction}
                    onChange={(e) => {
                      change(row.id, 'direction', e.target.value);
                      choose(row.id, 'budget', '');
                    }}
                  >
                    <option value="">Confirmar sentido</option>
                    <option value="income">+ Entrada</option>
                    <option value="expense">− Saída</option>
                  </select>
                </label>
                <label className="text-xs">
                  Moeda
                  <select
                    aria-label={`Moeda Business ${i + 1}`}
                    className={input}
                    value={row.currency}
                    onChange={(e) => change(row.id, 'currency', e.target.value)}
                  >
                    <option value="">Moeda da conta</option>
                    <option value="AOA">AOA / Kz</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="text-xs">
                  Categoria
                  <select
                    aria-label={`Categoria Business ${i + 1}`}
                    className={input}
                    value={row.category}
                    onChange={(e) => change(row.id, 'category', e.target.value)}
                  >
                    <option value="">Escolher categoria</option>
                    {FINANCIAL_CATEGORIES.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                {!!matches.length && (
                  <label className="text-xs">
                    Lançamento já existente
                    <select
                      aria-label={`Lançamento compatível Business ${i + 1}`}
                      className={input}
                      value={c.match}
                      onChange={(e) => {
                        choose(row.id, 'match', e.target.value);
                        const m = matches.find((m) => m.id === e.target.value);
                        if (m)
                          change(row.id, 'category', m.category || 'Outro');
                      }}
                    >
                      <option value="">Associar sem cobrar novamente</option>
                      {matches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.reason} · {m.amount}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {row.direction === 'expense' && (
                  <label className="text-xs">
                    Orçamento
                    <select
                      aria-label={`Orçamento Business ${i + 1}`}
                      className={input}
                      value={c.budget}
                      onChange={(e) => {
                        choose(row.id, 'budget', e.target.value);
                        const b = stock.businessDocuments.budgets.find(
                          (b) => b.id === e.target.value,
                        );
                        if (b) change(row.id, 'category', b.category);
                      }}
                    >
                      <option value="">Sem escolher orçamento</option>
                      {stock.businessDocuments.budgets
                        .filter(
                          (b) =>
                            b.companyId === company?.id &&
                            b.month === row.date.slice(0, 7) &&
                            b.currency ===
                              (bank?.currency.toUpperCase() === 'USD'
                                ? 'USD'
                                : 'AOA'),
                        )
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.category} · {b.month} · Limite {b.limit}{' '}
                            {b.currency}
                          </option>
                        ))}
                      <option value="new">Criar novo orçamento</option>
                    </select>
                  </label>
                )}
                {c.budget === 'new' && (
                  <label className="text-xs">
                    Limite do novo orçamento
                    <input
                      aria-label={`Limite do orçamento Business ${i + 1}`}
                      className={input}
                      value={c.limit}
                      onChange={(e) => choose(row.id, 'limit', e.target.value)}
                      inputMode="decimal"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
        {!!rows.length && file && selected.length === 1 && (
          <label className="text-xs block">
            <input
              type="checkbox"
              checked={attach}
              disabled={
                file.size > 1024 * 1024 ||
                !['application/pdf', 'image/png', 'image/jpeg'].includes(
                  file.type,
                )
              }
              onChange={(e) => setAttach(e.target.checked)}
            />{' '}
            Guardar comprovativo associado (PDF/PNG/JPEG até 1 MB; 2 MB no
            total). Ficheiros repetidos são reutilizados.
          </label>
        )}
        {selected.length > 1 && (
          <p className="text-xs text-slate-500">
            Importação de vários movimentos: confere as referências e
            correspondências. O ficheiro de extrato não é arquivado como um
            comprovativo individual.
          </p>
        )}
        {!!rows.length && (
          <button
            className={button + ' bg-slate-900 text-white dm-btn-primary'}
            disabled={busy || !!stock.businessDocumentsError}
            onClick={review}
          >
            Rever e aplicar no Business
          </button>
        )}
          </div>
        )}
      </section>
      <section className={panel}>
        <h2 className="font-semibold text-sm">Orçamentos empresariais</h2>
        <p className="text-xs text-slate-500">
          Limites por empresa, categoria, mês e moeda. A despesa entra no
          cálculo uma única vez.
        </p>
        {stock.businessDocuments.budgets
          .filter(
            (b) =>
              stock.companies.find((c) => c.id === b.companyId)?.status !==
                'desativada' &&
              (!company || b.companyId === company.id),
          )
          .map((b) => {
            const amount = stock.bankMovements
              .filter(
                (m) =>
                  banks.find((bank) => bank.id === m.bankId)?.companyId ===
                    b.companyId &&
                  m.category === b.category &&
                  m.date.slice(0, 7) === b.month &&
                  !m.isRemoved &&
                  (banks
                    .find((bank) => bank.id === m.bankId)
                    ?.currency.toUpperCase() === 'USD'
                    ? 'USD'
                    : 'AOA') === b.currency,
              )
              .reduce(
                (n, m) =>
                  n +
                  (m.type === 'saida'
                    ? m.amount
                    : m.reversalOfId &&
                        stock.bankMovements.find(
                          (original) => original.id === m.reversalOfId,
                        )?.type === 'saida'
                      ? -m.amount
                      : 0),
                0,
              );
            return (
              <p key={b.id} className="text-sm">
                {stock.companies.find((c) => c.id === b.companyId)?.name} ·{' '}
                {b.category} · {b.month}: {amount.toFixed(2)} /{' '}
                {b.limit.toFixed(2)} {b.currency}
              </p>
            );
          })}
        {!stock.businessDocuments.budgets.length && (
          <p className="text-xs">Nenhum orçamento criado.</p>
        )}
      </section>
      <section className={panel}>
        <h2 className="font-semibold text-sm">
          Comprovativos empresariais guardados
        </h2>
        {stock.businessDocuments.documents
          .filter((d) => {
            const owner = banks.find(
              (b) =>
                b.id ===
                stock.bankMovements.find((m) => m.id === d.entityId)?.bankId,
            )?.companyId;
            return (
              stock.companies.find((c) => c.id === owner)?.status !==
                'desativada' &&
              (!company || owner === company.id)
            );
          })
          .map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 break-words">
                {d.title} · {d.fileName}
              </span>
              <button
                className={button}
                onClick={() =>
                  download(
                    new Blob(
                      [
                        Uint8Array.from(atob(d.content), (c) =>
                          c.charCodeAt(0),
                        ),
                      ],
                      { type: d.mime },
                    ),
                    d.fileName,
                  )
                }
              >
                Descarregar
              </button>
            </div>
          ))}
        <button
          className={button}
          disabled={!!stock.businessDocumentsError}
          onClick={() =>
            download(
              new Blob(
                [
                  JSON.stringify(
                    {
                      version: 1,
                      banks: stock.banks,
                      companies: stock.companies,
                      movements: stock.bankMovements,
                      tools: stock.businessDocuments,
                    },
                    null,
                    2,
                  ),
                ],
                { type: 'application/json' },
              ),
              'myoffice-business-financeiro.json',
            )
          }
        >
          Exportar cópia financeira Business
        </button>
      </section>
      {confirm && (
        <HomeModal
          title="Confirmar movimentos Business"
          onClose={() => setConfirm(false)}
        >
          <p className="text-sm">
            Serão aplicados {selected.length} movimentos na conta {bank?.name},
            da empresa {company?.name}. Correspondências existentes apenas
            recebem o comprovativo, sem novo débito. Novos orçamentos criam
            limites, sem desconto adicional.
          </p>
          {selected.map((r) => (
            <p key={r.id} className="text-sm mt-2">
              {r.direction === 'income' ? '+' : '−'} {r.amount}{' '}
              {r.currency || bank?.currency} · {r.title}
              {choice(r.id).budget === 'new'
                ? ` · Novo limite: ${choice(r.id).limit}`
                : ''}
            </p>
          ))}
          <button
            className={button + ' mt-4 bg-slate-900 text-white dm-btn-primary'}
            disabled={busy}
            onClick={() => void apply()}
          >
            Aplicar
          </button>
        </HomeModal>
      )}
    </div>
  );
}
