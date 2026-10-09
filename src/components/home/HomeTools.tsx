import { useToday } from '../../hooks/useToday';
import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import {
  HomeCurrency,
  HomeData,
  HomeDebt,
  HomePlan,
  HomeDocument,
  HomeSection,
  HomeStatementRow,
} from '../../types/home';
import {
  accountCurrency,
  balances,
  effectiveEntries,
  formatHomeMoney,
  reverseHomeEntry,
  todayLocal,
  dueDate,
  validateHomeData,
} from '../../utils/home';
import {
  homeAuditEdit,
  homeEntityKey,
  HomeEntity,
  deleteHomeEntity,
  restoreHomeEntity,
} from '../../utils/homeEditing';
import {
  completeHomeTask,
  debtInstallments,
  debtRemaining,
  importStatementEntry,
  matchHomeStatement,
  payHomeDebt,
  saveHomeDebt,
  saveHomePlan,
  statementEntryMatches,
} from '../../utils/homeExtensions';
import {
  homeCalendarEvents,
  homeForecast,
  homeReport,
  parseStatementCsv,
  reportCsv,
  reportPdf,
} from '../../utils/homeAnalysis';
import { homeCategoryName } from '../../utils/homeCategories';
import { createId } from '../../utils/ids';
import { homeFormErrors } from '../../utils/homeForms';
import { HomeModal } from './HomeModal';

const panel =
  'rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-3';
const input =
  'min-w-0 w-full rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated p-2 text-sm';
const btn =
  'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-dm-elevated disabled:opacity-40';
const primary = btn + ' dm-btn-primary bg-slate-900 text-white';
const muted = 'text-xs text-slate-500 dark:text-dm-muted';
type Option = [string, string];
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: Option[] | ((values: Record<string, string>) => Option[]);
  optional?: boolean;
  min?: string;
  max?: string;
  step?: string;
};
type Dialog = {
  title: string;
  fields?: Field[];
  values?: Record<string, string>;
  description?: string;
  submit: (v: Record<string, string>, f: HTMLFormElement) => void;
};
const moneyField = (key = 'amount', label = 'Valor'): Field => ({
  key,
  label,
  type: 'number',
  min: '0.01',
  step: '0.01',
});
const dateField = (key = 'date', label = 'Data', optional = false): Field => ({
  key,
  label,
  type: 'date',
  optional,
});
const currencies: Option[] = [
  ['AOA', 'Kwanza (Kz)'],
  ['USD', 'Dólar (USD)'],
];
function download(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function useActions() {
  const { data, update } = useHome();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveValues, setLiveValues] = useState<Record<string, string>>({});
  const run = (action: () => void) => {
    try {
      action();
      setError('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
      return false;
    }
  };
  const open = (d: Dialog) => {
    setError('');
    setErrors({});
    setLiveValues(d.values ?? {});
    setDialog(d);
  };
  const remove = (kind: HomeEntity, id: string, name: string) =>
    open({
      title: 'Eliminar registo',
      description: `Eliminar ${name}? O registo permanece no Histórico e pode ser recuperado se o saldo e as referências permitirem.`,
      submit: () => update((d) => deleteHomeEntity(d, kind, id)),
    });
  const modal = dialog && (
    <HomeModal
      title={dialog.title}
      onClose={() => {
        setDialog(null);
        setError('');
      }}
    >
      <form
        noValidate
        onChange={(e) =>
          setLiveValues(
            Object.fromEntries(new FormData(e.currentTarget)) as Record<
              string,
              string
            >,
          )
        }
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const errs = homeFormErrors(f);
          setErrors(errs);
          if (Object.keys(errs).length) return;
          const v = Object.fromEntries(new FormData(f)) as Record<
            string,
            string
          >;
          if (run(() => dialog.submit(v, f))) setDialog(null);
        }}
        className="space-y-4"
      >
        {dialog.description && <p className="text-sm">{dialog.description}</p>}
        {dialog.fields?.map((field) => (
          <label key={field.key} className="block text-xs space-y-1">
            <span>
              {field.label}
              {field.optional ? ' (opcional)' : ''}
            </span>
            {field.options ? (
              <select
                id={'home-tool-' + field.key}
                name={field.key}
                className={input}
                required={!field.optional}
                defaultValue={dialog.values?.[field.key] ?? ''}
              >
                <option value="">Escolher</option>
                {(typeof field.options === 'function'
                  ? field.options(liveValues)
                  : field.options
                ).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={'home-tool-' + field.key}
                name={field.key}
                className={input}
                required={!field.optional}
                defaultValue={dialog.values?.[field.key] ?? ''}
                type={field.type ?? 'text'}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={field.type ? undefined : 300}
              />
            )}{' '}
            {errors['home-tool-' + field.key] && (
              <span role="alert" className="text-rose-600">
                {errors['home-tool-' + field.key]}
              </span>
            )}
          </label>
        ))}
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button className={primary}>Guardar</button>
          <button type="button" className={btn} onClick={() => setDialog(null)}>
            Cancelar
          </button>
        </div>
      </form>
    </HomeModal>
  );
  return {
    data,
    update,
    run,
    open,
    remove,
    modal,
    alert:
      error && !dialog ? (
        <p role="alert" className="text-rose-600 text-sm">
          {error}
        </p>
      ) : null,
  };
}
function RowActions({
  title,
  edit,
  remove,
}: {
  title: string;
  edit: () => void;
  remove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button className={btn} aria-label={'Editar ' + title} onClick={edit}>
        <Pencil size={16} />
      </button>
      <button className={btn} aria-label={'Eliminar ' + title} onClick={remove}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
function walletOptions(data: HomeData): Option[] {
  return data.accounts
    .filter((a) => !a.deletedAt && a.kind === 'current')
    .map((a) => [a.id, `${a.name} · ${accountCurrency(a)}`]);
}
function Categories(data: HomeData, kind: 'income' | 'expense'): Option[] {
  return (data.categoryCatalog ?? [])
    .filter((c) => c.kind === kind && !c.parentId)
    .map((c) => [c.key, c.name]);
}
function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([l, v]) => (
        <div key={l} className={panel}>
          <p className={muted}>{l}</p>
          <p className="text-lg font-semibold break-words">{v}</p>
        </div>
      ))}
    </div>
  );
}
const dateLabel = (d: string) =>
  d ? d.split('-').reverse().join('/') : 'Sem prazo';

