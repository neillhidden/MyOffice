import {
  HomeCurrency,
  HomeData,
  HomeDocument,
  HomeStatementRow,
} from '../types/home';
import {
  addHomeEntry,
  accountCurrency,
  effectiveEntries,
  money,
  text,
  todayLocal,
  validDate,
  validateHomeData,
} from './home';
import { createId } from './ids';
import { entrySignedAmount } from './homeExtensions';
import { parseStatementCsv } from './homeAnalysis';
import { homeAuditEdit } from './homeEditing';
export interface ImportDraft {
  id: string;
  date: string;
  title: string;
  amount: string;
  direction: '' | 'income' | 'expense';
  currency: '' | HomeCurrency;
  category: string;
  subcategory: string;
  selected: boolean;
  reference?: string;
}
export const normalized = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
export function readImportAmount(value: string): number {
  let s = value
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/[\s\u00a0]/g, '')
    .replace(/(?:AOA|KZ|USD|\$)/gi, '');
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.includes(',') && s.includes('.'))
    s =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replaceAll('.', '').replace(',', '.')
        : s.replaceAll(',', '');
  else if (s.includes(',')) s = s.replace(',', '.');
  if (!/^[+-]?\d+(\.\d{1,2})?$/.test(s))
    throw new Error('Valor inválido. Usa até duas casas decimais.');
  const n = Number(s) * (negative ? -1 : 1);
  money(Math.abs(n));
  return n;
}
export function importDate(value: string): string {
  const s = value.trim();
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(s))
    return s.split(/[/-]/).reverse().join('-');
  return s;
}
export function draftFromSigned(
  date: string,
  title: string,
  amount: number,
  currency: '' | HomeCurrency = '',
): ImportDraft {
  return {
    id: createId('read-draft'),
    date: importDate(date),
    title: title.trim(),
    amount: Math.abs(amount).toFixed(2),
    direction: amount < 0 ? 'expense' : 'income',
    currency,
    category: '',
    subcategory: '',
    selected: true,
  };
}
export function tableDrafts(table: string[][]): ImportDraft[] {
  const header = table.findIndex((row) =>
    row.some((c) =>
      ['data', 'date', 'data movimento', 'data de movimento'].includes(
        normalized(c),
      ),
    ),
  );
  if (header < 0)
    throw new Error(
      'Não identifiquei uma tabela com a coluna Data. Podes usar a revisão manual.',
    );
  const h = table[header].map(normalized);
  const find = (names: string[]) => h.findIndex((v) => names.includes(v));
  const date = find(['data', 'date', 'data movimento', 'data de movimento']),
    description = find([
      'descricao',
      'description',
      'historico',
      'movimento',
      'operacao',
      'detalhes',
    ]);
  const amount = find([
    'valor',
    'amount',
    'montante',
    'valor movimento',
    'valor do movimento',
  ]);
  const debit = find(['debito', 'debitos', 'saida', 'saidas', 'despesa']),
    credit = find(['credito', 'creditos', 'entrada', 'entradas', 'rendimento']),
    kind = find(['tipo', 'type', 'natureza', 'sentido']),
    currency = find(['moeda', 'currency']),
    reference = find(['referencia', 'reference', 'id']);
  if (description < 0 || (amount < 0 && debit < 0 && credit < 0))
    throw new Error(
      'Indica colunas Data, Descrição e Valor ou Débito/Crédito. A coluna Saldo não é um movimento.',
    );
  const result: ImportDraft[] = [];
  for (const row of table.slice(header + 1)) {
    const d = importDate(row[date] ?? '');
    if (!validDate(d)) continue;
    let signed: number | undefined,
      direction: ImportDraft['direction'] = '';
    const dr = row[debit]?.trim(),
      cr = row[credit]?.trim();
    if (
      dr &&
      Number(dr.replace(',', '.')) !== 0 &&
      cr &&
      Number(cr.replace(',', '.')) !== 0
    )
      throw new Error(
        'Uma linha tem débito e crédito simultaneamente. Corrige a tabela antes de aplicar.',
      );
    if (dr && Number(dr.replace(',', '.')) !== 0) {
      signed = -Math.abs(readImportAmount(dr));
      direction = 'expense';
    } else if (cr && Number(cr.replace(',', '.')) !== 0) {
      signed = Math.abs(readImportAmount(cr));
      direction = 'income';
    } else if (amount >= 0 && row[amount]?.trim()) {
      signed = readImportAmount(row[amount]);
      direction = signed < 0 ? 'expense' : 'income';
      const t = normalized(row[kind] ?? '');
      if (/debito|saida|despesa|pagamento/.test(t)) direction = 'expense';
      else if (/credito|entrada|rendimento|deposito/.test(t))
        direction = 'income';
    }
    if (signed === undefined) continue;
    const code = (row[currency] ?? '').trim().toUpperCase();
    result.push({
      ...draftFromSigned(d, row[description] ?? '', signed),
      direction,
      ...(row[reference]?.trim() ? { reference: row[reference].trim() } : {}),
      currency:
        code === 'USD' ? 'USD' : ['AOA', 'KZ'].includes(code) ? 'AOA' : '',
    });
    if (result.length > 1000)
      throw new Error('O ficheiro excede 1000 movimentos.');
  }
  return result;
}
const amountTokens = (line: string) =>
  line.match(/[+\-−]?\s*\(?\d+(?:[ .]\d{3})*(?:[,.]\d{2})\)?/g) ?? [];
