import { Bank, BankMovement, Company } from '../types/stock';
import { HomeDocument } from '../types/home';
import { ImportDraft, validateDraft } from './homeDocumentImport';
import { emptyHome, money, text, validMonth, validateHomeData } from './home';
import { createId } from './ids';
export interface BusinessBudget {
  id: string;
  companyId: string;
  category: string;
  month: string;
  currency: 'AOA' | 'USD';
  limit: number;
}
export interface BusinessReceiptLink {
  movementId: string;
  bankId: string;
  fileHash?: string;
  reference?: string;
}
export interface BusinessDocuments {
  version: 1;
  budgets: BusinessBudget[];
  documents: HomeDocument[];
  links: BusinessReceiptLink[];
}
export const emptyBusinessDocuments = (): BusinessDocuments => ({
  version: 1,
  budgets: [],
  documents: [],
  links: [],
});
export const businessCurrency = (bank: Bank) => {
  if (['KZ', 'AOA'].includes(bank.currency.toUpperCase()))
    return 'AOA' as const;
  if (bank.currency.toUpperCase() === 'USD') return 'USD' as const;
  throw new Error(
    'O leitor financeiro suporta contas AOA/Kz e USD. Não converte moedas automaticamente.',
  );
};
const signed = (m: BankMovement) => (m.type === 'saida' ? -m.amount : m.amount);
export const businessReceiptMatches = (
  movements: BankMovement[],
  row: ImportDraft,
  bank: Bank,
) => {
  const amount =
    validateDraft(row, businessCurrency(bank)) *
    (row.direction === 'expense' ? -1 : 1);
  return movements.filter(
    (m) =>
      m.bankId === bank.id &&
      !m.isRemoved &&
      !m.isReversed &&
      !m.reversalOfId &&
      m.date.slice(0, 10) === row.date &&
      signed(m) === amount,
  );
};
export function validateBusinessDocuments(
  tools: BusinessDocuments,
  movements: BankMovement[],
) {
  if (
    !tools ||
    tools.version !== 1 ||
    !Array.isArray(tools.budgets) ||
    !Array.isArray(tools.documents) ||
    !Array.isArray(tools.links)
  )
    throw new Error('Arquivo financeiro Business inválido.');
  const keys = new Set<string>(),
    ids = new Set<string>();
  for (const b of tools.budgets) {
    text(b.id);
    text(b.companyId);
    text(b.category);
    money(b.limit);
    const key = `${b.companyId}:${b.month}:${b.category}:${b.currency}`;
    if (
      !validMonth(b.month) ||
      !['AOA', 'USD'].includes(b.currency) ||
      keys.has(key) ||
      ids.has(b.id)
    )
      throw new Error('Orçamento Business inválido ou repetido.');
    keys.add(key);
    ids.add(b.id);
  }
  // Reuse file signature/size/quota validation; Business validates its own links below.
  validateHomeData({
    ...emptyHome(),
    documents: tools.documents.map((d) => ({
      ...d,
      entityType: undefined,
      entityId: undefined,
    })),
  });
  for (const d of tools.documents) {
    if (d.entityType !== 'entry' || !movements.some((m) => m.id === d.entityId))
      throw new Error(
        'O comprovativo deve estar ligado a um lançamento Business existente.',
      );
  }
  for (const link of tools.links) {
    if (
      !movements.some(
        (m) => m.id === link.movementId && m.bankId === link.bankId,
      )
    )
      throw new Error('Referência de comprovativo Business inválida.');
    if (link.reference !== undefined) text(link.reference);
    if (link.fileHash !== undefined && !/^[a-f0-9]{64}$/.test(link.fileHash))
      throw new Error('Identificação de ficheiro inválida.');
  }
  return tools;
}
export function applyBusinessReceipt(
  banks: Bank[],
  companies: Company[],
  movements: BankMovement[],
  tools: BusinessDocuments,
  row: ImportDraft,
  bankId: string,
  document?: HomeDocument,
  matchId?: string,
  budget?: { id: string } | { limit: number },
) {
  const bank = banks.find((b) => b.id === bankId);
  const company = companies.find((c) => c.id === bank?.companyId);
  if (
    !bank ||
    !['ativo', 'ativa'].includes(bank.status) ||
    !company ||
    company.status !== 'ativa'
  )
    throw new Error(
      'Escolhe uma conta ativa de uma empresa ativa. Empresas paradas ou desativadas não podem operar.',
    );
  const currency = businessCurrency(bank),
    amount = validateDraft(row, currency);
  const matches = businessReceiptMatches(movements, row, bank);
  const duplicate = tools.links.find(
    (l) =>
      (row.fileHash && l.fileHash === row.fileHash) ||
      (row.reference &&
        l.reference === row.reference &&
        l.bankId === bankId &&
        movements.find((m) => m.id === l.movementId)?.date.slice(0, 10) ===
          row.date),
  );
  if (duplicate && duplicate.movementId !== matchId)
    throw new Error(
      'Este comprovativo ou referência já foi adicionado. Associa ao lançamento existente.',
    );
  let nextMovements = movements,
    id = matchId;
  if (matchId) {
    if (!matches.some((m) => m.id === matchId))
      throw new Error(
        'O lançamento escolhido não corresponde ao comprovativo.',
      );
  } else {
    if (matches.length)
      throw new Error(
        'Já existe um lançamento com esta conta, data e valor. Associa para evitar repetição.',
      );
    text(row.category);
    const balance = movements
      .filter((m) => m.bankId === bankId && !m.isRemoved)
      .reduce((n, m) => n + signed(m), 0);
    if (
      row.direction === 'expense' &&
      Math.round(balance * 100) < Math.round(amount * 100)
    )
      throw new Error('Saldo insuficiente nesta conta.');
    const movement: BankMovement = {
      id: createId('bmov'),
      bankId,
      type: row.direction === 'income' ? 'entrada' : 'saida',
      amount,
      date: `${row.date}T12:00:00`,
      reason: text(row.title),
      category: row.category,
      responsible: 'Administrador',
      ...(row.reference ? { reference: row.reference } : {}),
    };
    id = movement.id;
    nextMovements = [movement, ...movements];
  }
  const entry = nextMovements.find((m) => m.id === id)!;
  let nextTools: BusinessDocuments = { ...tools, links: [...tools.links] };
  if (row.reference || row.fileHash) {
    if (
      !nextTools.links.some(
        (l) =>
          l.movementId === id &&
          l.reference === row.reference &&
          l.fileHash === row.fileHash,
      )
    )
      nextTools.links.push({
        movementId: id!,
        bankId,
        ...(row.reference ? { reference: row.reference } : {}),
        ...(row.fileHash ? { fileHash: row.fileHash } : {}),
      });
  }
  if (budget) {
    if (entry.type !== 'saida')
      throw new Error('Orçamentos de despesas só se aplicam a saídas.');
    const month = entry.date.slice(0, 7),
      category = entry.category || 'Outro';
    const compatible = tools.budgets.filter(
      (b) =>
        b.companyId === company.id &&
        b.month === month &&
        b.currency === currency &&
        b.category === category,
    );
    if ('id' in budget) {
      if (!compatible.some((b) => b.id === budget.id))
        throw new Error(
          'O orçamento deve corresponder à empresa, categoria, mês e moeda.',
        );
    } else {
      if (compatible.length)
        throw new Error('Já existe este orçamento. Seleciona o existente.');
      nextTools = {
        ...nextTools,
        budgets: [
          ...tools.budgets,
          {
            id: createId('business-budget'),
            companyId: company.id,
            category,
            month,
            currency,
            limit: money(budget.limit),
          },
        ],
      };
    }
  }
  if (document) {
    const existing = tools.documents.find(
      (d) => d.content === document.content || d.id === document.id,
    );
    if (existing?.entityId && existing.entityId !== id)
      throw new Error('Este PDF já foi associado a outro lançamento.');
    if (!existing)
      nextTools = {
        ...nextTools,
        documents: [
          ...tools.documents,
          { ...document, entityType: 'entry', entityId: id },
        ],
      };
  }
  validateBusinessDocuments(nextTools, nextMovements);
  return { movements: nextMovements, tools: nextTools };
}
