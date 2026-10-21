/**
 * Utilitário central de referências curtas e formatação de identificadores.
 * Regra 2.7: Mostra uma referência curta (ex: VND-A3F9K2, com os primeiros 6 caracteres
 * do identificador em maiúsculas). O identificador completo fica disponível para cópia.
 * Garante que pesquisas encontram tanto a referência curta como a completa.
 */

export function formatShortRef(id: string, defaultPrefix = 'REF'): string {
  if (!id) return '';
  const trimmed = id.trim();

  // Se já tiver formato prefixo-resto (ex: vnd-1001 ou mov-3f8d2a1b-4c5e...)
  const dashIndex = trimmed.indexOf('-');
  if (dashIndex > 0) {
    const rawPrefix = trimmed.slice(0, dashIndex).toUpperCase();
    const rawRest = trimmed.slice(dashIndex + 1).replace(/-/g, '');
    const shortRest = rawRest.length > 6 ? rawRest.slice(0, 6) : rawRest;
    return `${rawPrefix}-${shortRest.toUpperCase()}`;
  }

  // Se for UUID ou string alfanumérica direta
  const clean = trimmed.replace(/-/g, '');
  const prefix = defaultPrefix.toUpperCase();
  const rest = clean.length > 6 ? clean.slice(0, 6) : clean;
  return `${prefix}-${rest.toUpperCase()}`;
}

export function matchRefOrFull(fullId: string | undefined, query: string, prefix?: string): boolean {
  if (!fullId) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullLower = fullId.toLowerCase();
  if (fullLower.includes(q)) return true;

  const shortRef = formatShortRef(fullId, prefix).toLowerCase();
  if (shortRef.includes(q)) return true;

  // Também verificar sem hífen (ex: "vnda3f9" ou "a3f9k2")
  const shortRefClean = shortRef.replace(/-/g, '');
  const qClean = q.replace(/-/g, '');
  if (shortRefClean.includes(qClean)) return true;

  return false;
}

/**
 * Abreviar IBAN para exibição em tabelas/cartões mantendo país e dígitos finais
 * Ex: AO06.0040.0000.1234.5678.9012.3 -> AO06...9012
 */
export function abbreviateIban(iban?: string): string {
  if (!iban) return '—';
  const clean = iban.trim();
  if (clean.length <= 12) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}...${end}`;
}

/**
 * Abreviar número de conta para tabelas/cartões
 * Ex: 0040.0000.1234.5678 -> 0040...5678
 */
export function abbreviateAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '—';
  const clean = accountNumber.trim();
  if (clean.length <= 10) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}...${end}`;
}
