import {
  MainModule,
  EstoqueSubmodule,
  CaixaSubmodule,
  ContactosSubmodule,
  FinanceiroSubmodule,
} from '../components/layout/Sidebar';
import { OfficeMode, HomeSection } from '../types/home';

export interface NavigationState {
  mode: OfficeMode;
  module: MainModule;
  estoqueSub: EstoqueSubmodule;
  caixaSub: CaixaSubmodule;
  contactosSub: ContactosSubmodule;
  financeiroSub: FinanceiroSubmodule;
  homeSection: HomeSection;
}

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  mode: 'business',
  module: 'Estoque',
  estoqueSub: 'Armazém',
  caixaSub: 'Venda',
  contactosSub: 'Funcionários',
  financeiroSub: 'Contas',
  homeSection: 'Dashboard',
};

/**
 * Converte o estado atual da aplicação para o hash correspondente na URL.
 */
export function stateToHash(state: NavigationState): string {
  if (state.mode === 'home') {
    const s = state.homeSection;
    if (s === 'Finanças') return '#/home/financas';
    if (s === 'Orçamento') return '#/home/orcamento';
    if (s === 'Contas da casa') return '#/home/contas-da-casa';
    if (s === 'Metas e sonhos') return '#/home/metas';
    if (s === 'Agenda') return '#/home/agenda';
    if (s === 'Compras') return '#/home/compras';
    if (s === 'Histórico') return '#/home/historico';
    if (s === 'Dívidas pessoais') return '#/home/dividas-pessoais';
    if (s === 'Planeamento') return '#/home/planeamento';
    if (s === 'Relatórios') return '#/home/relatorios';
    if (s === 'Extratos') return '#/home/extratos';
    if (s === 'Documentos') return '#/home/documentos';
    if (s === 'Definições') return '#/home/definicoes';
    return '#/home/dashboard';
  }

  // Business Mode
  switch (state.module) {
    case 'Dashboard':
      return '#/dashboard';
    case 'Calendário':
      return '#/calendario';
    case 'Definições':
      return '#/definicoes';
    case 'Agentes':
      return '#/agentes';
    case 'Caixa':
      return state.caixaSub === 'Transporte' ? '#/transporte' : '#/venda';
    case 'Financeiro':
    case 'Banco':
      if (state.financeiroSub === 'Lançamentos') return '#/lancamentos';
      if (state.financeiroSub === 'Dívidas') return '#/dividas';
      if (state.financeiroSub === 'Documentos') return '#/documentos-financeiro';
      return '#/contas';
    case 'Contactos':
      if (state.contactosSub === 'Clientes') return '#/clientes';
      if (state.contactosSub === 'Fornecedores') return '#/fornecedores';
      if (state.contactosSub === 'Afiliados') return '#/afiliados';
      return '#/funcionarios';
    case 'Estoque':
    default:
      if (state.estoqueSub === 'Movimentação') return '#/movimentacao';
      if (
        state.estoqueSub === 'Simulador de Importação e Rentabilidade' ||
        state.estoqueSub === 'Análise de produtos'
      )
        return '#/simulador';
      if (state.estoqueSub === 'Lista de compras') return '#/lista-compras';
      if (state.estoqueSub === 'Defeituoso') return '#/defeituoso';
      return '#/armazem';
  }
}

/**
 * Converte um hash na URL para o NavigationState correspondente.
 * Aceita rotas normais e rotas com hash (ex: #/armazem, #/clientes, #/home/orcamento).
 */
