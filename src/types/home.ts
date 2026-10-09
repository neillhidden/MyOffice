export interface HomeAudit {
  editedAt?: string;
  deletedAt?: string;
  edits?: { changedAt: string; before: Record<string, unknown> }[];
}
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
export interface HomeAccount extends HomeAudit {
  currency?: HomeCurrency;
  id: string;
  name: string;
  openingBalance: number;
  kind: 'current' | 'savings';
}
export interface HomeEntry extends HomeAudit {
  subcategory?: string;
  businessMovementId?: string;
  goalId?: string;
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'reversal';
  title: string;
  amount: number;
  date: string;
  category: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  accountId: string;
  destinationId?: string;
  billId?: string;
  billMonth?: string;
  reversalOf?: string;
}
export interface HomeBudget extends HomeAudit {
  currency?: HomeCurrency;
  id: string;
  month: string;
  category: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  limit: number;
}
export interface HomeBill extends HomeAudit {
  currency?: HomeCurrency;
  id: string;
  title: string;
  amount: number;
  category: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  day: number;
  active: boolean;
}
export interface HomeGoal extends HomeAudit {
  fundingMode?: 'reserve' | 'plan';
  plannedAmount?: number;
  acquiredDate?: string;
  acquisitionEntryId?: string;
  category?: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  id: string;
  title: string;
  target: number;
  deadline: string;
  accountId: string;
}
export interface HomeTask extends HomeAudit {
  id: string;
  title: string;
  date: string;
  category: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  done: boolean;
}
export interface HomeCategory {
  id: string;
  key: string;
  name: string;
  kind: 'expense' | 'income';
  parentId?: string;
  icon?: string;
  editedAt?: string;
}
export interface HomeData {
  categoryCatalog?: HomeCategory[];
  settings?: {
    reserveGoals: boolean;
    showBusinessIncome?: boolean;
    goalsPreferenceSet?: boolean;
  };
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

export interface HomeShoppingItem extends HomeAudit {
  paymentAmount?: number;
  paymentSnapshot?: { quantity: number; unitPrice: number };
  currency?: HomeCurrency;
  subcategory?: string;
  id: string;
  name: string;
  category: string;
  categoryHistory?: {
    category: string;
    subcategory?: string;
    changedAt: string;
  }[];
  quantity: number;
  unitPrice: number;
  entryId?: string;
  archived: boolean;
}