export function HomeDebts() {
  const a = useActions();
  const { data, update, open } = a;
  const edit = (d?: HomeDebt) =>
    open({
      title: d ? 'Editar dívida' : 'Nova dívida pessoal',
      description:
        'Regista uma obrigação já existente. Criar a dívida não movimenta dinheiro; pagar ou receber altera a carteira, sem contar novamente como consumo ou rendimento.',
      fields: [
        { key: 'title', label: 'Descrição' },
        { key: 'person', label: 'Pessoa ou entidade' },
        {
          key: 'type',
          label: 'Tipo',
          options: [
            ['payable', 'A pagar'],
            ['receivable', 'A receber'],
          ],
        },
        moneyField('principal', 'Valor total'),
        { key: 'currency', label: 'Moeda', options: currencies },
        dateField('issueDate', 'Data da dívida'),
        dateField('dueDate', 'Vencimento', true),
        {
          key: 'installmentCount',
          label: 'Número de prestações',
          type: 'number',
          min: '1',
          max: '600',
          step: '1',
        },
        dateField(
          'firstInstallment',
          'Primeira prestação (obrigatória se houver várias)',
          true,
        ),
      ],
      values: d
        ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)]))
        : undefined,
      submit: (v) =>
        update((data) =>
          saveHomeDebt(data, {
            ...d,
            id: d?.id ?? createId('home-debt'),
            title: v.title.trim(),
            person: v.person.trim(),
            type: v.type as HomeDebt['type'],
            principal: Number(v.principal),
            currency: v.currency as HomeCurrency,
            issueDate: v.issueDate,
            dueDate: v.dueDate,
            installmentCount: Number(v.installmentCount),
            firstInstallment: v.firstInstallment,
          }),
        ),
    });
  return (
    <div className="space-y-4">
      {a.alert}
      <button className={primary} onClick={() => edit()}>
        Nova dívida pessoal
      </button>
      {(data.debts ?? [])
        .filter((d) => !d.deletedAt)
        .map((d) => (
          <section key={d.id} className={panel}>
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-semibold">{d.title}</h2>
                <p className={muted}>
                  {d.person} · {d.type === 'payable' ? 'A pagar' : 'A receber'}{' '}
                  · {dateLabel(d.dueDate)}
                </p>
              </div>
              <RowActions
                title={'dívida ' + d.title}
                edit={() => edit(d)}
                remove={() => a.remove('debt', d.id, d.title)}
              />
            </div>
            <Stats
              items={[
                ['Total', formatHomeMoney(d.principal, d.currency)],
                [
                  'Liquidado',
                  formatHomeMoney(
                    d.principal - debtRemaining(data, d.id),
                    d.currency,
                  ),
                ],
                [
                  'Por liquidar',
                  formatHomeMoney(debtRemaining(data, d.id), d.currency),
                ],
              ]}
            />
            <button
              className={btn}
              disabled={!debtRemaining(data, d.id)}
              onClick={() =>
                open({
                  title:
                    d.type === 'payable'
                      ? 'Registar pagamento'
                      : 'Registar recebimento',
                  fields: [
                    moneyField(),
                    dateField(),
                    {
                      key: 'accountId',
                      label: 'Carteira',
                      options: walletOptions(data).filter(
                        ([id]) =>
                          accountCurrency(
                            data.accounts.find((a) => a.id === id),
                          ) === d.currency,
                      ),
                    },
                  ],
                  submit: (v) =>
                    update((data) =>
                      payHomeDebt(
                        data,
                        d.id,
                        v.accountId,
                        Number(v.amount),
                        v.date,
                      ),
                    ),
                })
              }
            >
              {d.type === 'payable' ? 'Pagar' : 'Receber'}
            </button>
            <details>
              <summary className="text-sm cursor-pointer">
                Prestações e pagamentos
              </summary>
              <ul className="text-xs space-y-2 mt-3">
                {debtInstallments(data, d).map((p) => (
                  <li key={p.number}>
                    Prestação {p.number} · {dateLabel(p.date)} ·{' '}
                    {formatHomeMoney(p.amount, d.currency)} · Restante{' '}
                    {formatHomeMoney(p.remaining, d.currency)}
                  </li>
                ))}
              </ul>
              {(data.debtPayments ?? [])
                .filter((p) => p.debtId === d.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 text-xs mt-2"
                  >
                    <span>
                      {dateLabel(p.date)} ·{' '}
                      {formatHomeMoney(p.amount, d.currency)} ·{' '}
                      {effectiveEntries(data).some((e) => e.id === p.entryId)
                        ? 'Ativo'
                        : 'Estornado'}
                    </span>
                    {effectiveEntries(data).some((e) => e.id === p.entryId) && (
                      <button
                        className={btn}
                        onClick={() =>
                          open({
                            title: 'Estornar pagamento',
                            fields: [{ key: 'reason', label: 'Motivo' }],
                            submit: (v) =>
                              update((data) =>
                                reverseHomeEntry(data, p.entryId, v.reason),
                              ),
                          })
                        }
                      >
                        Estornar
                      </button>
                    )}
                  </div>
                ))}
            </details>
          </section>
        ))}
      {!data.debts?.some((d) => !d.deletedAt) && (
        <p className={muted}>Ainda não existem dívidas pessoais.</p>
      )}
      {a.modal}
    </div>
  );
}

