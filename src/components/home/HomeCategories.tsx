import { useState } from 'react';
import { Pencil, Trash2, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { HomeCategory } from '../../types/home';
import {
  categoryDuplicates,
  categoryIdentity,
  deleteHomeCategory,
  homeCategoryUsage,
  moveHomeCategory,
  normalizeHomeCatalog,
  saveHomeCategory,
} from '../../utils/homeCategories';
import { HomeModal } from './HomeModal';
import { CATEGORY_ICON_GROUPS, CategoryIcon } from './CategoryIcons';

const input =
  'w-full min-h-10 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2 text-sm';
const button =
  'min-h-10 rounded-lg border border-slate-200 dark:border-dm-border px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-dm-elevated';
const primary =
  'dm-btn-primary min-h-10 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800';
const muted = 'text-xs text-slate-500 dark:text-dm-muted';
const date = (value: string) => new Date(value).toLocaleDateString('pt-PT');

export function HomeCategories() {
  const { data: raw, update } = useHome();
  const data = normalizeHomeCatalog(raw),
    catalog = data.categoryCatalog!;
  const [type, setType] = useState<'expense' | 'income' | 'shopping'>(
    'expense',
  );
  const kind = type === 'income' ? 'income' : 'expense';
  const [query, setQuery] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [view, setView] = useState<'categories' | 'all'>('categories');
  const [form, setForm] = useState<{
    id?: string;
    parentId?: string;
    name: string;
    icon: string;
  } | null>(null);
  const [iconQuery, setIconQuery] = useState('');
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<HomeCategory[]>([]);
  const [removing, setRemoving] = useState<HomeCategory | null>(null);
  const [targetId, setTargetId] = useState('');
  const parent = catalog.find((c) => c.id === parentId);
  const children = (id: string) => catalog.filter((c) => c.parentId === id);
  const iconName = (c: HomeCategory) =>
    c.icon ?? catalog.find((p) => p.id === c.parentId)?.icon;
  const roots = catalog.filter((c) => c.kind === kind && !c.parentId);
  const list = catalog
    .filter(
      (c) =>
        c.kind === kind &&
        (parent
          ? c.parentId === parent.id
          : view === 'all'
            ? Boolean(c.parentId)
            : !c.parentId),
    )
    .filter((c) =>
      categoryIdentity(
        `${c.name} ${catalog.find((p) => p.id === c.parentId)?.name ?? ''}`,
      ).includes(categoryIdentity(query)),
    );
  const usage = removing ? homeCategoryUsage(data, removing.id) : {};
  const used = Object.values(usage).some(Boolean);
  const targets = removing
    ? catalog.filter(
        (c) =>
          c.kind === removing.kind &&
          c.id !== removing.id &&
          c.parentId !== removing.id &&
          (removing.parentId || !c.parentId),
      )
    : [];
  const goTo = (c: HomeCategory) => {
    setParentId(c.parentId ?? c.id);
    setView('categories');
    setQuery('');
    setForm(null);
    setDuplicates([]);
    setError('');
  };
  const open = (c?: HomeCategory) => {
    setForm(
      c
        ? { id: c.id, parentId: c.parentId, name: c.name, icon: c.icon ?? '' }
        : { ...(parent ? { parentId: parent.id } : {}), name: '', icon: '' },
    );
    setIconQuery('');
    setError('');
    setDuplicates([]);
  };
  const save = (allow = false) => {
    if (!form) return;
    if (!form.name.trim()) {
      setError('Preenche o nome.');
      return;
    }
    const same = categoryDuplicates(
      data,
      form.name,
      kind,
      form.parentId,
      form.id,
    );
    if (same.length && !allow) {
      setDuplicates(same);
      return;
    }
    try {
      update((d) => saveHomeCategory(d, { ...form, kind }, allow));
      setForm(null);
      setDuplicates([]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
    }
  };
  const row = (c: HomeCategory) => (
    <div
      key={c.id}
      data-home-category-id={c.id}
      className="flex items-center gap-2 border-b border-slate-200 dark:border-dm-border last:border-b-0 px-3 sm:px-4 py-2"
    >
      <button
        type="button"
        onClick={() => (c.parentId ? open(c) : goTo(c))}
        className="flex min-h-12 items-center gap-3 flex-1 min-w-0 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <CategoryIcon name={iconName(c)} />
        <span className="min-w-0">
          <strong className="block text-sm font-medium break-words">
            {c.name}
          </strong>
          <span className={`${muted} block mt-1`}>
            {c.parentId
              ? catalog.find((p) => p.id === c.parentId)?.name
              : `${children(c.id).length} subcategorias`}
            {c.editedAt ? ` · editado em ${date(c.editedAt)}` : ''}
          </span>
        </span>
        {!c.parentId && (
          <ChevronRight
            className="h-4 w-4 ml-auto shrink-0"
            aria-hidden="true"
          />
        )}
      </button>
      <button
        type="button"
        aria-label={`Editar ${c.name}`}
        title={`Editar ${c.name}`}
        onClick={() => open(c)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dm-elevated"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Eliminar ${c.name}`}
        title={`Eliminar ${c.name}`}
        onClick={() => {
          setRemoving(c);
          setTargetId('');
          setError('');
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dm-elevated"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
  return (
    <section id="home-category-manager" className="space-y-4">
      <div className="dm-filter-capsule bg-white dark:bg-dm-surface border border-slate-200/80 dark:border-dm-border rounded-2xl p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center divide-x divide-slate-200/80 dark:divide-dm-border flex-1 basis-64 min-w-0">
          <label className="flex items-center gap-2 text-xs px-3 py-1.5">
            <span className="font-medium text-slate-500 dark:text-dm-muted">
              Tipo
            </span>
            <select
              id="home-category-kind"
              value={type}
              onChange={(e) => {
                setType(e.target.value as typeof type);
                setParentId(null);
                setQuery('');
              }}
              className="min-h-8 bg-transparent text-slate-900 dark:text-dm-text"
            >
              <option value="expense">Despesas</option>
              <option value="income">Rendimentos</option>
              <option value="shopping">Compras</option>
            </select>
          </label>
          <label className="flex items-center gap-2 px-3 py-1.5 flex-1 min-w-36">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="home-category-search"
              aria-label="Pesquisar categorias por nome"
              placeholder="Pesquisar por nome"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-8 w-full bg-transparent text-xs focus:outline-none"
            />
          </label>
        </div>
        <button
          id={parent ? 'home-subcategory-add' : 'home-category-add'}
          type="button"
          onClick={() => open()}
          className={`${primary} ml-auto`}
        >
          Adicionar
        </button>
      </div>
      {type === 'shopping' && (
        <p className={muted}>
          Compras usa as categorias de despesas, mantendo a classificação dos
          pagamentos e orçamentos.
        </p>
      )}
      {parent ? (
        <nav
          aria-label="Categorias"
          className="flex items-center gap-2 text-sm"
        >
          <button
            type="button"
            onClick={() => {
              setParentId(null);
              setQuery('');
            }}
            className="flex items-center gap-2 min-h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Categorias
          </button>
          <ChevronRight className="h-4 w-4" />
          <span>{parent.name}</span>
        </nav>
      ) : (
        <div
          role="group"
          aria-label="Vista de categorias"
          className="inline-flex rounded-full bg-slate-100 dark:bg-dm-elevated border border-slate-200 dark:border-dm-border p-1"
        >
          {[
            ['categories', 'Categorias'],
            ['all', 'Todas as subcategorias'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              id={`home-category-view-${value}`}
              aria-pressed={view === value}
              onClick={() => setView(value as typeof view)}
              className={`min-h-10 rounded-full px-4 text-xs font-medium ${view === value ? 'bg-slate-900 dark:bg-dm-text text-white dark:text-dm-page' : 'text-slate-600 dark:text-dm-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {!parent &&
        roots.some((c) => categoryIdentity(c.name) === 'internet') &&
        catalog.some(
          (c) =>
            c.kind === kind &&
            c.parentId &&
            categoryIdentity(c.name) === 'internet',
        ) && (
          <div className="rounded-lg border border-slate-200 dark:border-dm-border p-3 text-xs">
            Internet existe como categoria principal e como subcategoria de{' '}
            {
              catalog.find(
                (p) =>
                  p.id ===
                  catalog.find(
                    (c) =>
                      c.kind === kind &&
                      c.parentId &&
                      categoryIdentity(c.name) === 'internet',
                  )?.parentId,
              )?.name
            }
            . São classificações distintas, sem alteração automática.{' '}
            <button
              type="button"
              className="underline min-h-8"
              onClick={() => {
                setView('all');
                setQuery('Internet');
              }}
            >
              Ver subcategoria
            </button>
          </div>
        )}
      <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface overflow-hidden">
        {list.length ? (
          list.map(row)
        ) : (
          <p className={`${muted} p-5`}>Nenhuma categoria encontrada.</p>
        )}
      </div>
      {form && (
        <HomeModal
          title={`${form.id ? 'Editar' : 'Criar'} ${form.parentId ? 'subcategoria' : 'categoria'}`}
          onClose={() => setForm(null)}
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <label className="block text-xs">
              Nome
              <input
                id={
                  form.parentId ? 'home-subcategory-name' : 'home-category-name'
                }
                autoComplete="off"
                maxLength={300}
                className={`${input} mt-2`}
                value={form.name}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'home-category-error' : undefined}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setError('');
                  setDuplicates([]);
                }}
              />
              {error && (
                <span
                  id="home-category-error"
                  role="alert"
                  className="block mt-2 text-xs text-rose-600 dark:text-rose-400"
                >
                  {error}
                </span>
              )}
            </label>
            {duplicates.length > 0 && (
              <div
                role="status"
                className="rounded-lg border border-amber-300 dark:border-amber-800 p-3 text-xs"
              >
                <p>
                  Já existe um nome igual neste nível. Os registos continuam
                  separados se criares outro.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    className={button}
                    onClick={() => goTo(duplicates[0])}
                  >
                    Ver existente
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() => save(true)}
                  >
                    Continuar mesmo assim
                  </button>
                </div>
              </div>
            )}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium">Ícone (opcional)</legend>
              <input
                id="home-category-icon-search"
                aria-label="Pesquisar ícones"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Pesquisar ícones ou temas"
                className={input}
              />
              <button
                type="button"
                className={button}
                aria-pressed={!form.icon}
                onClick={() => setForm({ ...form, icon: '' })}
              >
                {form.parentId
                  ? 'Herdar da categoria principal'
                  : 'Usar ícone neutro'}
              </button>
              <div className="max-h-56 overflow-y-auto space-y-4 pr-1">
                {CATEGORY_ICON_GROUPS.map((g) => {
                  const icons = g.icons.filter((i) =>
                    categoryIdentity(`${g.theme} ${i[1]}`).includes(
                      categoryIdentity(iconQuery),
                    ),
                  );
                  return (
                    icons.length > 0 && (
                      <div key={g.theme}>
                        <p className={`${muted} mb-2`}>{g.theme}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {icons.map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              aria-label={`Ícone ${label}`}
                              aria-pressed={form.icon === key}
                              onClick={() => setForm({ ...form, icon: key })}
                              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] ${form.icon === key ? 'border-slate-900 dark:border-dm-text bg-slate-100 dark:bg-dm-elevated' : 'border-slate-200 dark:border-dm-border'}`}
                            >
                              <CategoryIcon name={key} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={button}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button id="home-category-save" className={primary}>
                {form.id ? 'Guardar alterações' : 'Guardar'}
              </button>
            </div>
          </form>
        </HomeModal>
      )}
      {removing && (
        <HomeModal
          title={`Eliminar ${removing.name}`}
          onClose={() => setRemoving(null)}
        >
          <div className="space-y-4 text-sm">
            {used ? (
              <>
                <p role="alert">
                  Esta categoria está em uso:{' '}
                  {Object.entries(usage)
                    .filter(([, n]) => n)
                    .map(([label, n]) => `${n} ${label}`)
                    .join(', ')}
                  . Não pode ser eliminada sem mover os registos.
                </p>
                <label className="block text-xs">
                  Mover para outra categoria
                  <select
                    id="home-category-move-target"
                    value={targetId}
                    onChange={(e) => {
                      setTargetId(e.target.value);
                      setError('');
                    }}
                    className={`${input} mt-2`}
                  >
                    <option value="">Escolher destino</option>
                    {targets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId
                          ? `${catalog.find((p) => p.id === c.parentId)?.name} › `
                          : ''}
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {error && (
                    <span
                      role="alert"
                      className="block mt-2 text-xs text-rose-600 dark:text-rose-400"
                    >
                      {error}
                    </span>
                  )}
                </label>
                <p className={muted}>
                  Mover e eliminar preserva os registos, valores, saldos e a
                  classificação anterior. Subcategorias não escolhidas no
                  destino são retiradas da classificação atual.
                </p>
              </>
            ) : (
              <p>
                Confirmas eliminar esta{' '}
                {removing.parentId ? 'subcategoria' : 'categoria'}?
                {children(removing.id).length
                  ? ` Também serão eliminadas ${children(removing.id).length} subcategorias sem uso.`
                  : ''}
              </p>
            )}
            {!used && error && (
              <p role="alert" className="text-xs text-rose-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoving(null)}
                className={button}
              >
                Cancelar
              </button>
              <button
                id="home-category-delete-confirm"
                type="button"
                className={primary}
                onClick={() => {
                  try {
                    if (used && !targetId) {
                      setError('Escolhe a categoria de destino.');
                      return;
                    }
                    update((d) =>
                      used
                        ? moveHomeCategory(d, removing.id, targetId)
                        : deleteHomeCategory(d, removing.id),
                    );
                    setRemoving(null);
                    setError('');
                    if (removing.id === parentId) setParentId(null);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : 'Não foi possível eliminar.',
                    );
                  }
                }}
              >
                {used ? 'Mover e eliminar' : 'Eliminar'}
              </button>
            </div>
          </div>
        </HomeModal>
      )}
    </section>
  );
}
