export type Currency = 'INR' | 'USD' | 'EUR';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type Theme = 'light' | 'dark' | 'system';
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Expense {
  id: string;
  amount: number; // Stored in smallest unit (cents/paise)
  currency: Currency;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  isHidden: boolean;
  order: number;
}

export interface UserPreferences {
  id: string; // Single record, always 'user-preferences'
  dateFormat: DateFormat;
  defaultCurrency: Currency;
  theme: Theme;
}

// CSV Import types
export interface CSVColumnMapping {
  date: string;
  amount: string;
  category?: string;
  description?: string;
  currency?: string;
}

export interface CSVImportPreset {
  id: string;
  name: string;
  columnMapping: CSVColumnMapping;
  dateFormat: string;
  hasHeader: boolean;
  delimiter: string;
  amountMultiplier: number; // For converting to smallest unit
}

export interface ParsedCSVRow {
  date: string;
  amount: number;
  category: string;
  description: string;
  currency: Currency;
  rawData: Record<string, string>;
}

// Analytics types
export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PeriodComparison {
  period1: {
    start: string;
    end: string;
    total: number;
  };
  period2: {
    start: string;
    end: string;
    total: number;
  };
  change: number;
  changePercent: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  total: number;
  byCategory: Record<string, number>;
}

export interface InflationData {
  currentPeriod: number;
  previousPeriod: number;
  inflationRate: number;
  byCategory: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    changePercent: number;
  }>;
}
