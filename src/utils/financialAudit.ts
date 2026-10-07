import type { BankMovement } from '../types/stock';
import { createId } from './ids';

/** Originals remain in the ledger; the compensating entry carries the opposite effect. */
export function createReversal(
  original: BankMovement,
  reason: string,
  responsible = 'Administrador',
  id = createId('bmov-estorno'),
  date = new Date().toISOString(),
): BankMovement {
  if (!reason.trim()) throw new Error('O motivo do estorno é obrigatório.');
  if (!Number.isFinite(original.amount)) throw new Error('O lançamento tem um valor inválido.');
  return {
    ...original,
    id,
    date,
    responsible,
    reason: `Estorno de ${original.id}: ${reason.trim()}`,
    reference: original.reference || original.id,
    type: original.type === 'entrada' ? 'saida' : original.type === 'saida' ? 'entrada' : original.type,
    amount: original.type === 'entrada' || original.type === 'saida' ? original.amount : -original.amount,
    isRemoved: false,
    removedAt: undefined,
    removedReason: undefined,
    removedBy: undefined,
    isReversed: false,
    reversedAt: undefined,
    reversalReason: undefined,
    reversedBy: undefined,
    reversalOfId: original.id,
  };
}

/** One-time, idempotent conversion preserving the balance of legacy removed entries. */
export function migrateFinancialAudit(movements: BankMovement[]): BankMovement[] {
  const reversals = new Map(movements.filter((m) => m.reversalOfId).map((m) => [m.reversalOfId, m]));
  const added: BankMovement[] = [];
  const migrated = movements.map((movement) => {
    if (!movement.isRemoved) return movement;
    let reversal = reversals.get(movement.id);
    if (!reversal) {
      reversal = createReversal(
        movement, movement.removedReason || 'Conversão de remoção financeira antiga',
        movement.removedBy || 'Administrador', `bmov-legacy-estorno-${movement.id}`,
        movement.removedAt || movement.date,
      );
      added.push(reversal);
    }
    return {
      ...movement,
      isRemoved: false,
      isReversed: true,
      reversedAt: reversal.date,
      reversalReason: movement.removedReason || reversal.reason,
      reversedBy: reversal.responsible,
    };
  });
  return [...added, ...migrated];
}