const historyLabels: Record<string, string> = {
  title: 'Descrição',
  name: 'Nome',
  amount: 'Valor',
  principal: 'Valor total',
  date: 'Data',
  deadline: 'Prazo',
  category: 'Categoria',
  subcategory: 'Subcategoria',
  limit: 'Limite',
  person: 'Pessoa',
  currency: 'Moeda',
  type: 'Tipo',
  accountId: 'Carteira',
  sourceAccountId: 'Carteira de origem',
  destinationId: 'Destino',
  openingBalance: 'Saldo inicial',
  time: 'Hora',
  priority: 'Prioridade',
  assignee: 'Responsável',
  month: 'Mês',
  day: 'Dia',
  target: 'Objetivo',
  plannedAmount: 'Progresso planeado',
  fundingMode: 'Financiamento',
  active: 'Ativo',
  done: 'Concluído',
  issueDate: 'Data da dívida',
  dueDate: 'Vencimento',
  installmentCount: 'Prestações',
  firstInstallment: 'Primeira prestação',
  fileName: 'Ficheiro',
  kind: 'Tipo',
  expiresOn: 'Validade',
  recurrence: 'Repetição',
  quantity: 'Quantidade',
  unitPrice: 'Preço unitário',
  goalId: 'Meta',
};
function historyValue(data: HomeData, key: string, value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (['accountId', 'sourceAccountId', 'destinationId'].includes(key))
    return (
      data.accounts.find((a) => a.id === value)?.name ?? 'Carteira indisponível'
    );
  if (key === 'goalId')
    return data.goals.find((g) => g.id === value)?.title ?? 'Meta indisponível';
  if (key === 'category' || key === 'subcategory')
    return homeCategoryName(data, String(value));
  if (key === 'recurrence' && typeof value === 'object') {
    const r = value as {
      frequency: string;
      until?: string;
      count?: number;
      interval?: number;
      unit?: string;
    };
    return `${({ none: 'Não repetir', weekly: 'Semanal', fortnightly: 'Quinzenal', monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizada' } as Record<string, string>)[r.frequency] ?? 'Repetição'}${r.interval ? ' · ' + r.interval + ' ' + ({ days: 'dias', weeks: 'semanas', months: 'meses' } as Record<string, string>)[r.unit ?? 'days'] : ''}${r.until ? ' até ' + dateLabel(r.until) : r.count ? ' · ' + r.count + ' ocorrências' : ''}`;
  }
  if (typeof value === 'object') return '—';
  const values: Record<string, string> = {
    income: 'Rendimento',
    expense: 'Despesa',
    transfer: 'Transferência',
    reversal: 'Estorno',
    debt_in: 'Amortização recebida',
    debt_out: 'Amortização paga',
    payable: 'A pagar',
    receivable: 'A receber',
    reserve: 'Reserva',
    plan: 'Planeamento',
    low: 'Baixa',
    normal: 'Normal',
    high: 'Alta',
    current: 'Disponível',
    savings: 'Reserva',
    receipt: 'Comprovativo',
    invoice: 'Fatura',
    warranty: 'Garantia',
    other: 'Outro',
  };
  return values[String(value)] ?? String(value);
}

export function HomeHistory() {
  const a = useActions();
  const [kind, setKind] = useState<HomeEntity>('entry');
  const [query, setQuery] = useState('');
  const rows = (a.data[homeEntityKey[kind]] ?? []) as {
    id: string;
    title?: string;
    name?: string;
    deletedAt?: string;
    editedAt?: string;
    edits?: { changedAt: string; before: Record<string, unknown> }[];
  }[];
  const labels: Record<HomeEntity, string> = {
    entry: 'Lançamentos',
    account: 'Carteiras',
    budget: 'Orçamentos',
    bill: 'Contas da casa',
    goal: 'Metas',
    task: 'Tarefas',
    debt: 'Dívidas',
    plan: 'Planos',
    document: 'Documentos',
  };
  const confirm = (id: string, revision?: number) =>
    a.open({
      title: 'Recuperar registo',
      description:
        revision === undefined
          ? 'Recuperar este registo eliminado? Os saldos e as referências serão validados. Contas da casa recuperadas ficam inativas até as reativares.'
          : 'Aplicar esta versão anterior? O ID permanece e a alteração fica registada. Os saldos e as referências serão validados.',
      submit: () =>
        a.update((data) => restoreHomeEntity(data, kind, id, revision)),
    });
  return (
    <div className="space-y-4">
      {a.alert}
      <p className={muted}>
        Histórico local de alterações e eliminações. Transferências Business e
        estornos conservam as regras próprias de correção.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Tipo de histórico"
          className={input + ' sm:w-auto'}
          value={kind}
          onChange={(e) => setKind(e.target.value as HomeEntity)}
        >
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          aria-label="Pesquisar histórico"
          className={input + ' sm:w-auto'}
          placeholder="Pesquisar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {rows
        .filter((r) => r.deletedAt || r.edits?.length)
        .filter((r) =>
          JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
        )
        .map((r) => (
          <section key={r.id} className={panel}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-sm">
                {r.title ??
                  r.name ??
                  ('category' in r
                    ? homeCategoryName(a.data, String(r.category))
                    : labels[kind])}
              </h2>
              {r.deletedAt && (
                <button className={btn} onClick={() => confirm(r.id)}>
                  Recuperar eliminado
                </button>
              )}
            </div>
            <p className={muted}>
              {r.deletedAt
                ? 'Eliminado: ' + new Date(r.deletedAt).toLocaleString('pt-PT')
                : 'Ativo'}{' '}
              · {(r.edits ?? []).length} alterações
            </p>
            {r.edits?.map((e, i) => (
              <details key={i}>
                <summary className="text-xs cursor-pointer">
                  Versão anterior a{' '}
                  {new Date(e.changedAt).toLocaleString('pt-PT')}
                </summary>
                <dl className="grid sm:grid-cols-2 gap-2 text-xs my-3">
                  {Object.entries(e.before)
                    .filter(([key]) => historyLabels[key])
                    .map(([key, value]) => (
                      <div key={key} className="break-words">
                        <dt className={muted}>{historyLabels[key]}</dt>
                        <dd>{historyValue(a.data, key, value)}</dd>
                      </div>
                    ))}
                </dl>
                <button className={btn} onClick={() => confirm(r.id, i)}>
                  Recuperar esta versão
                </button>
              </details>
            ))}
          </section>
        ))}
      {!rows.some((r) => r.deletedAt || r.edits?.length) && (
        <p className={muted}>
          Ainda não há alterações ou eliminações neste grupo.
        </p>
      )}
      {a.modal}
    </div>
  );
}

