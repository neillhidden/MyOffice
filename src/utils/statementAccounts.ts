/** Only labelled statement headers identify ownership; receipts may name third parties. */
export function statementAccountMatch(text: string, accounts: { id: string; accountNumber?: string; iban?: string }[]) {
  const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const references = Array.from(text.matchAll(/^\s*(?:IBAN|(?:N[úu]mero\s+(?:da\s+)?)?Conta(?:\s+(?:banc[áa]ria|n[º°]))?)\s*[:#]\s*([^\r\n]+)$/gim))
    .map((match) => normalize(match[1])).filter((value) => value.length >= 6 && value.length <= 34);
  const ids = new Set(accounts.filter((account) => [account.accountNumber, account.iban].some((value) => value && references.includes(normalize(value)))).map((account) => account.id));
  const allKnown = references.every((reference) => accounts.some((account) => [account.accountNumber, account.iban].some((value) => value && normalize(value) === reference)));
  return { identified: references.length > 0, ids: [...ids], accountId: ids.size === 1 && allKnown ? [...ids][0] : undefined };
}
