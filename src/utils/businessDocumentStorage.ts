import {
  BusinessDocuments,
  validateBusinessDocuments,
} from './businessDocumentImport';
import { BankMovement } from '../types/stock';
import {
  BUSINESS_LEDGER_KEY,
  HOME_BRIDGE_JOURNAL,
} from './homeBusinessStorage';
export const BUSINESS_DOCUMENTS_KEY = 'myoffice-business-documents-v1';
export const BUSINESS_DOCUMENTS_JOURNAL =
  'myoffice-business-documents-transaction';
type Journal = {
  version: 1;
  phase: 'prepared' | 'committed';
  beforeLedger: string | null;
  beforeTools: string | null;
  afterLedger: string;
  afterTools: string;
};
const put = (storage: Storage, key: string, value: string | null) =>
  value === null ? storage.removeItem(key) : storage.setItem(key, value);
export function recoverBusinessDocuments(storage: Storage) {
  const raw = storage.getItem(BUSINESS_DOCUMENTS_JOURNAL);
  if (!raw) return;
  const j = JSON.parse(raw) as Journal;
  if (j.version !== 1 || !['prepared', 'committed'].includes(j.phase))
    throw new Error('Recuperação de comprovativos inválida.');
  if (
    ![j.beforeLedger, j.afterLedger].includes(
      storage.getItem(BUSINESS_LEDGER_KEY),
    ) ||
    ![j.beforeTools, j.afterTools].includes(
      storage.getItem(BUSINESS_DOCUMENTS_KEY),
    )
  )
    throw new Error('Os dados mudaram durante a recuperação.');
  const ledger = j.phase === 'committed' ? j.afterLedger : j.beforeLedger,
    tools = j.phase === 'committed' ? j.afterTools : j.beforeTools;
  if (tools)
    validateBusinessDocuments(JSON.parse(tools), JSON.parse(ledger || '[]'));
  put(storage, BUSINESS_LEDGER_KEY, ledger);
  put(storage, BUSINESS_DOCUMENTS_KEY, tools);
  storage.removeItem(BUSINESS_DOCUMENTS_JOURNAL);
}
export function commitBusinessDocuments(
  storage: Storage,
  beforeLedger: string | null,
  beforeTools: string | null,
  movements: BankMovement[],
  tools: BusinessDocuments,
) {
  if (
    storage.getItem(BUSINESS_DOCUMENTS_JOURNAL) ||
    storage.getItem(HOME_BRIDGE_JOURNAL)
  )
    throw new Error(
      'Existe uma operação por recuperar. Recarrega antes de continuar.',
    );
  if (
    storage.getItem(BUSINESS_LEDGER_KEY) !== beforeLedger ||
    storage.getItem(BUSINESS_DOCUMENTS_KEY) !== beforeTools
  )
    throw new Error('Os dados mudaram noutra aba. Recarrega antes de aplicar.');
  validateBusinessDocuments(tools, movements);
  const j: Journal = {
    version: 1,
    phase: 'prepared',
    beforeLedger,
    beforeTools,
    afterLedger: JSON.stringify(movements),
    afterTools: JSON.stringify(tools),
  };
  storage.setItem(BUSINESS_DOCUMENTS_JOURNAL, JSON.stringify(j));
  try {
    storage.setItem(BUSINESS_LEDGER_KEY, j.afterLedger);
    storage.setItem(BUSINESS_DOCUMENTS_KEY, j.afterTools);
    storage.setItem(
      BUSINESS_DOCUMENTS_JOURNAL,
      JSON.stringify({ ...j, phase: 'committed' }),
    );
  } catch {
    try {
      put(storage, BUSINESS_LEDGER_KEY, beforeLedger);
      put(storage, BUSINESS_DOCUMENTS_KEY, beforeTools);
      storage.removeItem(BUSINESS_DOCUMENTS_JOURNAL);
    } catch {
      throw new Error(
        'A gravação foi interrompida. Recarrega para recuperar; o diário foi preservado.',
      );
    }
    throw new Error(
      'Não foi possível guardar. Os saldos e documentos foram preservados. Verifica o espaço do navegador.',
    );
  }
  try {
    storage.removeItem(BUSINESS_DOCUMENTS_JOURNAL);
  } catch {
    /* committed journal is recovered on next startup */
  }
}
