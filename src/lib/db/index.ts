import Dexie, { type EntityTable } from 'dexie';
import { Expense, Category, UserPreferences, SyncableExpense, SyncableCategory, SyncAction } from '@/types';
import { DEFAULT_CATEGORIES } from '@/config/categories';

export class LogExDatabase extends Dexie {
  expenses!: EntityTable<SyncableExpense, 'id'>;
  categories!: EntityTable<SyncableCategory, 'id'>;
  preferences!: EntityTable<UserPreferences, 'id'>;
  syncQueue!: EntityTable<SyncAction, 'id'>;
  syncMeta!: EntityTable<{ id: string; lastSyncAt: string | null; userId: string | null }, 'id'>;

  constructor() {
    super('LogExDB');

    // Version 1: Original schema
    this.version(1).stores({
      expenses: 'id, date, category, currency, isRecurring, createdAt',
      categories: 'id, name, order, isHidden',
      preferences: 'id',
    });

    // Version 2: Add sync support
    this.version(2).stores({
      expenses: 'id, date, category, currency, isRecurring, createdAt, _deleted, _sync.syncStatus',
      categories: 'id, name, order, isHidden, _deleted, _sync.syncStatus',
      preferences: 'id',
      syncQueue: 'id, table, entityId, timestamp',
      syncMeta: 'id',
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
  const expenses = await db.expenses.orderBy('date').reverse().toArray();
  return expenses.filter(e => !e._deleted);
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const expenses = await db.expenses
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
  return expenses.filter(e => !e._deleted);
}

export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  const expenses = await db.expenses.where('category').equals(category).toArray();
  return expenses.filter(e => !e._deleted);
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  const categories = await db.categories.orderBy('order').toArray();
  return categories.filter(c => !c._deleted);
}

export async function getVisibleCategories(): Promise<Category[]> {
  const allCategories = await db.categories.orderBy('order').toArray();
  return allCategories.filter((cat) => !cat.isHidden && !cat._deleted);
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
    db.syncQueue.clear(),
    db.syncMeta.clear(),
  ]);
}

// Sync queue operations
export async function addToSyncQueue(action: SyncAction): Promise<void> {
  await db.syncQueue.add(action);
}

export async function getSyncQueue(): Promise<SyncAction[]> {
  return db.syncQueue.orderBy('timestamp').toArray();
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncAction>): Promise<void> {
  await db.syncQueue.update(id, updates);
}

// Sync meta operations
export async function getSyncMeta(): Promise<{ lastSyncAt: string | null; userId: string | null } | undefined> {
  return db.syncMeta.get('sync-meta');
}

export async function updateSyncMeta(updates: { lastSyncAt?: string | null; userId?: string | null }): Promise<void> {
  const existing = await db.syncMeta.get('sync-meta');
  if (existing) {
    await db.syncMeta.update('sync-meta', updates);
  } else {
    await db.syncMeta.add({ id: 'sync-meta', lastSyncAt: null, userId: null, ...updates });
  }
}

// Get all unsynced items for a table
export async function getUnsyncedExpenses(): Promise<SyncableExpense[]> {
  return db.expenses
    .filter(e => !e._sync || e._sync.syncStatus === 'pending')
    .toArray();
}

export async function getUnsyncedCategories(): Promise<SyncableCategory[]> {
  return db.categories
    .filter(c => !c._sync || c._sync.syncStatus === 'pending')
    .toArray();
}

// Update sync status
export async function updateExpenseSyncStatus(id: string, syncStatus: 'pending' | 'synced' | 'error', serverId?: string): Promise<void> {
  const expense = await db.expenses.get(id);
  if (expense) {
    await db.expenses.update(id, {
      _sync: {
        ...expense._sync,
        syncStatus,
        serverId: serverId || expense._sync?.serverId,
        syncedAt: syncStatus === 'synced' ? new Date().toISOString() : expense._sync?.syncedAt,
      }
    });
  }
}

export async function updateCategorySyncStatus(id: string, syncStatus: 'pending' | 'synced' | 'error', serverId?: string): Promise<void> {
  const category = await db.categories.get(id);
  if (category) {
    await db.categories.update(id, {
      _sync: {
        ...category._sync,
        syncStatus,
        serverId: serverId || category._sync?.serverId,
        syncedAt: syncStatus === 'synced' ? new Date().toISOString() : category._sync?.syncedAt,
      }
    });
  }
}

// Soft delete (for sync)
export async function softDeleteExpense(id: string): Promise<void> {
  await db.expenses.update(id, {
    _deleted: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteCategory(id: string): Promise<void> {
  await db.categories.update(id, {
    _deleted: true,
  });
}

// Mark all local data as pending sync (for first-time login)
export async function markAllAsPendingSync(): Promise<void> {
  await db.transaction('rw', [db.expenses, db.categories], async () => {
    const expenses = await db.expenses.toArray();
    const categories = await db.categories.toArray();

    for (const expense of expenses) {
      if (!expense._sync?.serverId) {
        await db.expenses.update(expense.id, {
          _sync: { syncStatus: 'pending' }
        });
      }
    }

    for (const category of categories) {
      if (!category._sync?.serverId && !category.isDefault) {
        await db.categories.update(category.id, {
          _sync: { syncStatus: 'pending' }
        });
      }
    }
  });
}