export function HomePlanning() {
  const a = useActions();
  const [currency, setCurrency] = useState<HomeCurrency>('AOA');
  const [account, setAccount] = useState('all');
  const today = todayLocal();
  const [to, setTo] = useState(dueDate(today.slice(0, 7), 31));
  const f = homeForecast(
    a.data,
    today,
    to < today ? today : to,
    currency,
    account,
  );
  const edit = (p?: HomePlan) =>
    a.open({
      title: p ? 'Editar previsão' : 'Nova previsão',
      description:
        'O planeamento simula movimentos futuros; não debita dinheiro. Não repitas aqui uma conta recorrente ou prestação que já aparece automaticamente.',
      fields: [
        { key: 'title', label: 'Descrição' },
        {
          key: 'type',
          label: 'Tipo',
          options: [
            ['income', 'Rendimento previsto'],
            ['expense', 'Despesa prevista'],
            ['reserve', 'Reserva para meta'],
          ],
        },
        moneyField(),
        { key: 'currency', label: 'Moeda', options: currencies },
        dateField(),
        {
          key: 'accountId',
          label: 'Carteira',
          options: (values) =>
            walletOptions(a.data).filter(
              ([id]) =>
                accountCurrency(a.data.accounts.find((a) => a.id === id)) ===
                values.currency,
            ),
        },
        {
          key: 'category',
          label: 'Categoria',
          options: (values) =>
            Categories(a.data, values.type === 'income' ? 'income' : 'expense'),
        },
        {
          key: 'goalId',
          label: 'Meta (obrigatória para reservas)',
          optional: true,
          options: a.data.goals
            .filter((g) => !g.deletedAt)
            .map((g) => [g.id, g.title]),
        },
      ],
      values: p
        ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)]))
        : undefined,
      submit: (v) =>
        a.update((data) =>
          saveHomePlan(data, {
            ...p,
            id: p?.id ?? createId('home-plan'),
            title: v.title.trim(),
            type: v.type as HomePlan['type'],
            amount: Number(v.amount),
            currency: v.currency as HomeCurrency,
            date: v.date,
            accountId: v.accountId,
            category: v.category,
            goalId: v.type === 'reserve' ? v.goalId : undefined,
          }),
        ),
    });
  return (
    <div className="space-y-4">
      {a.alert}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Moeda da previsão"
          className={input + ' sm:w-auto'}
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value as HomeCurrency);
            setAccount('all');
          }}
        >
          {currencies.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Carteira da previsão"
          className={input + ' sm:w-auto'}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option value="all">Todas as carteiras desta moeda</option>
          {walletOptions(a.data)
            .filter(
              ([id]) =>
                accountCurrency(a.data.accounts.find((a) => a.id === id)) ===
                currency,
            )
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
        <label className="text-xs">
          Prever até
          <input
            aria-label="Fim da previsão"
            type="date"
            className={input}
            min={today}
            value={to}
            onChange={(e) => {
              if (e.target.value >= today) setTo(e.target.value);
            }}
          />
        </label>
        <button className={primary} onClick={() => edit()}>
          Nova previsão
        </button>
      </div>
      <p className={muted}>
        Parte do saldo disponível de hoje. Contas pendentes, prestações e planos
        entram na previsão; as carteiras de reserva ficam separadas. Ao escolher
        uma carteira, as dívidas desta moeda são simuladas nessa carteira.
      </p>
      <Stats
        items={[
          ['Disponível hoje', formatHomeMoney(f.opening, currency)],
          ['Previsto no fim', formatHomeMoney(f.closing, currency)],
          ['Movimentos previstos', String(f.steps.length)],
        ]}
      />
      {!!(f.unallocatedBills + f.unallocatedDebts) && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Fora do cálculo: {f.unallocatedBills} contas sem carteira e{' '}
          {f.unallocatedDebts} dívidas sem carteira de simulação.
        </p>
      )}
      <section className={panel}>
        <h2 className="font-medium">Evolução prevista</h2>
        {f.steps.map((s) => (
          <div
            key={s.id}
            className="flex justify-between gap-3 text-xs border-b border-slate-100 dark:border-dm-border py-2"
          >
            <span>
              {dateLabel(s.date)} · {s.title}
              {s.overdue ? ' · Em atraso' : ''}
            </span>
            <span className={s.balance < 0 ? 'text-rose-600' : ''}>
              {formatHomeMoney(s.amount, currency)} →{' '}
              {formatHomeMoney(s.balance, currency)}
            </span>
          </div>
        ))}
        {!f.steps.length && (
          <p className={muted}>Sem movimentos previstos neste intervalo.</p>
        )}
      </section>
      <h2 className="font-medium">Planos registados</h2>
      {(a.data.plans ?? [])
        .filter((p) => !p.deletedAt)
        .map((p) => (
          <div
            key={p.id}
            className={panel + ' flex items-center justify-between gap-3'}
          >
            <div>
              <p className="text-sm">
                {p.title} · {dateLabel(p.date)}
              </p>
              <p className={muted}>
                {formatHomeMoney(p.amount, p.currency)} ·{' '}
                {p.type === 'income'
                  ? 'Rendimento'
                  : p.type === 'reserve'
                    ? 'Reserva'
                    : 'Despesa'}
              </p>
            </div>
            <RowActions
              title={'previsão ' + p.title}
              edit={() => edit(p)}
              remove={() => a.remove('plan', p.id, p.title)}
            />
          </div>
        ))}
      {a.modal}
    </div>
  );
}