export function textDrafts(
  content: string,
  mode: 'statement' | 'receipt',
): ImportDraft[] {
  const lines = content
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const currency: ImportDraft['currency'] = /\bUSD\b|d[oó]lares|\$/i.test(
    content,
  )
    ? 'USD'
    : /\bAOA\b|\bKz\b/i.test(content)
      ? 'AOA'
      : '';
  const dates =
    content.match(/\b\d{2}[/-]\d{2}[/-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (mode === 'receipt') {
    const candidates = lines
      .filter(
        (l) =>
          !/(saldo|troco|subtotal|disponivel)/.test(normalized(l)) &&
          /(total|montante|valor.*(?:pago|operacao|transfer)|pagamento)/.test(
            normalized(l),
          ),
      )
      .sort(
        (a, b) =>
          Number(/total/.test(normalized(b))) -
          Number(/total/.test(normalized(a))),
      );
    const line = candidates.find((l) => amountTokens(l).length);
    const tokens = line ? amountTokens(line) : [];
    const n = tokens.length
      ? readImportAmount(tokens[tokens.length - 1])
      : undefined;
    const direction = /pagamento|debito|compra|fatura|recibo de venda/.test(
      normalized(content),
    )
      ? 'expense'
      : /recebimento|deposito|credito em conta/.test(normalized(content))
        ? 'income'
        : '';
    return [
      {
        id: createId('read-draft'),
        date: dates[0] ? importDate(dates[0]) : '',
        title:
          lines
            .find(
              (l) =>
                !amountTokens(l).length &&
                !/^(data|nif|iban|recibo|comprovativo|fatura)/.test(
                  normalized(l),
                ),
            )
            ?.slice(0, 300) ?? '',
        amount: n === undefined ? '' : Math.abs(n).toFixed(2),
        direction: n !== undefined && n < 0 ? 'expense' : direction,
        currency,
        category: '',
        subcategory: '',
        selected: true,
      },
    ];
  }
  const hasBalance = lines.some((l) => /\bsaldo\b/.test(normalized(l)));
  const result: ImportDraft[] = [];
  for (const line of lines) {
    const date = line.match(
      /\b\d{2}[/-]\d{2}[/-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/,
    )?.[0];
    if (
      !date ||
      /saldo (anterior|inicial|final)|saldo de abertura/.test(normalized(line))
    )
      continue;
    const rest = line.replace(date, '');
    const tokens = amountTokens(rest);
    if (!tokens.length) continue;
    const token = tokens[0];
    const n = readImportAmount(token);
    let direction: ImportDraft['direction'] = /[−-]/.test(token)
      ? 'expense'
      : /\+/.test(token)
        ? 'income'
        : /debito|saida|pagamento/.test(normalized(line))
          ? 'expense'
          : /credito|entrada|deposito/.test(normalized(line))
            ? 'income'
            : '';
    if (hasBalance && tokens.length === 1) direction = '';
    result.push({
      ...draftFromSigned(
        date,
        rest.replace(token, '').replace(/\s+/g, ' ').trim().slice(0, 300),
        n,
        currency,
      ),
      direction,
    });
    if (result.length > 1000)
      throw new Error('O ficheiro excede 1000 movimentos.');
  }
  return result;
}
export function validateDraft(
  row: ImportDraft,
  accountCurrencyCode: HomeCurrency,
) {
  if (!validDate(row.date) || row.date > todayLocal())
    throw new Error('Indica uma data válida até hoje.');
  text(row.title);
  if (!row.direction) throw new Error('Escolhe Entrada (+) ou Saída (−).');
  const value = readImportAmount(row.amount);
  if (value <= 0)
    throw new Error(
      'Indica o valor absoluto positivo e escolhe o sentido do movimento.',
    );
  if (row.currency && row.currency !== accountCurrencyCode)
    throw new Error(
      'A moeda lida difere da carteira. Escolhe a carteira correta; não há conversão automática.',
    );
  return value;
}
export function receiptMatches(
  data: HomeData,
  row: ImportDraft,
  accountId: string,
) {
  const amount = validateDraft(
    row,
    accountCurrency(data.accounts.find((a) => a.id === accountId)),
  );
  const signed = row.direction === 'income' ? amount : -amount;
  return effectiveEntries(data).filter(
    (e) =>
      e.date === row.date &&
      (e.accountId === accountId
        ? entrySignedAmount(e)
        : e.type === 'transfer' && e.destinationId === accountId
          ? e.amount
          : undefined) === signed,
  );
}
export function applyReceipt(
  data: HomeData,
  row: ImportDraft,
  accountId: string,
  document?: HomeDocument,
  matchId?: string,
) {
  const wallet = data.accounts.find(
    (a) => a.id === accountId && !a.deletedAt && a.kind === 'current',
  );
  if (!wallet) throw new Error('Escolhe uma carteira disponível.');
  const amount = validateDraft(row, accountCurrency(wallet));
  const matches = receiptMatches(data, row, accountId);
  let next = data,
    entryId = matchId;
  if (matchId) {
    if (!matches.some((e) => e.id === matchId))
      throw new Error(
        'O lançamento escolhido já não corresponde ao comprovativo.',
      );
  } else {
    if (matches.length)
      throw new Error(
        'Já existe um movimento com a mesma data, carteira e valor. Associa o comprovativo para evitar duplicação.',
      );
    text(row.category);
    const cat = data.categoryCatalog?.find(
      (c) => c.key === row.category && c.kind === row.direction && !c.parentId,
    );
    if (!cat) throw new Error('Escolhe uma categoria do tipo correto.');
    if (
      row.subcategory &&
      !data.categoryCatalog?.some(
        (c) => c.key === row.subcategory && c.parentId === cat.id,
      )
    )
      throw new Error('Subcategoria inválida.');
    next = addHomeEntry(data, {
      type: row.direction as 'expense' | 'income',
      title: row.title,
      amount,
      date: row.date,
      category: row.category,
      ...(row.subcategory ? { subcategory: row.subcategory } : {}),
      accountId,
    });
    entryId = next.entries[0].id;
  }
  if (document) {
    const existing = next.documents?.find((d) => d.id === document.id);
    const linked = {
      ...document,
      entityType: 'entry' as const,
      entityId: entryId,
    };
    if (existing?.entityId && existing.entityId !== entryId)
      throw new Error('O documento já está associado a outro registo.');
    next = {
      ...next,
      documents: existing
        ? next.documents!.map((d) =>
            d.id === document.id ? homeAuditEdit(d, linked) : d,
          )
        : [...(next.documents ?? []), linked],
    };
  }
  return validateHomeData(next);
}
export function draftsToStatements(
  rows: ImportDraft[],
  accountId: string,
  currency: HomeCurrency,
): HomeStatementRow[] {
  const escape = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const picked = rows.filter((r) => r.selected);
  if (!picked.length) throw new Error('Seleciona pelo menos um movimento.');
  const csv = [
    'Data;Descrição;Valor;Referência',
    ...picked.map((r) => {
      const amount = validateDraft(r, currency);
      return [
        r.date,
        r.title,
        (r.direction === 'expense' ? -amount : amount).toFixed(2),
        r.reference ?? '',
      ]
        .map(escape)
        .join(';');
    }),
  ].join('\n');
  return parseStatementCsv(csv, accountId);
}
