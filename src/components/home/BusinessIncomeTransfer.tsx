import { useEffect, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { useHome } from '../../context/HomeContext';
import { HomeCurrency } from '../../types/home';
import {
  accountCurrency,
  addHomeEntry,
  effectiveEntries,
  formatHomeMoney,
  money,
  reverseHomeEntry,
  text,
  todayLocal,
  validDate,
} from '../../utils/home';
import {
  BUSINESS_LEDGER_KEY,
  commitHomeBusinessTransfer,
  assertBusinessTransfersCompatible,
} from '../../utils/homeBusinessStorage';
import { createId } from '../../utils/ids';
import { createReversal } from '../../utils/financialAudit';

const normalizeCurrency = (value: string): HomeCurrency | undefined =>
  ['KZ', 'AOA'].includes(value.toUpperCase())
    ? 'AOA'
    : value.toUpperCase() === 'USD'
      ? 'USD'
      : undefined;
export function useBusinessHomeTransfers() {
  const stock = useStock();
  const home = useHome();
  const checkBank = (id: string) => {
    for (const [key, records] of [
      ['banks', stock.banks],
      ['companies', stock.companies],
    ] as const)
      if (
        JSON.stringify(
          JSON.parse(localStorage.getItem('myoffice_estoque_' + key) || '[]'),
        ) !== JSON.stringify(records)
      )
        throw new Error(
          'Contas ou empresas mudaram noutra aba. Recarrega a página.',
        );
    const bank = stock.banks.find((b) => b.id === id);
    const company = stock.companies.find((c) => c.id === bank?.companyId);
    if (
      !bank ||
      bank.status !== 'ativo' ||
      (bank.companyId && (!company || company.status !== 'ativa'))
    )
      throw new Error('Escolhe uma conta ativa de uma empresa ativa.');
    return bank;
  };
  const currentLedger = () => {
    const raw = localStorage.getItem(BUSINESS_LEDGER_KEY);
    const records = raw ? JSON.parse(raw) : [];
    if (JSON.stringify(records) !== JSON.stringify(stock.bankMovements))
      throw new Error(
        'O histórico Business mudou noutra aba. Recarrega antes de transferir.',
      );
    return raw;
  };
  const finish = (
    nextHome: typeof home.data,
    nextBusiness: typeof stock.bankMovements,
  ) => {
    commitHomeBusinessTransfer(
      localStorage,
      home.storedRaw(),
      currentLedger(),
      nextHome,
      nextBusiness,
    );
    home.refreshFromStorage();
    stock.refreshBankMovements();
  };
  return {
    transfer: (
      bankId: string,
      accountId: string,
      amount: number,
      date: string,
      reason: string,
    ) => {
      const bank = checkBank(bankId);
      const account = home.data.accounts.find((a) => a.id === accountId);
      if (
        !account ||
        account.kind !== 'current' ||
        accountCurrency(account) !== normalizeCurrency(bank.currency)
      )
        throw new Error('Escolhe uma carteira pessoal da mesma moeda.');
      money(amount);
      text(reason);
      if (!validDate(date) || date > todayLocal())
        throw new Error('Escolhe uma data válida, até hoje.');
      if (stock.getBankBalance(bankId) < amount)
        throw new Error('Saldo Business insuficiente.');
      const id = createId('bmov-home');
      const nextHome = addHomeEntry(home.data, {
        type: 'income',
        title: text(reason),
        amount,
        date,
        category: 'Rendimentos do Business',
        accountId,
        businessMovementId: id,
      });
      const entry = nextHome.entries[0];
      const nextBusiness = [
        {
          id,
          bankId,
          type: 'saida' as const,
          amount,
          date: `${date}T12:00:00`,
          reason: `Transferência para Home: ${text(reason)}`,
          category: 'Transferência',
          responsible: 'Administrador',
          reference: entry.id,
          homeTransferId: entry.id,
          personalAccountId: accountId,
          personalCurrency: accountCurrency(account),
        },
        ...stock.bankMovements,
      ];
      assertBusinessTransfersCompatible(nextHome, nextBusiness);
      finish(nextHome, nextBusiness);
    },
    reverse: (entryId: string, reason: string) => {
      const entry = effectiveEntries(home.data).find((e) => e.id === entryId);
      const movement = stock.bankMovements.find(
        (m) => m.id === entry?.businessMovementId,
      );
      if (
        !entry ||
        !movement ||
        movement.isReversed ||
        stock.bankMovements.some((m) => m.reversalOfId === movement.id)
      )
        throw new Error('Transferência não encontrada ou já estornada.');
      checkBank(movement.bankId);
      const nextHome = reverseHomeEntry(home.data, entryId, reason, true);
      const reversal = createReversal(movement, text(reason));
      const nextBusiness = [
        reversal,
        ...stock.bankMovements.map((m) =>
          m.id === movement.id
            ? {
                ...m,
                isReversed: true,
                reversedAt: reversal.date,
                reversalReason: text(reason),
                reversedBy: 'Administrador',
              }
            : m,
        ),
      ];
      assertBusinessTransfersCompatible(nextHome, nextBusiness);
      finish(nextHome, nextBusiness);
    },
  };
}
export function BusinessIncomeTransfer({
  currency,
}: {
  currency: HomeCurrency;
}) {
  const { data } = useHome();
  const { banks, companies, getBankBalance } = useStock();
  const bridge = useBusinessHomeTransfers();
  const [bankId, setBankId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayLocal);
  const [reason, setReason] = useState('Rendimento do Business');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    setBankId('');
    setAccountId('');
    setError('');
    setNotice('');
  }, [currency]);
  const available = banks.filter(
    (b) =>
      b.status === 'ativo' &&
      normalizeCurrency(b.currency) === currency &&
      (!b.companyId ||
        companies.some((c) => c.id === b.companyId && c.status === 'ativa')),
  );
  const wallets = data.accounts.filter(
    (a) => a.kind === 'current' && accountCurrency(a) === currency,
  );
  const input =
    'w-full min-h-10 rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-3 py-2 text-sm';
  return (
    <section
      id="home-business-income"
      className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-4 space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold">
          Transferir rendimento do Business
        </h2>
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
          Retira da conta empresarial e credita a carteira pessoal. O dinheiro é
          transferido, mantendo saldos independentes e a mesma moeda. Indica a
          descrição da retirada;
        </p>
      </div>
      <form
        className="grid sm:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            bridge.transfer(bankId, accountId, Number(amount), date, reason);
            setAmount('');
            setError('');
            setNotice('Transferência guardada nos dois históricos.');
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Não foi possível transferir.',
            );
          }
        }}
      >
        <label className="text-xs">
          Conta Business
          <select
            id="home-business-bank"
            required
            className={`${input} mt-1`}
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
          >
            <option value="">Escolher…</option>
            {available.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ·{' '}
                {companies.find((c) => c.id === b.companyId)?.name ||
                  'Business geral'}{' '}
                · {formatHomeMoney(getBankBalance(b.id), currency)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Carteira pessoal
          <select
            id="home-business-wallet"
            required
            className={`${input} mt-1`}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Escolher…</option>
            {wallets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Valor ({currency === 'AOA' ? 'Kz' : 'USD'})
          <input
            id="home-business-amount"
            required
            type="number"
            min="0.01"
            step="0.01"
            className={`${input} mt-1`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Data
          <input
            id="home-business-date"
            required
            type="date"
            max={todayLocal()}
            className={`${input} mt-1`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Descrição da retirada
          <input
            id="home-business-reason"
            required
            maxLength={300}
            className={`${input} mt-1`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button
          id="home-business-transfer"
          className="min-h-10 rounded-lg bg-slate-900 text-white dark:bg-dm-text dark:text-dm-page px-4 py-2 text-xs font-semibold"
          disabled={!available.length || !wallets.length}
        >
          Transferir para Home
        </button>
      </form>
      {!available.length && (
        <p className="text-xs text-slate-500 dark:text-dm-muted">
          Cria ou ativa uma conta Business nesta moeda para transferir.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="text-xs text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}
    </section>
  );
}
