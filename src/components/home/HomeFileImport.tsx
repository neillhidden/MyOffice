import { csvTable } from '../../utils/financialTables';
import React, { useEffect, useRef, useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { HomeDocument, HomeStatementRow } from '../../types/home';
import { HomeModal } from './HomeModal';
import { accountCurrency, todayLocal } from '../../utils/home';
import {
  applyReceipt,
  draftsToStatements,
  ImportDraft,
  receiptMatches,
  tableDrafts,
  textDrafts,
  validateDraft,
} from '../../utils/homeDocumentImport';
import {
  readFinancialFile,
  FinancialReadResult,
} from '../../utils/financialFileReader';
import { createId } from '../../utils/ids';
const panel =
  'rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-3';
const input =
  'w-full min-w-0 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated p-2 text-sm';
const button =
  'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs disabled:opacity-40';
const primary = button + ' dm-btn-primary bg-slate-900 text-white';
const blank = (): ImportDraft => ({
  id: createId('manual-draft'),
  date: '',
  title: '',
  amount: '',
  direction: '',
  currency: '',
  category: '',
  subcategory: '',
  selected: true,
});
function savedFile(d: HomeDocument) {
  return new File(
    [Uint8Array.from(atob(d.content), (c) => c.charCodeAt(0))],
    d.fileName,
    { type: d.mime },
  );
}
async function fileDocument(file: File, title: string): Promise<HomeDocument> {
  if (
    !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
    file.size > 1024 * 1024
  )
    throw new Error(
      'O comprovativo para arquivo deve ser PDF/PNG/JPEG até 1 MB.',
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  let raw = '';
  for (let i = 0; i < bytes.length; i += 8192)
    raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return {
    id: createId('read-document'),
    title,
    fileName: file.name,
    mime: file.type as HomeDocument['mime'],
    size: file.size,
    content: btoa(raw),
    uploadedAt: new Date().toISOString(),
    kind: 'receipt',
  };
}
export function HomeFileImport({
  mode,
  accountId: parentAccount = '',
  onRows,
  existingDocument,
  onApplied,
}: {
  mode: 'statement' | 'receipt';
  accountId?: string;
  onRows?: (rows: HomeStatementRow[]) => void;
  existingDocument?: HomeDocument;
  onApplied?: () => void;
}) {
  const { data, update } = useHome();
  const [account, setAccount] = useState('');
  const accountId = mode === 'statement' ? parentAccount : account;
  const wallet = data.accounts.find(
    (a) => a.id === accountId && !a.deletedAt && a.kind === 'current',
  );
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('');
  const [result, setResult] = useState<FinancialReadResult | null>(null);
  const [sheet, setSheet] = useState(0);
  const [rows, setRows] = useState<ImportDraft[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [attach, setAttach] = useState(true);
  const [match, setMatch] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  const propose = (r: FinancialReadResult, index = 0) => {
    let drafts: ImportDraft[] = [];
    try {
      drafts = r.sheets
        ? tableDrafts(r.sheets[index].table)
        : (r.drafts ?? textDrafts(r.text, mode));
      setError(
        drafts.length
          ? ''
          : 'Não foi possível identificar movimentos. Podes corrigir o texto ou adicionar uma linha manualmente.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revê a tabela.');
    }
    setRows(mode === 'receipt' ? drafts.slice(0, 1) : drafts);
    setMatch('');
  };
  const read = async (selected: File) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    setRows([]);
    setSource('');
    setFile(selected);
    setConfirmation(false);
    setAttach(
      selected.size <= 1024 * 1024 &&
        ['application/pdf', 'image/png', 'image/jpeg'].includes(selected.type),
    );
    try {
      const r = await readFinancialFile(
        selected,
        mode,
        (m) => {
          if (mounted.current && abort.current === controller) setMessage(m);
        },
        controller.signal,
      );
      if (
        !mounted.current ||
        controller.signal.aborted ||
        abort.current !== controller
      )
        return;
      setResult(r);
      setSource(r.text);
      setSheet(0);
      propose(r);
    } catch (e) {
      if (mounted.current && abort.current === controller)
        setError(
          e instanceof Error ? e.message : 'Não foi possível ler o documento.',
        );
    } finally {
      if (mounted.current && abort.current === controller) {
        setBusy(false);
        setMessage('');
      }
    }
  };
  useEffect(() => {
    if (existingDocument) {
      setFile(savedFile(existingDocument));
      void read(savedFile(existingDocument));
    }
  }, [existingDocument?.id]);
  const change = (
    id: string,
    key: keyof ImportDraft,
    value: string | boolean,
  ) => {
    setRows((old) =>
      old.map((r) =>
        r.id === id
          ? {
              ...r,
              [key]: value,
              ...(key === 'direction'
                ? { category: '', subcategory: '' }
                : key === 'category'
                  ? { subcategory: '' }
                  : {}),
            }
          : r,
      ),
    );
    setMatch('');
    setConfirmation(false);
  };
  const selected = rows.filter((r) => r.selected);
  let matches: ReturnType<typeof receiptMatches> = [];
  if (mode === 'receipt' && wallet && selected.length === 1) {
    try {
      matches = receiptMatches(data, selected[0], accountId);
    } catch {
      /* The incomplete draft is displayed for review. */
    }
  }
  const check = () => {
    if (!wallet) throw new Error('Escolhe a carteira do movimento.');
    if (!selected.length) throw new Error('Seleciona pelo menos um movimento.');
    for (const row of selected) {
      try {
        validateDraft(row, accountCurrency(wallet));
      } catch (e) {
        throw new Error(
          `Movimento ${rows.indexOf(row) + 1}: ${e instanceof Error ? e.message : 'Revê os dados.'}`,
        );
      }
    }
    if (mode === 'receipt') {
      if (selected.length !== 1)
        throw new Error('Aplica um comprovativo de cada vez.');
      if (matches.length && !match)
        throw new Error(
          'Escolhe o lançamento existente para associar o comprovativo.',
        );
      if (!matches.length && !selected[0].category)
        throw new Error(
          'Escolhe uma categoria para a nova despesa ou rendimento.',
        );
    }
  };
  const confirm = () => {
    try {
      check();
      setError('');
      setConfirmation(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revê os campos.');
    }
  };
  const apply = async () => {
    setBusy(true);
    try {
      check();
      if (mode === 'statement') {
        onRows?.(
          draftsToStatements(selected, accountId, accountCurrency(wallet)),
        );
        setRows([]);
        setSource('');
        setResult(null);
        setFile(null);
        setError('');
        setConfirmation(false);
      } else {
        const row = selected[0];
        const document =
          existingDocument ??
          (attach && file ? await fileDocument(file, row.title) : undefined);
        update((current) =>
          applyReceipt(current, row, accountId, document, match || undefined),
        );
        setRows([]);
        setFile(null);
        setResult(null);
        setSource('');
        setConfirmation(false);
        setError('');
        onApplied?.();
      }
    } catch (e) {
      setConfirmation(false);
      setError(e instanceof Error ? e.message : 'Não foi possível aplicar.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <section
      className={panel}
      aria-label={
        mode === 'receipt' ? 'Leitura de comprovativos' : 'Leitura de extratos'
      }
    >
      <h2 className="font-semibold text-sm">
        {mode === 'receipt'
          ? 'Ler comprovativo e preparar movimento'
          : 'Ler extrato PDF, Excel ou fotografia'}
      </h2>
      <p className="text-xs text-slate-500 dark:text-dm-muted">
        PDF com texto ou digitalizado, CSV, Excel .xlsx e fotografia
        PNG/JPEG/WebP. Leitura local; revê todos os valores. Entrada (+) aumenta
        a carteira; saída (−) reduz. Saldo do banco não é valor do movimento.
      </p>
      {mode === 'receipt' && (
        <label className="block text-xs">
          Carteira do comprovativo
          <select
            aria-label="Carteira do comprovativo"
            className={input}
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              setMatch('');
            }}
          >
            <option value="">Escolher carteira</option>
            {data.accounts
              .filter((a) => !a.deletedAt && a.kind === 'current')
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {accountCurrency(a)}
                </option>
              ))}
          </select>
        </label>
      )}
      <label className="block text-xs">
        Selecionar documento
        <input
          aria-label={
            mode === 'receipt'
              ? 'Ler ficheiro de comprovativo'
              : 'Ler ficheiro de extrato'
          }
          type="file"
          className={input}
          accept=".pdf,.csv,.xlsx,.png,.jpg,.jpeg,.webp,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void read(f);
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className={button}
          disabled={busy}
          onClick={() => {
            if (mode === 'receipt') {
              setFile(null);
              setSource('');
              setResult(null);
              setMatch('');
            }
            setRows((old) =>
              mode === 'receipt' ? [blank()] : [...old, blank()],
            );
            setError('');
          }}
        >
          Adicionar movimento manual
        </button>
        {busy && (
          <button className={button} onClick={() => abort.current?.abort()}>
            Cancelar leitura
          </button>
        )}
      </div>
      {busy && (
        <p role="status" className="text-xs">
          {message || 'A preparar…'}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {result?.sheets && result.sheets.length > 1 && (
        <label className="text-xs block">
          Folha do Excel
          <select
            aria-label="Folha do Excel"
            className={input}
            value={sheet}
            onChange={(e) => {
              const index = Number(e.target.value);
              setSheet(index);
              setSource(
                result.sheets![index].table.map((r) => r.join('\t')).join('\n'),
              );
              propose(result, index);
            }}
          >
            {result.sheets.map((s, i) => (
              <option key={i} value={i}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <details>
        <summary className="text-xs cursor-pointer">
          Colar ou corrigir texto
        </summary>
        <label className="block text-xs mt-2">
          Texto do documento
          <textarea
            aria-label="Texto do documento"
            className={input + ' min-h-32'}
            maxLength={200000}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <button
          className={button}
          disabled={busy || !source.trim()}
          onClick={() => {
            try {
              if (/^(?:Data|Date)[;\t,]/i.test(source.trim())) {
                propose({
                  text: source,
                  sheets: [{ name: 'Texto colado', table: csvTable(source) }],
                });
              } else propose({ text: source });
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Revê o texto.');
            }
          }}
        >
          Interpretar texto
        </button>
      </details>
      {rows.map((row, i) => {
        const categories = (data.categoryCatalog ?? []).filter(
          (c) => c.kind === row.direction && !c.parentId,
        );
        const category = categories.find((c) => c.key === row.category);
        const children = (data.categoryCatalog ?? []).filter(
          (c) => c.parentId === category?.id && !!category,
        );
        return (
          <div
            key={row.id}
            className="rounded-lg border border-slate-200 dark:border-dm-border p-3 space-y-3"
          >
            <label className="flex gap-2 items-center text-xs">
              <input
                type="checkbox"
                aria-label={'Selecionar movimento ' + (i + 1)}
                checked={row.selected}
                onChange={(e) => change(row.id, 'selected', e.target.checked)}
              />
              Movimento {i + 1} ·{' '}
              {row.direction === 'income'
                ? '+ Entrada'
                : row.direction === 'expense'
                  ? '− Saída'
                  : 'Sentido por confirmar'}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs">
                Data
                <input
                  aria-label={'Data lida ' + (i + 1)}
                  className={input}
                  type="date"
                  max={todayLocal()}
                  value={row.date}
                  onChange={(e) => change(row.id, 'date', e.target.value)}
                />
              </label>
              <label className="text-xs">
                Descrição
                <input
                  aria-label={'Descrição lida ' + (i + 1)}
                  className={input}
                  maxLength={300}
                  value={row.title}
                  onChange={(e) => change(row.id, 'title', e.target.value)}
                />
              </label>
              <label className="text-xs">
                Valor (sem sinal)
                <input
                  aria-label={'Valor lido ' + (i + 1)}
                  className={input}
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => change(row.id, 'amount', e.target.value)}
                />
              </label>
              <label className="text-xs">
                Entrada ou saída
                <select
                  aria-label={'Sentido lido ' + (i + 1)}
                  className={input}
                  value={row.direction}
                  onChange={(e) => change(row.id, 'direction', e.target.value)}
                >
                  <option value="">Confirmar sentido</option>
                  <option value="income">+ Entrada / Rendimento</option>
                  <option value="expense">− Saída / Despesa</option>
                </select>
              </label>
              <label className="text-xs">
                Moeda identificada
                <select
                  aria-label={'Moeda lida ' + (i + 1)}
                  className={input}
                  value={row.currency}
                  onChange={(e) => change(row.id, 'currency', e.target.value)}
                >
                  <option value="">Usar moeda da carteira escolhida</option>
                  <option value="AOA">AOA / Kwanza</option>
                  <option value="USD">USD / Dólar</option>
                </select>
              </label>
              {mode === 'receipt' && (
                <>
                  <label className="text-xs">
                    Categoria
                    <select
                      aria-label="Categoria do comprovativo"
                      className={input}
                      value={row.category}
                      onChange={(e) =>
                        change(row.id, 'category', e.target.value)
                      }
                    >
                      <option value="">Escolher categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    Subcategoria (opcional)
                    <select
                      aria-label="Subcategoria do comprovativo"
                      className={input}
                      value={row.subcategory}
                      onChange={(e) =>
                        change(row.id, 'subcategory', e.target.value)
                      }
                    >
                      <option value="">Sem subcategoria</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
          </div>
        );
      })}
      {mode === 'receipt' && !!matches.length && (
        <label className="block text-xs">
          Já existe um movimento compatível. Associar a
          <select
            aria-label="Lançamento compatível"
            className={input}
            value={match}
            onChange={(e) => setMatch(e.target.value)}
          >
            <option value="">Escolher lançamento existente</option>
            {matches.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.date} · {e.amount}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'receipt' && file && !existingDocument && (
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
          Guardar comprovativo associado (PDF/PNG/JPEG até 1 MB; 2 MB no total)
          {file.size > 1024 * 1024
            ? ' · Este ficheiro pode ser lido, mas precisa de ser reduzido para arquivo.'
            : ''}
        </label>
      )}
      {!!rows.length && (
        <button className={primary} disabled={busy} onClick={confirm}>
          {mode === 'statement'
            ? 'Enviar movimentos revistos para conferência'
            : 'Rever e aplicar movimento'}
        </button>
      )}
      {confirmation && (
        <HomeModal
          title={
            mode === 'statement'
              ? 'Confirmar leitura do extrato'
              : match
                ? 'Associar comprovativo'
                : 'Aplicar movimento revisto'
          }
          onClose={() => setConfirmation(false)}
        >
          <p className="text-sm mb-4">
            {mode === 'statement'
              ? `${selected.length} movimentos serão enviados para a pré-visualização do extrato, sem alterar o saldo. Confere-os antes de criar lançamentos.`
              : match
                ? 'O comprovativo será associado ao lançamento escolhido; o saldo não será descontado novamente.'
                : `Será registada uma ${selected[0].direction === 'income' ? 'entrada (+)' : 'saída (−)'} de ${selected[0].amount} ${accountCurrency(wallet)} na carteira ${wallet?.name}.`}
          </p>
          <div className="flex gap-2">
            <button
              className={primary}
              disabled={busy}
              onClick={() => void apply()}
            >
              Aplicar
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => setConfirmation(false)}
            >
              Voltar à revisão
            </button>
          </div>
        </HomeModal>
      )}
    </section>
  );
}
