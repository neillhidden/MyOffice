import { HomeCategory, HomeData } from '../types/home';
import { createId } from './ids';

export const categoryIdentity = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-PT');
const cleanName = (name: string) => {
  const value = name.trim().replace(/\s+/g, ' ');
  if (!value || value.length > 300)
    throw new Error('Preenche o nome (até 300 caracteres).');
  return value;
};
/** Names remain compatibility keys. Duplicate names get independent keys/IDs. */
export function normalizeHomeCatalog(data: HomeData): HomeData {
  if (data.categoryCatalog && !Array.isArray(data.categoryCatalog))
    throw new Error('Catálogo de categorias inválido.');
  const catalog = data.categoryCatalog
    ? data.categoryCatalog.map((c) => ({ ...c }))
    : [];
  const addLegacy = (
    kind: HomeCategory['kind'],
    key: string,
    parentId?: string,
  ) => {
    let c = catalog.find(
      (c) => c.kind === kind && c.parentId === parentId && c.key === key,
    );
    if (!c) {
      c = {
        id: `legacy:${kind}:${parentId ?? ''}:${encodeURIComponent(key)}`,
        key,
        name:
          kind === 'income' && key === 'Outras receitas'
            ? 'Outros rendimentos'
            : key,
        kind,
        ...(parentId ? { parentId } : {}),
      };
      catalog.push(c);
    }
    return c;
  };
  if (!data.categoryCatalog) {
    for (const kind of ['expense', 'income'] as const) {
      const names =
        kind === 'income'
          ? (data.incomeCategories ?? [])
          : (data.categories ?? []);
      const tree =
        kind === 'income'
          ? (data.incomeSubcategories ?? {})
          : (data.subcategories ?? {});
      for (const key of new Set([...names, ...Object.keys(tree)])) {
        const c = addLegacy(kind, key);
        for (const child of tree[key] ?? []) addLegacy(kind, child, c.id);
      }
    }
  }
  // Legacy/imported operations and system-generated Business income stay classified.
  const refs = [
    ...data.entries
      .filter((e) => e.type === 'income' || e.type === 'expense')
      .map((e) => ({
        ...e,
        kind: e.type === 'income' ? ('income' as const) : ('expense' as const),
      })),
    ...data.budgets.map((e) => ({ ...e, kind: 'expense' as const })),
    ...data.bills.map((e) => ({
      ...e,
      kind: e.type === 'income' ? ('income' as const) : ('expense' as const),
    })),
    ...data.tasks.map((e) => ({ ...e, kind: 'expense' as const })),
    ...(data.plans ?? []).map((e) => ({
      ...e,
      kind: e.type === 'income' ? ('income' as const) : ('expense' as const),
    })),
    ...data.goals
      .filter((e) => e.category)
      .map((e) => ({ ...e, category: e.category!, kind: 'expense' as const })),
    ...(data.shopping ?? []).map((e) => ({ ...e, kind: 'expense' as const })),
  ];
  for (const ref of refs) {
    const c = addLegacy(ref.kind, ref.category);
    if ('subcategory' in ref && ref.subcategory)
      addLegacy(ref.kind, ref.subcategory, c.id);
  }
  const ids = new Set<string>(),
    keys = new Set<string>();
  for (const c of catalog) {
    if (
      !c ||
      typeof c.id !== 'string' ||
      !c.id ||
      ids.has(c.id) ||
      !['expense', 'income'].includes(c.kind) ||
      typeof c.key !== 'string' ||
      !c.key.trim() ||
      c.key.length > 300 ||
      typeof c.name !== 'string' ||
      !c.name.trim() ||
      c.name.length > 300 ||
      (c.icon !== undefined &&
        (typeof c.icon !== 'string' || c.icon.length > 80))
    )
      throw new Error('Catálogo de categorias inválido.');
    ids.add(c.id);
    const key = JSON.stringify([c.kind, c.parentId ?? null, c.key]);
    if (keys.has(key)) throw new Error('Identificador de categoria repetido.');
    keys.add(key);
    if (
      c.parentId &&
      !catalog.some(
        (p) => p.id === c.parentId && !p.parentId && p.kind === c.kind,
      )
    )
      throw new Error('Categoria principal inválida.');
  }
  if (catalog.length > 10000)
    throw new Error('O catálogo tem demasiadas categorias.');
  return projectHomeCatalog({ ...data, categoryCatalog: catalog });
}
function projectHomeCatalog(data: HomeData): HomeData {
  const catalog = data.categoryCatalog!;
  const names = (kind: HomeCategory['kind']) =>
    catalog.filter((c) => c.kind === kind && !c.parentId).map((c) => c.key);
  const tree = (kind: HomeCategory['kind']) =>
    Object.fromEntries(
      catalog
        .filter((c) => c.kind === kind && !c.parentId)
        .map((c) => [
          c.key,
          catalog.filter((s) => s.parentId === c.id).map((s) => s.key),
        ]),
    );
  return {
    ...data,
    categories: names('expense'),
    incomeCategories: names('income'),
    subcategories: tree('expense'),
    incomeSubcategories: tree('income'),
  };
}
export const homeCategoryName = (
  data: HomeData,
  key: string,
  parentKey?: string,
  kind?: HomeCategory['kind'],
) => {
  const catalog = data.categoryCatalog ?? [];
  const parent = parentKey
    ? catalog.find(
        (c) => !c.parentId && c.key === parentKey && (!kind || c.kind === kind),
      )
    : undefined;
  const found = catalog.find(
    (c) =>
      c.key === key &&
      (parentKey ? c.parentId === parent?.id : !c.parentId) &&
      (!kind || c.kind === kind),
  );
  if (!found) return key;
  const same = catalog.filter(
    (c) =>
      c.kind === found.kind &&
      c.parentId === found.parentId &&
      categoryIdentity(c.name) === categoryIdentity(found.name),
  );
  const index = same.findIndex((c) => c.id === found.id);
  return found.name + (index > 0 ? ` (${index + 1})` : '');
};
export function categoryDuplicates(
  data: HomeData,
  name: string,
  kind: HomeCategory['kind'],
  parentId?: string,
  exceptId?: string,
) {
  return normalizeHomeCatalog(data).categoryCatalog!.filter(
    (c) =>
      c.id !== exceptId &&
      c.kind === kind &&
      c.parentId === parentId &&
      categoryIdentity(c.name) === categoryIdentity(name),
  );
}
export function saveHomeCategory(
  data: HomeData,
  input: {
    id?: string;
    name: string;
    kind: HomeCategory['kind'];
    parentId?: string;
    icon?: string;
  },
  allowDuplicate = false,
) {
  data = normalizeHomeCatalog(data);
  const old = input.id
    ? data.categoryCatalog!.find((c) => c.id === input.id)
    : undefined;
  if (input.id && !old) throw new Error('Categoria inexistente.');
  const name = cleanName(input.name);
  if (
    !allowDuplicate &&
    categoryDuplicates(data, name, input.kind, input.parentId, input.id).length
  )
    throw new Error('Já existe um nome igual neste nível.');
  const id = old?.id ?? createId('home-category');
  const key =
    old?.key ??
    (data.categoryCatalog!.some(
      (c) =>
        c.kind === input.kind &&
        c.parentId === input.parentId &&
        categoryIdentity(c.key) === categoryIdentity(name),
    )
      ? `category:${id}`
      : name);
  const saved: HomeCategory = {
    id,
    key,
    name,
    kind: old?.kind ?? input.kind,
    ...((old?.parentId ?? input.parentId)
      ? { parentId: old?.parentId ?? input.parentId }
      : {}),
    ...(input.icon ? { icon: input.icon } : {}),
    ...(old ? { editedAt: new Date().toISOString() } : {}),
  };
  return normalizeHomeCatalog({
    ...data,
    categoryCatalog: old
      ? data.categoryCatalog!.map((c) => (c.id === id ? saved : c))
      : [...data.categoryCatalog!, saved],
  });
}
function uses(
  data: HomeData,
  c: HomeCategory,
  row: {
    category?: string;
    subcategory?: string;
    id?: string;
    reversalOf?: string;
  },
) {
  const parent = c.parentId
    ? data.categoryCatalog!.find((p) => p.id === c.parentId)!
    : c;
  return (
    row.category === parent.key &&
    (!c.parentId ||
      (row.subcategory ??
        data.shopping?.find((i) => i.entryId === (row.reversalOf ?? row.id))
          ?.subcategory) === c.key)
  );
}
export function homeCategoryUsage(data: HomeData, id: string) {
  data = normalizeHomeCatalog(data);
  const c = data.categoryCatalog!.find((c) => c.id === id);
  if (!c) throw new Error('Categoria inexistente.');
  const entries = data.entries.filter(
    (e) =>
      (e.type === c.kind ||
        (e.type === 'reversal' &&
          data.entries.find((o) => o.id === e.reversalOf)?.type === c.kind)) &&
      uses(data, c, e),
  ).length;
  return {
    lançamentos: entries,
    orçamentos:
      c.kind === 'expense'
        ? data.budgets.filter((r) => uses(data, c, r)).length
        : 0,
    contas: data.bills.filter(
      (r) => (r.type ?? 'expense') === c.kind && uses(data, c, r),
    ).length,
    ocorrências: (data.occurrences ?? []).filter(
      (o) => o.snapshot.type === c.kind && uses(data, c, o.snapshot),
    ).length,
    metas:
      c.kind === 'expense'
        ? data.goals.filter((r) => uses(data, c, r)).length
        : 0,
    compras:
      c.kind === 'expense'
        ? (data.shopping ?? []).filter((r) => uses(data, c, r)).length
        : 0,
    planos: (data.plans ?? []).filter(
      (r) =>
        (r.type === 'income' ? 'income' : 'expense') === c.kind &&
        uses(data, c, r),
    ).length,
    tarefas:
      c.kind === 'expense'
        ? data.tasks.filter((r) => uses(data, c, r)).length
        : 0,
  };
}
export function deleteHomeCategory(data: HomeData, id: string) {
  data = normalizeHomeCatalog(data);
  if (Object.values(homeCategoryUsage(data, id)).some(Boolean))
    throw new Error(
      'Esta categoria está em uso. Move os registos para outra categoria antes de eliminar.',
    );
  return projectHomeCatalog({
    ...data,
    categoryCatalog: data.categoryCatalog!.filter(
      (c) => c.id !== id && c.parentId !== id,
    ),
  });
}
/** Reclassification only: retain all IDs, amounts, dates and prior classifications. */
export function moveHomeCategory(data: HomeData, id: string, targetId: string) {
  data = normalizeHomeCatalog(data);
  const c = data.categoryCatalog!.find((c) => c.id === id),
    target = data.categoryCatalog!.find((c) => c.id === targetId);
  if (
    !c ||
    !target ||
    c.kind !== target.kind ||
    c.id === target.id ||
    target.parentId === c.id ||
    (!c.parentId && target.parentId)
  )
    throw new Error('Escolhe outra categoria válida do mesmo tipo.');
  const parent = target.parentId
    ? data.categoryCatalog!.find((p) => p.id === target.parentId)!
    : target;
  const changedAt = new Date().toISOString();
  const move = <
    T extends {
      category?: string;
      subcategory?: string;
      categoryHistory?: {
        category: string;
        subcategory?: string;
        changedAt: string;
      }[];
    },
  >(
    row: T,
  ): T =>
    uses(data, c, row)
      ? {
          ...row,
          category: parent.key,
          subcategory: target.parentId ? target.key : undefined,
          categoryHistory: [
            ...(row.categoryHistory ?? []),
            {
              category: row.category!,
              ...(row.subcategory ? { subcategory: row.subcategory } : {}),
              changedAt,
            },
          ],
        }
      : row;
  const budgets = c.kind === 'expense' ? data.budgets.map(move) : data.budgets;
  const budgetKeys = new Set<string>();
  for (const b of budgets) {
    const key = `${b.category}:${b.month}:${b.currency ?? 'AOA'}`;
    if (budgetKeys.has(key))
      throw new Error(
        'Já existe um limite para o destino neste mês e moeda. Ajusta os limites antes de mover; nenhum registo foi alterado.',
      );
    budgetKeys.add(key);
  }
  const next = {
    ...data,
    entries: data.entries.map((e) =>
      e.type === c.kind ||
      (e.type === 'reversal' &&
        data.entries.find((o) => o.id === e.reversalOf)?.type === c.kind)
        ? move(e)
        : e,
    ),
    budgets,
    bills: data.bills.map((b) =>
      (b.type ?? 'expense') === c.kind ? move(b) : b,
    ),
    occurrences: (data.occurrences ?? []).map((o) =>
      o.snapshot.type === c.kind ? { ...o, snapshot: move(o.snapshot) } : o,
    ),
    goals: c.kind === 'expense' ? data.goals.map(move) : data.goals,
    plans: (data.plans ?? []).map((p) =>
      (p.type === 'income' ? 'income' : 'expense') === c.kind ? move(p) : p,
    ),
    tasks: c.kind === 'expense' ? data.tasks.map(move) : data.tasks,
    shopping:
      c.kind === 'expense' ? (data.shopping ?? []).map(move) : data.shopping,
  };
  return deleteHomeCategory(next, id);
}
