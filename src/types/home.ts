export type HomeCurrency = 'AOA' | 'USD';
export type OfficeMode = 'home' | 'business';
export type HomeSection =
  | 'Dashboard'
  | 'Finanças'
  | 'Orçamento'
  | 'Contas da casa'
  | 'Metas e sonhos'
  | 'Agenda'
  | 'Definições'
  | 'Compras';
export interface HomeAccount {
  currency?: HomeCurrency;
  id: string;
  name: string;
  openingBalance: number;
  kind: 'current' | 'savings';
}
export interface HomeEntry {
  businessMovementId?: string;
  goalId?: string;
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'reversal';
  title: string;
  amount: number;
  date: string;
  category: string;
  accountId: string;
  destinationId?: string;
  billId?: string;
  billMonth?: string;
  reversalOf?: string;
}
export interface HomeBudget {
  currency?: HomeCurrency;
  id: string;
  month: string;
  category: string;
  limit: number;
}
export interface HomeBill {
  currency?: HomeCurrency;
  id: string;
  title: string;
  amount: number;
  category: string;
  day: number;
  active: boolean;
}
export interface HomeGoal {
  fundingMode?: 'reserve' | 'plan';
  plannedAmount?: number;
  acquiredDate?: string;
  acquisitionEntryId?: string;
  category?: string;
  id: string;
  title: string;
  target: number;
  deadline: string;
  accountId: string;
}
export interface HomeTask {
  id: string;
  title: string;
  date: string;
  category: string;
  done: boolean;
}
export interface HomeData {
  settings?: { reserveGoals: boolean; showBusinessIncome?: boolean; goalsPreferenceSet?: boolean };
  incomeCategories?: string[];
  incomeSubcategories?: Record<string, string[]>;
  categories?: string[];
  subcategories?: Record<string, string[]>;
  shopping?: HomeShoppingItem[];
  version: 1;
  name: string;
  accounts: HomeAccount[];
  entries: HomeEntry[];
  budgets: HomeBudget[];
  bills: HomeBill[];
  goals: HomeGoal[];
  tasks: HomeTask[];
}

export interface HomeShoppingItem {
  currency?: HomeCurrency;
  subcategory?: string;
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  entryId?: string;
  archived: boolean;
}
