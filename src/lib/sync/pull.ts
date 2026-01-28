import { getSupabaseClient } from '@/lib/supabase/client';
import {
  db,
  getSyncMeta,
  updateSyncMeta,
  updateExpenseSyncStatus,
  updateCategorySyncStatus,
} from '@/lib/db';
import { SyncableExpense, SyncableCategory, UserPreferences } from '@/types';

interface PullResult {
  success: boolean;
  pulled: {
    expenses: number;
    categories: number;
    preferences: boolean;
  };
  errors: string[];
}

export async function pullChanges(userId: string): Promise<PullResult> {
  const supabase = getSupabaseClient();
  const syncMeta = await getSyncMeta();
  const lastSyncAt = syncMeta?.lastSyncAt || null;

  const result: PullResult = {
    success: true,
    pulled: {
      expenses: 0,
      categories: 0,
      preferences: false,
    },
    errors: [],
  };

  try {
    // Pull expenses
    const expenseResult = await pullExpenses(supabase, userId, lastSyncAt);
    result.pulled.expenses = expenseResult.count;
    if (expenseResult.error) {
      result.errors.push(expenseResult.error);
      result.success = false;
    }

    // Pull categories
    const categoryResult = await pullCategories(supabase, userId, lastSyncAt);
    result.pulled.categories = categoryResult.count;
    if (categoryResult.error) {
      result.errors.push(categoryResult.error);
      result.success = false;
    }

    // Pull preferences
    const prefsResult = await pullPreferences(supabase, userId);
    result.pulled.preferences = prefsResult.success;
    if (prefsResult.error) {
      result.errors.push(prefsResult.error);
      result.success = false;
    }

    // Update last sync time
    if (result.success) {
      await updateSyncMeta({ lastSyncAt: new Date().toISOString(), userId });
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

interface TablePullResult {
  count: number;
  error?: string;
}

async function pullExpenses(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  lastSyncAt: string | null
): Promise<TablePullResult> {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId);

  if (lastSyncAt) {
    query = query.gt('updated_at', lastSyncAt);
  }

  const { data, error } = await query;

  if (error) {
    return { count: 0, error: `Error pulling expenses: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return { count: 0 };
  }

  // Process each expense
  for (const serverExpense of data) {
    const localId = serverExpense.local_id;
    const existingExpense = await db.expenses.get(localId);

    const expenseData: SyncableExpense = {
      id: localId,
      amount: serverExpense.amount,
      currency: serverExpense.currency,
      category: serverExpense.category,
      description: serverExpense.description || '',
      date: serverExpense.date,
      isRecurring: serverExpense.is_recurring,
      recurringFrequency: serverExpense.recurring_frequency || undefined,
      createdAt: serverExpense.created_at,
      updatedAt: serverExpense.updated_at,
      _deleted: !!serverExpense.deleted_at,
      _sync: {
        syncStatus: 'synced',
        serverId: serverExpense.id,
        syncedAt: new Date().toISOString(),
      },
    };

    if (existingExpense) {
      // Conflict resolution: server wins if server is newer
      const serverUpdated = new Date(serverExpense.updated_at).getTime();
      const localUpdated = new Date(existingExpense.updatedAt).getTime();

      if (serverUpdated >= localUpdated) {
        await db.expenses.update(localId, expenseData);
      }
      // If local is newer and pending sync, keep local version
    } else {
      await db.expenses.add(expenseData);
    }
  }

  return { count: data.length };
}

async function pullCategories(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  lastSyncAt: string | null
): Promise<TablePullResult> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (lastSyncAt) {
    query = query.gt('updated_at', lastSyncAt);
  }

  const { data, error } = await query;

  if (error) {
    return { count: 0, error: `Error pulling categories: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return { count: 0 };
  }

  for (const serverCategory of data) {
    const localId = serverCategory.local_id;
    const existingCategory = await db.categories.get(localId);

    const categoryData: SyncableCategory = {
      id: localId,
      name: serverCategory.name,
      icon: serverCategory.icon || undefined,
      color: serverCategory.color || undefined,
      isDefault: serverCategory.is_default,
      isHidden: serverCategory.is_hidden,
      order: serverCategory.sort_order,
      _deleted: !!serverCategory.deleted_at,
      _sync: {
        syncStatus: 'synced',
        serverId: serverCategory.id,
        syncedAt: new Date().toISOString(),
      },
    };

    if (existingCategory) {
      // Only update if server has newer data
      const serverUpdated = new Date(serverCategory.updated_at).getTime();
      // Categories don't have updatedAt, so we check sync status
      if (!existingCategory._sync || existingCategory._sync.syncStatus === 'synced') {
        await db.categories.update(localId, categoryData);
      }
    } else {
      await db.categories.add(categoryData);
    }
  }

  return { count: data.length };
}

interface PrefsPullResult {
  success: boolean;
  error?: string;
}

async function pullPreferences(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string
): Promise<PrefsPullResult> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found on server, that's okay
      return { success: true };
    }
    return { success: false, error: `Error pulling preferences: ${error.message}` };
  }

  if (!data) {
    return { success: true };
  }

  // Update local preferences
  await db.preferences.update('user-preferences', {
    dateFormat: data.date_format,
    defaultCurrency: data.default_currency,
    theme: data.theme,
  });

  return { success: true };
}