export function HomeReports() {
  const { data } = useHome();
  const [currency, setCurrency] = useState<HomeCurrency>('AOA');
  const [account, setAccount] = useState('all');
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(todayLocal().slice(0, 7));
  const [year, setYear] = useState(todayLocal().slice(0, 4));
  const [from, setFrom] = useState(month + '-01');
  const [to, setTo] = useState(dueDate(month, 31));
  const start =
    period === 'month'
      ? month + '-01'
      : period === 'year'
        ? year + '-01-01'
        : from;
  const end =
    period === 'month'
      ? dueDate(month, 31)
      : period === 'year'
        ? year + '-12-31'
        : to;
  const valid = !!start && !!end && start <= end;
  const r = homeReport(data, start, end, currency, account);
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const prevEnd = new Date(Date.parse(start) - 86400000)
    .toISOString()
    .slice(0, 10);
  const prevStart =
    period === 'year'
      ? String(Number(year) - 1) + '-01-01'
      : period === 'month'
        ? prevEnd.slice(0, 7) + '-01'
        : new Date(Date.parse(start) - days * 86400000)
            .toISOString()
            .slice(0, 10);
  const previous = homeReport(data, prevStart, prevEnd, currency, account);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Período do relatório"
          className={input + ' sm:w-auto'}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="month">Mês</option>
          <option value="year">Ano</option>
          <option value="custom">Intervalo</option>
        </select>
        {period === 'month' ? (
          <input
            aria-label="Mês do relatório"
            className={input + ' sm:w-auto'}
            type="month"
            value={month}
            onChange={(e) => {
              if (/^\d{4}-\d\d$/.test(e.target.value)) setMonth(e.target.value);
            }}
          />
        ) : period === 'year' ? (
          <input
            aria-label="Ano do relatório"
            className={input + ' sm:w-auto'}
            type="number"
            min="1901"
            max="9998"
            value={year}
            onChange={(e) => {
              if (
                Number(e.target.value) >= 1901 &&
                Number(e.target.value) <= 9998
              )
                setYear(e.target.value);
            }}
          />
        ) : (
          <>
            <input
              aria-label="Início do relatório"
              className={input + ' sm:w-auto'}
              type="date"
              value={from}
              onChange={(e) => {
                if (e.target.value) setFrom(e.target.value);
              }}
            />
            <input
              aria-label="Fim do relatório"
              className={input + ' sm:w-auto'}
              type="date"
              value={to}
              onChange={(e) => {
                if (e.target.value) setTo(e.target.value);
              }}
            />
          </>
        )}
        <select
          aria-label="Moeda do relatório"
          className={input + ' sm:w-auto'}
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value as HomeCurrency);
            setAccount('all');
          }}
        >
          {currencies.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Carteira do relatório"
          className={input + ' sm:w-auto'}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option value="all">Todas as carteiras</option>
          {data.accounts
            .filter((a) => accountCurrency(a) === currency)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </select>
      </div>
      {!valid ? (
        <p role="alert">O início deve ser anterior ao fim.</p>
      ) : (
        <>
          <Stats
            items={[
              ['Rendimentos', formatHomeMoney(r.income, currency)],
              ['Despesas', formatHomeMoney(r.expense, currency)],
              ['Resultado', formatHomeMoney(r.net, currency)],
            ]}
          />
          <p className={muted}>
            Período anterior: {dateLabel(prevStart)} a {dateLabel(prevEnd)} ·
            Rendimentos {formatHomeMoney(previous.income, currency)} · Despesas{' '}
            {formatHomeMoney(previous.expense, currency)} · Variação do
            resultado {formatHomeMoney(r.net - previous.net, currency)}.
            Amortizações e transferências são mostradas à parte e não duplicam
            consumo.
          </p>
          <div className="flex gap-2">
            <button
              className={btn}
              onClick={() =>
                download(
                  reportCsv(data, start, end, currency, account),
                  `myoffice-home-${start}-${end}.csv`,
                  'text/csv;charset=utf-8',
                )
              }
            >
              Exportar CSV
            </button>
            <button
              className={btn}
              onClick={() =>
                download(
                  reportPdf(data, start, end, currency, account) as BlobPart,
                  `myoffice-home-${start}-${end}.pdf`,
                  'application/pdf',
                )
              }
            >
              Exportar PDF
            </button>
          </div>
          <section className={panel}>
            <h2 className="font-semibold text-sm">Comparação por mês</h2>
            {r.monthly.map((m) => (
              <div
                key={m.month}
                className="text-xs border-b border-slate-100 dark:border-dm-border pb-2"
              >
                {m.month} · Rendimentos {formatHomeMoney(m.income, currency)} ·
                Despesas {formatHomeMoney(m.expense, currency)} · Amortização
                recebida {formatHomeMoney(m.debtIn, currency)} · paga{' '}
                {formatHomeMoney(m.debtOut, currency)}
              </div>
            ))}
            {!r.entries.length && (
              <p className={muted}>Não há movimentos neste período.</p>
            )}
          </section>
          <section className={panel}>
            <h2 className="font-semibold text-sm">Despesas por categoria</h2>
            {r.categories
              .sort((a, b) => b.amount - a.amount)
              .map((c) => (
                <div key={c.category} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span>{homeCategoryName(data, c.category)}</span>
                    <span>
                      {formatHomeMoney(c.amount, currency)} ·{' '}
                      {Math.round((c.amount / r.expense) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-100 dark:bg-dm-elevated mt-1">
                    <div
                      className="h-2 rounded bg-indigo-500"
                      style={{ width: (c.amount / r.expense) * 100 + '%' }}
                    />
                  </div>
                </div>
              ))}
          </section>
        </>
      )}
    </div>
  );
}

export function HomeStatements() {
  const a = useActions();
  const [account, setAccount] = useState('');
  const currentAccount = useRef(account);
  currentAccount.current = account;
  const [preview, setPreview] = useState<HomeStatementRow[]>([]);
  const [status, setStatus] = useState('pending');
  const [closing, setClosing] = useState('');
  const rows = (a.data.statementRows ?? []).filter(
    (r) => r.accountId === account && r.state === status,
  );
  const existing = new Set(
    (a.data.statementRows ?? []).map((r) => r.fingerprint),
  );
  const fresh = preview.filter((r) => !existing.has(r.fingerprint));
  return (
    <div className="space-y-4">
      {a.alert}
      <p className={muted}>
        CSV com colunas Data, Descrição e Valor; Referência é opcional. Saídas
        negativas, entradas positivas. Datas AAAA-MM-DD ou DD/MM/AAAA. Primeiro
        revê o extrato; depois confere cada movimento. A importação não altera
        saldos.
      </p>
      <label className="block text-xs">
        Carteira do extrato
        <select
          aria-label="Carteira do extrato"
          className={input}
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            setPreview([]);
            setClosing('');
          }}
        >
          <option value="">Escolher carteira</option>
          {walletOptions(a.data).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        Selecionar CSV
        <input
          aria-label="Selecionar extrato CSV"
          type="file"
          accept=".csv,text/csv"
          disabled={!account}
          className={input}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (file.size > 2e6) {
              a.run(() => {
                throw new Error('O extrato excede 2 MB.');
              });
              return;
            }
            try {
              const value = await file.text();
              if (currentAccount.current === account)
                a.run(() => setPreview(parseStatementCsv(value, account)));
            } catch {
              a.run(() => {
                throw new Error('Não foi possível ler o ficheiro.');
              });
            }
          }}
        />
      </label>
      {!!preview.length && (
        <section className={panel}>
          <h2 className="font-medium">Pré-visualização</h2>
          <p className={muted}>
            {fresh.length} novas linhas · {preview.length - fresh.length} já
            importadas
          </p>
          <div className="max-h-64 overflow-auto space-y-2">
            {preview.map((r) => (
              <div key={r.id} className="text-xs">
                {dateLabel(r.date)} · {r.title} ·{' '}
                {formatHomeMoney(
                  r.amount,
                  accountCurrency(
                    a.data.accounts.find((a) => a.id === account),
                  ),
                )}
                {existing.has(r.fingerprint) ? ' · Repetida' : ''}
              </div>
            ))}
          </div>
          <button
            className={primary}
            disabled={!fresh.length}
            onClick={() =>
              a.open({
                title: 'Importar linhas do extrato',
                description: `Guardar ${fresh.length} linhas para conferência? Não serão criados lançamentos nesta etapa.`,
                submit: () => {
                  a.update((data) => {
                    const ids = new Set(
                      (data.statementRows ?? []).map((r) => r.fingerprint),
                    );
                    return validateHomeData({
                      ...data,
                      statementRows: [
                        ...(data.statementRows ?? []),
                        ...fresh.filter((r) => !ids.has(r.fingerprint)),
                      ],
                    });
                  });
                  setPreview([]);
                },
              })
            }
          >
            Importar para conferência
          </button>
        </section>
      )}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Estado do extrato"
          className={input + ' sm:w-auto'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pendentes</option>
          <option value="matched">Conferidos</option>
          <option value="ignored">Ignorados</option>
        </select>
        {account && (
          <label className="text-xs">
            Saldo final do banco (opcional)
            <input
              aria-label="Saldo final do banco"
              className={input}
              type="number"
              step="0.01"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
            />
            {closing && (
              <span className={muted}>
                Diferença face ao saldo atual:{' '}
                {formatHomeMoney(
                  Number(closing) - (balances(a.data)[account] ?? 0),
                  accountCurrency(
                    a.data.accounts.find((a) => a.id === account),
                  ),
                )}
              </span>
            )}
          </label>
        )}
      </div>
      {rows.map((r) => {
        const matches = statementEntryMatches(a.data, r);
        return (
          <section key={r.id} className={panel}>
            <h2 className="text-sm font-medium">{r.title}</h2>
            <p className={muted}>
              {dateLabel(r.date)} ·{' '}
              {formatHomeMoney(
                r.amount,
                accountCurrency(
                  a.data.accounts.find((a) => a.id === r.accountId),
                ),
              )}{' '}
              · {r.reference ?? 'Sem referência'}
            </p>
            {r.state === 'pending' ? (
              <div className="flex flex-wrap gap-2">
                {matches.map((e) => (
                  <button
                    key={e.id}
                    className={btn}
                    onClick={() =>
                      a.open({
                        title: 'Conferir lançamento',
                        description: `Associar a “${e.title}”? O valor, carteira e data coincidem. Não será criado outro movimento.`,
                        submit: () =>
                          a.update((data) =>
                            matchHomeStatement(data, r.id, e.id),
                          ),
                      })
                    }
                  >
                    Conferir: {e.title}
                  </button>
                ))}
                {!matches.length && (
                  <button
                    className={btn}
                    onClick={() =>
                      a.open({
                        title: 'Criar lançamento do extrato',
                        description:
                          'Será criado um movimento que altera o saldo da carteira. Confirma que esta operação ainda não existe.',
                        fields: [
                          {
                            key: 'category',
                            label: 'Categoria',
                            options: Categories(
                              a.data,
                              r.amount > 0 ? 'income' : 'expense',
                            ),
                          },
                        ],
                        submit: (v) =>
                          a.update((data) =>
                            importStatementEntry(data, r.id, v.category),
                          ),
                      })
                    }
                  >
                    Criar lançamento
                  </button>
                )}
                <button
                  className={btn}
                  onClick={() =>
                    a.open({
                      title: 'Ignorar linha',
                      description:
                        'Marcar esta linha como ignorada? O saldo não muda.',
                      submit: () =>
                        a.update((data) => ({
                          ...data,
                          statementRows: data.statementRows!.map((s) =>
                            s.id === r.id ? { ...s, state: 'ignored' } : s,
                          ),
                        })),
                    })
                  }
                >
                  Ignorar
                </button>
              </div>
            ) : (
              <button
                className={btn}
                onClick={() =>
                  a.open({
                    title: 'Voltar a conferir',
                    description:
                      'A linha voltará a pendente. O lançamento existente permanece.',
                    submit: () =>
                      a.update((data) => ({
                        ...data,
                        statementRows: data.statementRows!.map((s) =>
                          s.id === r.id
                            ? { ...s, state: 'pending', entryId: undefined }
                            : s,
                        ),
                      })),
                  })
                }
              >
                Voltar a pendente
              </button>
            )}
          </section>
        );
      })}
      {account && !rows.length && (
        <p className={muted}>Nenhuma linha neste estado.</p>
      )}
      {a.modal}
    </div>
  );
}

