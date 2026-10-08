import { HomeData } from '../types/home';
import { BankMovement } from '../types/stock';
import {
  HOME_STORAGE_KEY,
  effectiveEntries,
  validateHomeData,
  accountCurrency,
} from './home';

export const BUSINESS_LEDGER_KEY = 'myoffice_estoque_bankMovements';
export const HOME_BRIDGE_JOURNAL = 'myoffice-home-business-transaction';
interface Journal {
  version: 1;
  phase: 'prepared' | 'committed';
  beforeHome: string | null;
  beforeBusiness: string | null;
  afterHome: string;
  afterBusiness: string;
}
const setRaw = (storage: Storage, key: string, value: string | null) =>
  value === null ? storage.removeItem(key) : storage.setItem(key, value);
export function recoverHomeBusinessTransfer(storage: Storage) {
  const raw = storage.getItem(HOME_BRIDGE_JOURNAL);
  if (!raw) return;
  const j = JSON.parse(raw) as Journal;
  if (j.version !== 1 || !['prepared', 'committed'].includes(j.phase))
    throw new Error(
      'Registo de recuperação inválido. Os dados foram preservados.',
    );
  for (const value of [j.beforeHome, j.afterHome])
    if (value !== null) validateHomeData(JSON.parse(value));
  for (const value of [j.beforeBusiness, j.afterBusiness])
    if (value !== null && !Array.isArray(JSON.parse(value)))
      throw new Error('Histórico Business inválido.');
  if (
    ![j.beforeHome, j.afterHome].includes(storage.getItem(HOME_STORAGE_KEY)) ||
    ![j.beforeBusiness, j.afterBusiness].includes(
      storage.getItem(BUSINESS_LEDGER_KEY),
    )
  )
    throw new Error(
      'Os históricos mudaram durante a recuperação. Nenhum dado foi substituído.',
    );
  setRaw(
    storage,
    BUSINESS_LEDGER_KEY,
    j.phase === 'committed' ? j.afterBusiness : j.beforeBusiness,
  );
  setRaw(
    storage,
    HOME_STORAGE_KEY,
    j.phase === 'committed' ? j.afterHome : j.beforeHome,
  );
  storage.removeItem(HOME_BRIDGE_JOURNAL);
}
/** Durable two-document commit: a prepared journal restores the originals after interruption. */
export function commitHomeBusinessTransfer(
  storage: Storage,
  beforeHome: string | null,
  beforeBusiness: string | null,
  nextHome: HomeData,
  nextBusiness: BankMovement[],
) {
  if (storage.getItem(HOME_BRIDGE_JOURNAL))
    throw new Error(
      'Existe uma transferência por recuperar. Recarrega a página.',
    );
  if (
    storage.getItem(HOME_STORAGE_KEY) !== beforeHome ||
    storage.getItem(BUSINESS_LEDGER_KEY) !== beforeBusiness
  )
    throw new Error(
      'Os dados mudaram noutra aba. Recarrega antes de transferir.',
    );
  const afterHome = JSON.stringify(validateHomeData(nextHome));
  const afterBusiness = JSON.stringify(nextBusiness);
  const journal: Journal = {
    version: 1,
    phase: 'prepared',
    beforeHome,
    beforeBusiness,
    afterHome,
    afterBusiness,
  };
  storage.setItem(HOME_BRIDGE_JOURNAL, JSON.stringify(journal));
  try {
    storage.setItem(BUSINESS_LEDGER_KEY, afterBusiness);
    storage.setItem(HOME_STORAGE_KEY, afterHome);
    storage.setItem(
      HOME_BRIDGE_JOURNAL,
      JSON.stringify({ ...journal, phase: 'committed' }),
    );
  } catch (error) {
    try {
      setRaw(storage, BUSINESS_LEDGER_KEY, beforeBusiness);
      setRaw(storage, HOME_STORAGE_KEY, beforeHome);
      storage.removeItem(HOME_BRIDGE_JOURNAL);
    } catch {
      throw new Error(
        'A transferência não foi concluída. Recarrega para recuperar os dois históricos; o registo de recuperação foi preservado.',
      );
    }
    throw new Error(
      'A transferência não foi guardada. Os dois saldos foram preservados. Verifica o espaço do navegador.',
    );
  }
  try {
    storage.removeItem(HOME_BRIDGE_JOURNAL);
  } catch {
    /* A committed journal is safe to replay on startup. */
  }
}
export function assertBusinessTransfersCompatible(
  data: HomeData,
  movements: BankMovement[],
) {
  const active = new Set(effectiveEntries(data).map((e) => e.id));
  for (const m of movements.filter(
    (m) => m.homeTransferId && !m.reversalOfId,
  )) {
    const e = data.entries.find(
      (e) => e.id === m.homeTransferId && e.type === 'income',
    );
    if (
      !e ||
      e.businessMovementId !== m.id ||
      e.amount !== m.amount ||
      m.type !== 'saida' ||
      e.date !== m.date.slice(0, 10) ||
      accountCurrency(data.accounts.find((a) => a.id === e.accountId)) !==
        m.personalCurrency ||
      e.accountId !== m.personalAccountId ||
      active.has(e.id) === movements.some((r) => r.reversalOfId === m.id)
    )
      throw new Error(
        'A cópia Home não corresponde às transferências do Business. Usa uma cópia com o mesmo histórico financeiro.',
      );
  }
  for (const e of data.entries.filter(
    (e) => e.businessMovementId && e.type === 'income',
  ))
    if (
      !movements.some(
        (m) => m.id === e.businessMovementId && m.homeTransferId === e.id,
      )
    )
      throw new Error(
        'Falta o histórico Business ligado a esta cópia Home. Recupera os dois históricos no mesmo navegador.',
      );
}
