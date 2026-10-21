import { Company } from '../types/stock';

export type CompanyStatus = 'ativa' | 'parada' | 'desativada';

export interface CompanyStateInfo {
  status: CompanyStatus;
  isActive: boolean;
  isStopped: boolean;
  isDeactivated: boolean;
  label: string;
  tooltipText: string;
}

/**
 * Normaliza e obtém o estado oficial da empresa ('ativa', 'parada' ou 'desativada').
 * Padrão para empresas indefinidas: 'ativa'.
 */
export function getCompanyStatus(company: { status?: string } | null | undefined): CompanyStatus {
  if (!company || !company.status) return 'ativa';
  const s = company.status.toLowerCase().trim();
  if (s === 'desativada' || s === 'desativado' || s === 'inativa') return 'desativada';
  if (s === 'parada' || s === 'parado' || s === 'pausada') return 'parada';
  return 'ativa';
}

/**
 * Verifica se a empresa está no estado 'ativa'.
 */
export function isCompanyActive(company: { status?: string } | null | undefined): boolean {
  return getCompanyStatus(company) === 'ativa';
}

/**
 * Verifica se a empresa está no estado 'parada' (visível mas com operações bloqueadas).
 */
export function isCompanyStopped(company: { status?: string } | null | undefined): boolean {
  return getCompanyStatus(company) === 'parada';
}

/**
 * Verifica se a empresa está no estado 'desativada' (completamente fora de serviço).
 */
export function isCompanyDeactivated(company: { status?: string } | null | undefined): boolean {
  return getCompanyStatus(company) === 'desativada';
}

/**
 * Rótulo legível para o estado da empresa.
 */
export function getCompanyStatusLabel(status: CompanyStatus): string {
  switch (status) {
    case 'parada':
      return 'Parada';
    case 'desativada':
      return 'Desativada';
    case 'ativa':
    default:
      return 'Ativa';
  }
}

/**
 * Texto auxiliar / tooltip contextualizado para a empresa associada.
 */
export function getCompanyStatusTooltip(companyName: string, status: CompanyStatus): string {
  switch (status) {
    case 'parada':
      return `Empresa parada (operações em pausa): ${companyName}`;
    case 'desativada':
      return `Empresa desativada (fora de serviço): ${companyName}`;
    case 'ativa':
    default:
      return `Empresa ativa: ${companyName}`;
  }
}
