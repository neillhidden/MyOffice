import { categoryChildren } from '../../utils/categories';
import { useState } from 'react';
import { useStock } from '../../context/StockContext';

export function BusinessCategories({
  onCreateProduct,
  onViewProduct,
}: {
  onCreateProduct: (category: string, subcategory?: string) => void;
  onViewProduct: (id: string) => void;
}) {
  const { categories, products, addCategory, subcategories, addSubcategory } =
    useStock();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [child, setChild] = useState('');
  const [childFilter, setChildFilter] = useState('');
  const [error, setError] = useState('');
  const all = Array.from(
    new Set([...categories, ...products.map((p) => p.category)]),
  );
  const current = selected || all[0] || '';
  const button =
    'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-dm-elevated';
  const input =
    'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2 text-sm w-full';
  return (
    <section className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const value = name.trim();
          if (!value) return;
          if (
            all.some((c) => c.toLocaleLowerCase() === value.toLocaleLowerCase())
          ) {
            setError('Esta categoria já existe.');
            return;
          }
          addCategory(value);
          setSelected(value);
          setName('');
          setError('');
        }}
      >
        <label className="text-xs flex-1 min-w-40">
          Nova categoria
          <input
            id="business-category-name"
            required
            maxLength={300}
            className={`${input} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button id="business-category-add" className={button}>
          Adicionar categoria
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Categorias de produtos"
      >
        {all.map((c) => (
          <button
            type="button"
            aria-pressed={current === c}
            className={`${button} ${current === c ? 'bg-slate-100 dark:bg-dm-elevated font-semibold' : ''}`}
            key={c}
            onClick={() => {
              setSelected(c);
              setChildFilter('');
            }}
          >
            {c} ({products.filter((p) => p.category === c).length})
          </button>
        ))}
      </div>
      {current && (
        <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <h2 className="font-semibold text-sm break-words">{current}</h2>
            <button
              id="business-category-new-product"
              className={button}
              onClick={() => onCreateProduct(current, childFilter || undefined)}
            >
              Adicionar produto nesta categoria
            </button>
          </div>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                if (
                  categoryChildren(subcategories, current).some(
                    (c) =>
                      c.toLocaleLowerCase() ===
                      child.trim().toLocaleLowerCase(),
                  )
                )
                  throw new Error('Esta subcategoria já existe.');
                addSubcategory(current, child);
                setChild('');
                setError('');
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'Não foi possível guardar.',
                );
              }
            }}
          >
            <label className="flex-1 min-w-40 text-xs">
              Nova subcategoria de {current}
              <input
                id="business-subcategory-name"
                required
                maxLength={300}
                value={child}
                onChange={(e) => setChild(e.target.value)}
                className={`${input} mt-1`}
              />
            </label>
            <button id="business-subcategory-add" className={button}>
              Adicionar subcategoria
            </button>
          </form>
          <label className="block text-xs">
            Subcategoria
            <select
              id="business-subcategory-filter"
              className={`${input} mt-1`}
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {Array.from(
                new Set([
                  ...categoryChildren(subcategories, current),
                  ...products
                    .filter((p) => p.category === current && p.subcategory)
                    .map((p) => p.subcategory!),
                ]),
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            Pesquisar produto ou SKU
            <input
              id="business-category-search"
              className={`${input} mt-1`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products
              .filter(
                (p) =>
                  p.category === current &&
                  (!childFilter || p.subcategory === childFilter) &&
                  `${p.name} ${p.sku}`
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
              )
              .map((p) => (
                <button
                  key={p.id}
                  className={`${button} text-left space-y-1 min-w-0`}
                  onClick={() => onViewProduct(p.id)}
                >
                  <span className="block text-sm font-medium break-words">
                    {p.name}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-dm-muted break-words">
                    {p.sku} · {p.subcategory || 'Sem subcategoria'} · {p.status}
                  </span>
                  <span className="block text-xs">Ver produto</span>
                </button>
              ))}
          </div>
          {!products.some(
            (p) =>
              p.category === current &&
              (!childFilter || p.subcategory === childFilter) &&
              `${p.name} ${p.sku}`
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase()),
          ) && (
            <p className="text-xs text-slate-500 dark:text-dm-muted">
              Nenhum produto encontrado nesta categoria.
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-dm-muted">
            O cadastro usa as mesmas validações do estoque. Quantidades só mudam
            através de movimentações.
          </p>
        </div>
      )}
    </section>
  );
}
