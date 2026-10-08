import { HomeCurrency } from '../../types/home';
import { categoryChildren, HOME_SUBCATEGORIES } from '../../utils/categories';
import { useEffect, useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { createId } from '../../utils/ids';
import {
  effectiveEntries,
  HOME_CATEGORIES,
  HOME_INCOME_CATEGORIES,
  accountCurrency,
  formatHomeMoney,
  money,
  payHomeShopping,
  text,
  todayLocal,
} from '../../utils/home';
import { formatKwanza } from '../../utils/formatters';

const panel =
  'rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-4';
const input =
  'w-full min-h-10 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2 text-sm';
const button =
  'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-dm-elevated disabled:opacity-50';
export function HomeCategories() {
  const { data, update } = useHome();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [parent, setParent] = useState('Games');
  const [child, setChild] = useState('');
  const [error, setError] = useState('');
  const categories =
    kind === 'expense'
      ? (data.categories ?? HOME_CATEGORIES)
      : (data.incomeCategories ?? HOME_INCOME_CATEGORIES);
  const tree =
    kind === 'expense'
      ? (data.subcategories ?? HOME_SUBCATEGORIES)
      : (data.incomeSubcategories ?? {});
  useEffect(() => {
    setParent(categories.includes('Games') ? 'Games' : (categories[0] ?? ''));
  }, [kind]);
  const run = (fn: () => void) => {
    try {
      fn();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    }
  };
  return (
    <section className={panel}>
      <h2 className="text-sm font-semibold">Categorias pessoais</h2>
      <p className="text-xs text-slate-500 dark:text-dm-muted">
        Despesas e rendimentos têm listas próprias. Alimentação, Internet,
        Transporte e Saúde são categorias; podes acrescentar subcategorias a
        cada uma.
      </p>
      <label className="block text-xs">
        Tipo de categoria
        <select
          id="home-category-kind"
          className={`${input} mt-1`}
          value={kind}
          onChange={(e) => setKind(e.target.value as 'expense' | 'income')}
        >
          <option value="expense">Despesas</option>
          <option value="income">Rendimentos</option>
        </select>
      </label>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const value = text(name);
            if (
              categories.some(
                (c) => c.toLocaleLowerCase() === value.toLocaleLowerCase(),
              )
            )
              throw new Error('Esta categoria já existe.');
            update((d) => ({
              ...d,
              ...(kind === 'expense'
                ? { categories: [...(d.categories ?? HOME_CATEGORIES), value] }
                : {
                    incomeCategories: [
                      ...(d.incomeCategories ?? HOME_INCOME_CATEGORIES),
                      value,
                    ],
                  }),
            }));
            setName('');
          });
        }}
      >
        <label className="flex-1 min-w-40 text-xs">
          Nova categoria
          <input
            id="home-category-name"
            required
            maxLength={300}
            className={`${input} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button id="home-category-add" className={button}>
          Adicionar categoria
        </button>
      </form>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const value = text(child);
            if (
              categoryChildren(tree, parent).some(
                (c) => c.toLocaleLowerCase() === value.toLocaleLowerCase(),
              )
            )
              throw new Error('Esta subcategoria já existe.');
            update((d) => {
              const key =
                kind === 'expense' ? 'subcategories' : 'incomeSubcategories';
              const old =
                d[key] ?? (kind === 'expense' ? HOME_SUBCATEGORIES : {});
              return {
                ...d,
                [key]: {
                  ...old,
                  [parent]: [...categoryChildren(old, parent), value],
                },
              };
            });
            setChild('');
          });
        }}
      >
        <label className="flex-1 min-w-40 text-xs">
          Categoria principal
          <select
            id="home-subcategory-parent"
            className={`${input} mt-1`}
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-40 text-xs">
          Nova subcategoria
          <input
            id="home-subcategory-name"
            required
            maxLength={300}
            className={`${input} mt-1`}
            value={child}
            onChange={(e) => setChild(e.target.value)}
          />
        </label>
        <button id="home-subcategory-add" className={button}>
          Adicionar subcategoria
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c} className="text-xs">
            <strong>{c}</strong>
            <span className="text-slate-500 dark:text-dm-muted">
              {' '}
              · {categoryChildren(tree, c).join(' · ') || 'Sem subcategorias'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export function HomeShopping({
  currency = 'AOA',
}: {
  currency?: HomeCurrency;
}) {
  const cash = (value: number) => formatHomeMoney(value, currency);
  const { data, update } = useHome();
  const [name, setName] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [childFilter, setChildFilter] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [account, setAccount] = useState(data.accounts[0].id);
  const [date, setDate] = useState(todayLocal);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const active = new Set(effectiveEntries(data).map((e) => e.id));
  useEffect(() => {
    setAccount(
      data.accounts.find(
        (a) => a.kind === 'current' && accountCurrency(a) === currency,
      )?.id ?? '',
    );
    setEditingId(null);
    setName('');
    setPrice('');
  }, [currency]);
  const items = (data.shopping ?? []).filter(
    (i) => (i.currency ?? 'AOA') === currency,
  );
  const categories = Array.from(
    new Set([
      ...(data.categories ?? HOME_CATEGORIES),
      ...items.map((i) => i.category),
    ]),
  );
  const pending = items.filter(
    (i) => !i.archived && (!i.entryId || !active.has(i.entryId)),
  );
  const expected =
    pending.reduce(
      (s, i) => s + Math.round(i.quantity * i.unitPrice * 100),
      0,
    ) / 100;
  const run = (fn: () => void) => {
    try {
      fn();
      setError('');
      setNotice('Alteração guardada neste navegador.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    }
  };
  return (
    <div className="space-y-4">
      <section className={panel}>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Compras da casa</h2>
            <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
              {pending.length} itens por comprar · Previsão: {cash(expected)}
            </p>
          </div>
        </div>
        <form
          id="home-shopping-form"
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => {
              const amount = money(Number(price), false);
              const qty = Number(quantity);
              if (!Number.isFinite(qty) || qty <= 0 || qty > 1000000)
                throw new Error('Quantidade inválida.');
              const item = {
                id: editingId ?? createId('home-shopping'),
                name: text(name),
                category: text(category),
                subcategory: subcategory || undefined,
                quantity: qty,
                unitPrice: amount,
                currency,
                archived: false,
              };
              update((d) => {
                const existing = d.shopping?.find((i) => i.id === editingId);
                if (existing?.entryId)
                  throw new Error(
                    'Uma compra com pagamento mantém os seus dados originais.',
                  );
                return {
                  ...d,
                  shopping: editingId
                    ? (d.shopping ?? []).map((i) =>
                        i.id === editingId ? item : i,
                      )
                    : [...(d.shopping ?? []), item],
                };
              });
              setName('');
              setQuantity('1');
              setPrice('');
              setEditingId(null);
            });
          }}
        >
          <label className="text-xs">
            Produto ou item
            <input
              id="home-shopping-name"
              required
              maxLength={300}
              className={`${input} mt-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Categoria
            <select
              id="home-shopping-category"
              className={`${input} mt-1`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            Subcategoria
            <select
              id="home-shopping-subcategory"
              className={`${input} mt-1`}
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            >
              <option value="">Sem subcategoria</option>
              {categoryChildren(
                data.subcategories ?? HOME_SUBCATEGORIES,
                category,
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            Quantidade
            <input
              id="home-shopping-quantity"
              required
              type="number"
              min="0.001"
              max="1000000"
              step="0.001"
              className={`${input} mt-1`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Preço unitário previsto ({currency === 'AOA' ? 'Kz' : 'USD'})
            <input
              id="home-shopping-price"
              required
              type="number"
              min="0"
              step="0.01"
              className={`${input} mt-1`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button id="home-shopping-save" className={button}>
              {editingId ? 'Guardar item' : 'Adicionar item'}
            </button>
            {editingId && (
              <button
                type="button"
                className={button}
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setPrice('');
                  setQuantity('1');
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-xs text-slate-500 dark:text-dm-muted">
          {notice}
        </p>
      )}
      <section className={panel}>
        <p className="text-xs text-slate-500 dark:text-dm-muted">
          Confere o preço antes de pagar. “Registar pagamento” cria uma despesa
          real; o estorno faz-se em Finanças.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-xs">
            Conta para pagamento
            <select
              id="home-shopping-account"
              className={`${input} mt-1`}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              {data.accounts
                .filter(
                  (a) =>
                    a.kind === 'current' && accountCurrency(a) === currency,
                )
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-xs">
            Data do pagamento
            <input
              id="home-shopping-date"
              type="date"
              required
              max={todayLocal()}
              className={`${input} mt-1`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Filtrar categoria
            <select
              id="home-shopping-filter"
              className={`${input} mt-1`}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setChildFilter('');
              }}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {filter && (
          <label className="block text-xs">
            Filtrar subcategoria
            <select
              id="home-shopping-subcategory-filter"
              className={`${input} mt-1`}
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {categoryChildren(
                data.subcategories ?? HOME_SUBCATEGORIES,
                filter,
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Mostrar arquivados
        </label>
        <div className="space-y-3">
          {items
            .filter(
              (i) =>
                (!i.archived || showArchived) &&
                (!filter || i.category === filter) &&
                (!childFilter || i.subcategory === childFilter),
            )
            .map((item) => {
              const paid = !!item.entryId && active.has(item.entryId);
              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-200 dark:border-dm-border p-3 flex flex-wrap justify-between items-center gap-3"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium break-words">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
                      {item.category}
                      {item.subcategory ? ` / ${item.subcategory}` : ''} ·{' '}
                      {item.quantity} × {cash(item.unitPrice)} ·{' '}
                      {cash(
                        Math.round(item.quantity * item.unitPrice * 100) / 100,
                      )}
                    </p>
                    <p className="text-xs mt-1">
                      {item.archived
                        ? 'Arquivado'
                        : paid
                          ? 'Pago'
                          : item.entryId
                            ? 'Pagamento estornado'
                            : 'Por comprar'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!item.entryId && !item.archived && (
                      <button
                        className={button}
                        onClick={() => {
                          setEditingId(item.id);
                          setName(item.name);
                          setCategory(item.category);
                          setSubcategory(item.subcategory ?? '');
                          setQuantity(String(item.quantity));
                          setPrice(String(item.unitPrice));
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {!paid && !item.archived && (
                      <button
                        className={button}
                        disabled={item.unitPrice <= 0}
                        onClick={() =>
                          run(() =>
                            update((d) =>
                              payHomeShopping(d, item.id, account, date),
                            ),
                          )
                        }
                      >
                        Registar pagamento
                      </button>
                    )}
                    <button
                      className={button}
                      onClick={() =>
                        run(() =>
                          update((d) => ({
                            ...d,
                            shopping: (d.shopping ?? []).map((i) =>
                              i.id === item.id
                                ? { ...i, archived: !i.archived }
                                : i,
                            ),
                          })),
                        )
                      }
                    >
                      {item.archived ? 'Restaurar' : 'Arquivar'}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
        {!items.length && (
          <p className="text-sm text-slate-500 dark:text-dm-muted">
            A lista está vazia. Adiciona o primeiro item acima.
          </p>
        )}
      </section>
    </div>
  );
}
