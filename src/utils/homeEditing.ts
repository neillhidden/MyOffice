import { HomeAudit, HomeData, HomeEntry } from '../types/home';
import {
  addHomeEntry,
  balances,
  effectiveEntries,
  entryCurrency,
  validateHomeData,
} from './home';
export const homeAuditEdit = <T extends HomeAudit>(before: T, next: T): T => {
  const { edits, ...snapshot } = before;
  const changedAt = new Date().toISOString();
  return {
    ...next,
    editedAt: changedAt,
    edits: [...(edits ?? []), { changedAt, before: snapshot }],
  };
};
export function editHomeEntry(
  data: HomeData,
  id: string,
  input: Omit<HomeEntry, 'id'>,
) {
  const old = effectiveEntries(data).find((e) => e.id === id);
  if (!old || !['expense', 'income'].includes(old.type))
    throw new Error('Este lançamento não pode ser editado.');
  if (
    old.businessMovementId &&
    (input.amount !== old.amount ||
      input.accountId !== old.accountId ||
      input.date !== old.date ||
      input.type !== old.type)
  )
    throw new Error(
      'O valor, conta e data pertencem à transferência Business. Para os corrigir, estorna em conjunto e regista a transferência correta.',
    );
  const item = data.shopping?.find((i) => i.entryId === id);
  if (
    old.goalId &&
    (input.accountId !== old.accountId || input.type !== old.type)
  )
    throw new Error(
      'A aquisição mantém a carteira de reserva e o tipo Despesa.',
    );
  if ((old.billId || item) && input.type !== old.type)
    throw new Error('Um pagamento associado mantém o tipo Despesa.');
  const without = { ...data, entries: data.entries.filter((e) => e.id !== id) };
  const checked = addHomeEntry(without, {
    ...old,
    ...input,
    subcategory: old.category === input.category ? old.subcategory : undefined,
    billId: old.billId,
    billMonth: old.billMonth,
    businessMovementId: old.businessMovementId,
    goalId: old.goalId,
  });
  const next = homeAuditEdit(old, { ...checked.entries[0], id });
  if (entryCurrency(data, old) !== entryCurrency(checked, next))
    throw new Error(
      'Escolhe uma carteira da mesma moeda do lançamento original.',
    );
  return validateHomeData({
    ...data,
    entries: data.entries.map((e) => (e.id === id ? next : e)),
    goals: old.goalId
      ? data.goals.map((g) =>
          g.id === old.goalId
            ? homeAuditEdit(g, {
                ...g,
                target: next.amount,
                ...(g.originalCurrency
                  ? {
                      originalAmount: next.originalAmount ?? next.amount,
                      originalCurrency:
                        next.originalCurrency ?? g.originalCurrency,
                      exchangeRate: next.exchangeRate,
                    }
                  : {}),
                acquiredDate: next.date,
                category: next.category,
              })
            : g,
        )
      : data.goals,
    shopping: item
      ? data.shopping!.map((i) =>
          i.id === item.id
            ? homeAuditEdit(i, {
                ...i,
                category: next.category,
                subcategory: next.subcategory,
                paymentAmount: next.amount,
                paymentSnapshot: i.paymentSnapshot ?? {
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                },
              })
            : i,
        )
      : data.shopping,
  });
}
export type HomeEntity =
  | 'entry'
  | 'account'
  | 'budget'
  | 'bill'
  | 'goal'
  | 'task';
export function deleteHomeEntity(data: HomeData, kind: HomeEntity, id: string) {
  const deletedAt = new Date().toISOString();
  if (kind === 'entry') {
    const old = effectiveEntries(data).find((e) => e.id === id);
    if (!old || !['income', 'expense'].includes(old.type))
      throw new Error('Este lançamento não pode ser eliminado.');
    if (old.businessMovementId)
      throw new Error(
        'Elimina esta transferência pela operação conjunta Home/Business.',
      );
    return validateHomeData({
      ...data,
      entries: data.entries.map((e) => (e.id === id ? { ...e, deletedAt } : e)),
    });
  }
  if (
    kind === 'account' &&
    (balances(data)[id] !== 0 ||
      effectiveEntries(data).some(
        (e) => e.accountId === id || e.destinationId === id,
      ))
  )
    throw new Error(
      'A carteira tem saldo ou lançamentos ativos. Corrige os movimentos antes de eliminar; o saldo e as referências não podem desaparecer.',
    );
  if (kind === 'goal') {
    const goal = data.goals.find((g) => g.id === id);
    if (!goal) throw new Error('Meta inexistente.');
    if (balances(data)[goal.accountId] !== 0)
      throw new Error('Retira a reserva antes de eliminar a meta.');
  }
  const key = (
    {
      account: 'accounts',
      budget: 'budgets',
      bill: 'bills',
      goal: 'goals',
      task: 'tasks',
    } as const
  )[kind];
  const found = data[key].find((e) => e.id === id && !e.deletedAt);
  if (!found) throw new Error('Registo inexistente ou já eliminado.');
  return validateHomeData({
    ...data,
    [key]: data[key].map((e) => (e.id === id ? { ...e, deletedAt } : e)),
  });
}
