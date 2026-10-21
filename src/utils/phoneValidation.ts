/**
 * Utilitário de normalização e validação de números de telefone para Contactos.
 *
 * Regras (Ponto 3 da Auditoria Funcional):
 * - Normaliza removendo espaços, hífens, pontos e parênteses.
 * - Valida: '+' inicial opcional e 7 a 15 dígitos.
 * - Aceita números nacionais de Angola (+244 923 111 222, 923111222) e internacionais (+351 912 345 678, +86 138 0000 0000).
 */

/**
 * Normaliza o telefone removendo espaços, hífens, pontos e parênteses.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/[\s\-\(\)\.\[\]\/]+/g, '').trim();
}

/**
 * Valida se a string corresponde a um telefone válido (+ opcional e 7 a 15 dígitos).
 */
export function isValidPhone(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const normalized = normalizePhone(raw);
  return /^\+?\d{7,15}$/.test(normalized);
}

/**
 * Validação de campo de formulário com mensagem de erro contextualizada.
 */
export function validatePhoneField(
  raw: string | null | undefined,
  isRequired = true
): { isValid: boolean; normalized: string; error?: string } {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    if (isRequired) {
      return {
        isValid: false,
        normalized: '',
        error: 'O contacto de telefone é obrigatório.',
      };
    }
    return { isValid: true, normalized: '' };
  }

  const normalized = normalizePhone(trimmed);
  if (!/^\+?\d{7,15}$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error:
        'Número de telefone inválido. Deve conter entre 7 e 15 dígitos com "+" inicial opcional (ex: +244 923 111 222 ou 923111222).',
    };
  }

  return { isValid: true, normalized };
}