export function hashToState(
  hash: string,
  currentState: NavigationState = DEFAULT_NAVIGATION_STATE
): NavigationState {
  const clean = (hash || '').replace(/^#\/?/, '').trim().toLowerCase();

  if (!clean) {
    return currentState;
  }

  // Home paths
  if (clean === 'home' || clean.startsWith('home/')) {
    const sub = clean.replace(/^home\/?/, '');
    let homeSection: HomeSection = 'Dashboard';

    if (sub === 'financas') homeSection = 'Finanças';
    else if (sub === 'orcamento') homeSection = 'Orçamento';
    else if (sub === 'contas-da-casa' || sub === 'contas') homeSection = 'Contas da casa';
    else if (sub === 'metas' || sub === 'metas-e-sonhos') homeSection = 'Metas e sonhos';
    else if (sub === 'agenda') homeSection = 'Agenda';
    else if (sub === 'compras') homeSection = 'Compras';
    else if (sub === 'historico') homeSection = 'Histórico';
    else if (sub === 'dividas-pessoais' || sub === 'dividas') homeSection = 'Dívidas pessoais';
    else if (sub === 'planeamento') homeSection = 'Planeamento';
    else if (sub === 'relatorios') homeSection = 'Relatórios';
    else if (sub === 'extratos') homeSection = 'Extratos';
    else if (sub === 'documentos') homeSection = 'Documentos';
    else if (sub === 'definicoes') homeSection = 'Definições';

    return {
      ...currentState,
      mode: 'home',
      homeSection,
    };
  }

  // Business paths
  // 1. Dashboard
  if (clean === 'dashboard') {
    return { ...currentState, mode: 'business', module: 'Dashboard' };
  }

  // 2. Calendário
  if (clean === 'calendario' || clean === 'agenda-business') {
    return { ...currentState, mode: 'business', module: 'Calendário' };
  }

  // 3. Definições
  if (clean === 'definicoes' || clean === 'configuracoes' || clean === 'settings') {
    return { ...currentState, mode: 'business', module: 'Definições' };
  }

  // 4. Agentes
  if (clean === 'agentes') {
    return { ...currentState, mode: 'business', module: 'Agentes' };
  }

  // 5. Caixa
  if (clean === 'venda' || clean === 'caixa/venda' || clean === 'caixa' || clean === 'pos') {
    return { ...currentState, mode: 'business', module: 'Caixa', caixaSub: 'Venda' };
  }
  if (clean === 'transporte' || clean === 'caixa/transporte' || clean === 'entregas') {
    return { ...currentState, mode: 'business', module: 'Caixa', caixaSub: 'Transporte' };
  }

  // 6. Financeiro
  if (clean === 'contas' || clean === 'financeiro/contas' || clean === 'financeiro' || clean === 'banco') {
    return { ...currentState, mode: 'business', module: 'Financeiro', financeiroSub: 'Contas' };
  }
  if (clean === 'lancamentos' || clean === 'financeiro/lancamentos') {
    return { ...currentState, mode: 'business', module: 'Financeiro', financeiroSub: 'Lançamentos' };
  }
  if (clean === 'dividas' || clean === 'financeiro/dividas') {
    return { ...currentState, mode: 'business', module: 'Financeiro', financeiroSub: 'Dívidas' };
  }
  if (clean === 'documentos-financeiro' || clean === 'financeiro/documentos' || clean === 'extratos-financeiro') {
    return { ...currentState, mode: 'business', module: 'Financeiro', financeiroSub: 'Documentos' };
  }

  // 7. Contactos
  if (clean === 'funcionarios' || clean === 'contactos/funcionarios' || clean === 'contactos' || clean === 'empregados') {
    return { ...currentState, mode: 'business', module: 'Contactos', contactosSub: 'Funcionários' };
  }
  if (clean === 'clientes' || clean === 'contactos/clientes') {
    return { ...currentState, mode: 'business', module: 'Contactos', contactosSub: 'Clientes' };
  }
  if (clean === 'fornecedores' || clean === 'contactos/fornecedores') {
    return { ...currentState, mode: 'business', module: 'Contactos', contactosSub: 'Fornecedores' };
  }
  if (clean === 'afiliados' || clean === 'contactos/afiliados') {
    return { ...currentState, mode: 'business', module: 'Contactos', contactosSub: 'Afiliados' };
  }

  // 8. Estoque
  if (clean === 'movimentacao' || clean === 'estoque/movimentacao' || clean === 'movimentos') {
    return { ...currentState, mode: 'business', module: 'Estoque', estoqueSub: 'Movimentação' };
  }
  if (
    clean === 'simulador' ||
    clean === 'estoque/simulador' ||
    clean === 'analise-produtos' ||
    clean === 'importacao'
  ) {
    return {
      ...currentState,
      mode: 'business',
      module: 'Estoque',
      estoqueSub: 'Simulador de Importação e Rentabilidade',
    };
  }
  if (clean === 'lista-compras' || clean === 'compras' || clean === 'estoque/compras') {
    return { ...currentState, mode: 'business', module: 'Estoque', estoqueSub: 'Lista de compras' };
  }
  if (clean === 'defeituoso' || clean === 'estoque/defeituoso' || clean === 'avarias') {
    return { ...currentState, mode: 'business', module: 'Estoque', estoqueSub: 'Defeituoso' };
  }
  if (clean === 'armazem' || clean === 'estoque/armazem' || clean === 'estoque' || clean === 'produtos') {
    return { ...currentState, mode: 'business', module: 'Estoque', estoqueSub: 'Armazém' };
  }

  return currentState;
}
