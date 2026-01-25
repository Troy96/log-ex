import Dexie, { type EntityTable } from 'dexie';
import { Expense, Category, UserPreferences } from '@/types';
import { DEFAULT_CATEGORIES } from '@/config/categories';

export class LogExDatabase extends Dexie {
  expenses!: EntityTable<Expense, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  preferences!: EntityTable<UserPreferences, 'id'>;

  constructor() {
    super('LogExDB');

    this.version(1).stores({
      expenses: 'id, date, category, currency, isRecurring, createdAt',
      categories: 'id, name, order, isHidden',
      preferences: 'id',
    });
  }
}

export const db = new LogExDatabase();

// Initialize default data
export async function initializeDatabase(): Promise<void> {
  // Check if categories exist, if not seed with defaults
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  // Check if preferences exist, if not create defaults
  const prefs = await db.preferences.get('user-preferences');
  if (!prefs) {
    await db.preferences.add({
      id: 'user-preferences',
      dateFormat: 'DD/MM/YYYY',
      defaultCurrency: 'INR',
      theme: 'system',
    });
  }
}

// Expense operations
export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.expenses.add({
    ...expense,
    id,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
  await db.expenses.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  return db.expenses.get(id);
}

export async function getAllExpenses(): Promise<Expense[]> {
  return db.expenses.orderBy('date').reverse().toArray();
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  return db.expenses
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  return db.expenses.where('category').equals(category).toArray();
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray();
}

export async function getVisibleCategories(): Promise<Category[]> {
  const allCategories = await db.categories.orderBy('order').toArray();
  return allCategories.filter((cat) => !cat.isHidden);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  await db.categories.update(id, updates);
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  await db.categories.add({ ...category, id });
  return id;
}

// Preferences operations
export async function getPreferences(): Promise<UserPreferences | undefined> {
  return db.preferences.get('user-preferences');
}

export async function updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
  await db.preferences.update('user-preferences', updates);
}

// Bulk operations for import
export async function bulkAddExpenses(expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  const { v4: uuidv4 } = await import('uuid');
  const now = new Date().toISOString();

  const expensesWithIds = expenses.map((expense) => ({
    ...expense,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.expenses.bulkAdd(expensesWithIds);
  return expensesWithIds.length;
}

// Export all data for backup
export async function exportAllData(): Promise<{
  expenses: Expense[];
  categories: Category[];
  preferences: UserPreferences | undefined;
}> {
  const [expenses, categories, preferences] = await Promise.all([
    getAllExpenses(),
    getAllCategories(),
    getPreferences(),
  ]);

  return { expenses, categories, preferences };
}

// Clear all data (use with caution)
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.expenses.clear(),
    db.categories.clear(),
    db.preferences.clear(),
  ]);
}