export function HomeDocuments() {
  const a = useActions();
  const [file, setFile] = useState<File | null>(null);
  const [documentErrors, setDocumentErrors] = useState<Record<string, string>>(
    {},
  );
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<HomeDocument['kind'] | ''>('');
  const [expires, setExpires] = useState('');
  const [entity, setEntity] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const used = (a.data.documents ?? []).reduce((s, d) => s + d.size, 0);
  const entities: Option[] = [
    ...a.data.entries
      .filter((e) => !e.deletedAt)
      .map((e) => ['entry:' + e.id, 'Lançamento: ' + e.title] as Option),
    ...(a.data.shopping ?? [])
      .filter((e) => !e.deletedAt)
      .map((e) => ['shopping:' + e.id, 'Compra: ' + e.name] as Option),
    ...(a.data.debts ?? [])
      .filter((e) => !e.deletedAt)
      .map((e) => ['debt:' + e.id, 'Dívida: ' + e.title] as Option),
    ...a.data.goals
      .filter((e) => !e.deletedAt)
      .map((e) => ['goal:' + e.id, 'Meta: ' + e.title] as Option),
  ];
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Preenche o título.';
    if (!kind) errors.kind = 'Escolhe o tipo de documento.';
    if (!file) errors.file = 'Seleciona um ficheiro.';
    else if (file.size > 1024 * 1024)
      errors.file = 'Cada ficheiro pode ter no máximo 1 MB.';
    setDocumentErrors(errors);
    if (Object.keys(errors).length) return;
    const selectedFile = file,
      selectedTitle = title,
      selectedKind = kind,
      selectedExpires = expires,
      selectedEntity = entity;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      let raw = '';
      for (let i = 0; i < bytes.length; i += 8192)
        raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const [entityType, ...id] = selectedEntity.split(':');
      if (
        a.run(() =>
          a.update((data) =>
            validateHomeData({
              ...data,
              documents: [
                ...(data.documents ?? []),
                {
                  id: createId('home-document'),
                  title: selectedTitle.trim(),
                  fileName: selectedFile.name,
                  mime: selectedFile.type as HomeDocument['mime'],
                  size: bytes.length,
                  content: btoa(raw),
                  uploadedAt: new Date().toISOString(),
                  kind: selectedKind,
                  expiresOn: selectedExpires || undefined,
                  entityType:
                    (entityType as HomeDocument['entityType']) || undefined,
                  entityId: id.join(':') || undefined,
                },
              ],
            }),
          ),
        )
      ) {
        setTitle('');
        setKind('');
        setExpires('');
        setEntity('');
        setFile(null);
        f.reset();
      }
    } catch {
      a.run(() => {
        throw new Error('Não foi possível ler o documento.');
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      {a.alert}
      <p className={muted}>
        PDF, PNG ou JPEG até 1 MB por ficheiro e 2 MB no total (
        {(used / 1024).toFixed(0)} KB usados). Ficheiros incluídos na cópia JSON
        e guardados neste navegador. Eliminar conserva o ficheiro para
        recuperação no Histórico e continua a ocupar espaço.
      </p>
      <form noValidate onSubmit={submit} className={panel}>
        <h2 className="font-medium">Adicionar documento</h2>
        <label className="block text-xs">
          Título
          <input
            aria-label="Título do documento"
            className={input}
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
          {documentErrors['title'] && (
            <span role="alert" className="text-rose-600">
              {documentErrors['title']}
            </span>
          )}
        </label>
        <label className="block text-xs">
          Tipo
          <select
            aria-label="Tipo de documento"
            className={input}
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="">Escolher</option>
            <option value="receipt">Comprovativo</option>
            <option value="invoice">Fatura</option>
            <option value="warranty">Garantia</option>
            <option value="other">Outro</option>
          </select>
          {documentErrors['kind'] && (
            <span role="alert" className="text-rose-600">
              {documentErrors['kind']}
            </span>
          )}
        </label>
        <label className="block text-xs">
          Ficheiro
          <input
            aria-label="Ficheiro do documento"
            className={input}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {documentErrors['file'] && (
            <span role="alert" className="text-rose-600">
              {documentErrors['file']}
            </span>
          )}
        </label>
        <label className="block text-xs">
          Validade (opcional)
          <input
            aria-label="Validade do documento"
            className={input}
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Associar a (opcional)
          <select
            aria-label="Associação do documento"
            className={input}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">Sem associação</option>
            {entities.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button className={primary} disabled={busy}>
          {busy ? 'A guardar…' : 'Guardar documento'}
        </button>
      </form>
      <input
        aria-label="Pesquisar documentos"
        className={input}
        placeholder="Pesquisar documentos"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {(a.data.documents ?? [])
        .filter(
          (d) =>
            !d.deletedAt &&
            `${d.title} ${d.fileName}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .map((d) => (
          <section key={d.id} className={panel}>
            <div className="flex justify-between items-center gap-3">
              <div>
                <h2 className="text-sm font-medium">{d.title}</h2>
                <p className={muted}>
                  {d.fileName} · {(d.size / 1024).toFixed(0)} KB ·{' '}
                  {dateLabel(d.expiresOn ?? '')}
                  {d.entityType
                    ? ' · Associado a ' +
                      {
                        entry: 'lançamento',
                        shopping: 'compra',
                        debt: 'dívida',
                        goal: 'meta',
                      }[d.entityType]
                    : ''}
                </p>
              </div>
              <RowActions
                title={'documento ' + d.title}
                remove={() => a.remove('document', d.id, d.title)}
                edit={() =>
                  a.open({
                    title: 'Editar documento',
                    fields: [
                      { key: 'title', label: 'Título' },
                      dateField('expiresOn', 'Validade', true),
                      {
                        key: 'entity',
                        label: 'Associação',
                        optional: true,
                        options: entities,
                      },
                    ],
                    values: {
                      title: d.title,
                      expiresOn: d.expiresOn ?? '',
                      entity: d.entityType
                        ? d.entityType + ':' + d.entityId
                        : '',
                    },
                    submit: (v) =>
                      a.update((data) => {
                        const [type, ...id] = v.entity.split(':');
                        return {
                          ...data,
                          documents: data.documents!.map((row) =>
                            row.id === d.id
                              ? homeAuditEdit(row, {
                                  ...row,
                                  title: v.title.trim(),
                                  expiresOn: v.expiresOn || undefined,
                                  entityType:
                                    (type as HomeDocument['entityType']) ||
                                    undefined,
                                  entityId: id.join(':') || undefined,
                                })
                              : row,
                          ),
                        };
                      }),
                  })
                }
              />
            </div>
            <button
              className={btn}
              onClick={() =>
                download(
                  Uint8Array.from(atob(d.content), (c) => c.charCodeAt(0)),
                  d.fileName,
                  d.mime,
                )
              }
            >
              Descarregar ficheiro
            </button>
          </section>
        ))}
      {a.modal}
    </div>
  );
}

export function HomeCalendar({
  onNavigate,
}: {
  onNavigate: (section: HomeSection) => void;
}) {
  const a = useActions();
  const today = useToday();
  const [anchor, setAnchor] = useState(today);
  const previousToday = useRef(today);
  useEffect(() => {
    if (previousToday.current !== today) {
      const previous = previousToday.current;
      setAnchor((current) => (current === previous ? today : current));
      previousToday.current = today;
    }
  }, [today]);
  const [view, setView] = useState('month');
  const start =
    view === 'month'
      ? anchor.slice(0, 7) + '-01'
      : (() => {
          const d = new Date(anchor + 'T12:00:00Z');
          d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
          return d.toISOString().slice(0, 10);
        })();
  const end =
    view === 'month'
      ? dueDate(anchor.slice(0, 7), 31)
      : new Date(Date.parse(start) + 6 * 86400000).toISOString().slice(0, 10);
  const events = homeCalendarEvents(a.data, start, end);
  const offset = (7 + (new Date(start + 'T12:00:00Z').getUTCDay() - 1)) % 7;
  const count =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const move = (n: number) => {
    const d = new Date(anchor + 'T12:00:00Z');
    if (view === 'month') {
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + n);
    } else d.setUTCDate(d.getUTCDate() + 7 * n);
    setAnchor(d.toISOString().slice(0, 10));
  };
  const details = (id: string) => {
    const t = a.data.tasks.find((t) => t.id === id)!;
    a.open({
      title: 'Detalhes da tarefa',
      description:
        'Organiza o horário, a prioridade, o responsável e a repetição. A conclusão de cada ocorrência é independente.',
      fields: [
        { key: 'time', label: 'Hora', type: 'time', optional: true },
        {
          key: 'priority',
          label: 'Prioridade',
          options: [
            ['low', 'Baixa'],
            ['normal', 'Normal'],
            ['high', 'Alta'],
          ],
          optional: true,
        },
        { key: 'assignee', label: 'Responsável', optional: true },
        {
          key: 'frequency',
          label: 'Repetição',
          options: [
            ['none', 'Não repetir'],
            ['weekly', 'Semanal'],
            ['fortnightly', 'Quinzenal'],
            ['monthly', 'Mensal'],
            ['yearly', 'Anual'],
            ['custom', 'Personalizada'],
          ],
        },
        {
          key: 'interval',
          label: 'Intervalo personalizado',
          type: 'number',
          min: '1',
          max: '10000',
          step: '1',
          optional: true,
        },
        {
          key: 'unit',
          label: 'Unidade personalizada',
          options: [
            ['days', 'Dias'],
            ['weeks', 'Semanas'],
            ['months', 'Meses'],
          ],
          optional: true,
        },
        {
          key: 'end',
          label: 'Fim da repetição',
          options: [
            ['never', 'Sem fim'],
            ['date', 'Até uma data'],
            ['count', 'Número de ocorrências'],
          ],
        },
        dateField('until', 'Data final (se escolhida)', true),
        {
          key: 'count',
          label: 'Número de ocorrências (se escolhido)',
          type: 'number',
          min: '1',
          max: '50000',
          step: '1',
          optional: true,
        },
      ],
      values: {
        time: t.time ?? '',
        priority: t.priority ?? '',
        assignee: t.assignee ?? '',
        frequency: t.recurrence?.frequency ?? 'none',
        interval: t.recurrence?.interval?.toString() ?? '',
        unit: t.recurrence?.unit ?? '',
        end: t.recurrence?.end ?? 'never',
        until: t.recurrence?.until ?? '',
        count: t.recurrence?.count?.toString() ?? '',
      },
      submit: (v) =>
        a.update((data) => ({
          ...data,
          tasks: data.tasks.map((row) =>
            row.id === id
              ? homeAuditEdit(row, {
                  ...row,
                  time: v.time || undefined,
                  priority: (v.priority as typeof row.priority) || undefined,
                  assignee: v.assignee.trim() || undefined,
                  recurrence: {
                    frequency: v.frequency as 'none',
                    interval:
                      v.frequency === 'custom' ? Number(v.interval) : undefined,
                    unit:
                      v.frequency === 'custom' ? (v.unit as 'days') : undefined,
                    end: v.end as 'never',
                    until: v.end === 'date' ? v.until : undefined,
                    count: v.end === 'count' ? Number(v.count) : undefined,
                  },
                })
              : row,
          ),
        })),
    });
  };
  const destinations: Record<string, HomeSection> = {
    bill: 'Contas da casa',
    goal: 'Metas e sonhos',
    debt: 'Dívidas pessoais',
    document: 'Documentos',
  };
  return (
    <section className={panel}>
      {a.alert}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-semibold">Calendário pessoal</h2>
        <div className="flex gap-1">
          <button
            className={btn}
            aria-label="Período anterior"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button className={btn} onClick={() => setAnchor(today)}>
            Hoje
          </button>
          <button
            className={btn}
            aria-label="Período seguinte"
            onClick={() => move(1)}
          >
            <ChevronRight size={16} />
          </button>
          <select
            aria-label="Vista do calendário pessoal"
            className={input}
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="month">Mês</option>
            <option value="week">Semana</option>
          </select>
        </div>
      </div>
      <p className={muted}>
        {dateLabel(start)} — {dateLabel(end)} · Tarefas, contas, metas,
        prestações e garantias
      </p>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[560px] gap-1 text-xs">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
            <p key={d} className="text-center py-2">
              {d}
            </p>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div key={'empty' + i} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const date = new Date(Date.parse(start) + i * 86400000)
              .toISOString()
              .slice(0, 10);
            return (
              <div
                key={date}
                className={
                  'min-h-24 rounded-lg border p-2 ' +
                  (date === today
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-dm-elevated'
                    : 'border-slate-200 dark:border-dm-border')
                }
              >
                <p className="font-semibold mb-2">{Number(date.slice(8))}</p>
                {events
                  .filter((e) => e.date === date)
                  .map((e) => (
                    <div key={e.id} className="space-y-1 mb-2 break-words">
                      {e.kind === 'task' ? (
                        <>
                          <label className="flex items-start gap-1">
                            <input
                              type="checkbox"
                              aria-label={`Concluir ocorrência ${e.title} ${date}`}
                              checked={e.done}
                              onChange={() =>
                                a.run(() =>
                                  a.update((data) =>
                                    completeHomeTask(
                                      data,
                                      e.sourceId,
                                      date,
                                      !e.done,
                                    ),
                                  ),
                                )
                              }
                            />
                            <span
                              className={
                                e.done ? 'line-through opacity-50' : ''
                              }
                            >
                              {e.time ?? ''} {e.title}
                            </span>
                          </label>
                          <button
                            className="text-indigo-600 dark:text-indigo-300 underline"
                            onClick={() => details(e.sourceId)}
                          >
                            Detalhes
                          </button>
                        </>
                      ) : (
                        <button
                          className={
                            'text-left ' + (e.done ? 'opacity-50' : '')
                          }
                          onClick={() => onNavigate(destinations[e.kind])}
                        >
                          {e.done ? '✓ ' : ''}
                          {e.title}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 border-t border-slate-200 dark:border-dm-border pt-3">
        <h3 className="text-sm font-medium">Organização das tarefas</h3>
        {a.data.tasks
          .filter((t) => !t.deletedAt)
          .sort(
            (x, y) =>
              (y.priority === 'high' ? 1 : 0) -
                (x.priority === 'high' ? 1 : 0) || x.date.localeCompare(y.date),
          )
          .map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center gap-2 text-xs"
            >
              <span>
                {t.title} · {t.time ?? 'Sem hora'} ·{' '}
                {t.priority === 'high'
                  ? 'Alta'
                  : t.priority === 'low'
                    ? 'Baixa'
                    : 'Normal'}
                {t.assignee ? ' · ' + t.assignee : ''}
              </span>
              <button
                className={btn}
                aria-label={'Detalhes da tarefa ' + t.title}
                onClick={() => details(t.id)}
              >
                Detalhes
              </button>
            </div>
          ))}
      </div>
      {a.modal}
    </section>
  );
}
export function HomeOverview({
  onNavigate,
}: {
  onNavigate: (section: HomeSection) => void;
}) {
  const { data } = useHome();
  const today = todayLocal();
  const events = homeCalendarEvents(data, today, today);
  return (
    <section className={panel}>
      <h2 className="font-semibold text-sm">Acompanhamento pessoal</h2>
      <div className="flex flex-wrap gap-2">
        {(
          [
            'Planeamento',
            'Relatórios',
            'Dívidas pessoais',
            'Histórico',
            'Extratos',
            'Documentos',
          ] as HomeSection[]
        ).map((section) => (
          <button
            key={section}
            className={btn}
            onClick={() => onNavigate(section)}
          >
            {section}
          </button>
        ))}
      </div>
      <p className={muted}>
        {events.filter((e) => !e.done).length} compromissos ou vencimentos hoje
        ·{' '}
        {(data.statementRows ?? []).filter((r) => r.state === 'pending').length}{' '}
        linhas de extrato por conferir
      </p>
    </section>
  );
}
export function HomeTools({ section }: { section: HomeSection }) {
  switch (section) {
    case 'Dívidas pessoais':
      return <HomeDebts />;
    case 'Histórico':
      return <HomeHistory />;
    case 'Planeamento':
      return <HomePlanning />;
    case 'Relatórios':
      return <HomeReports />;
    case 'Extratos':
      return <HomeStatements />;
    case 'Documentos':
      return <HomeDocuments />;
    default:
      return null;
  }
}
