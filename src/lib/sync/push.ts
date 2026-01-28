import { getSupabaseClient } from '@/lib/supabase/client';
import {
  db,
  updateExpenseSyncStatus,
  updateCategorySyncStatus,
} from '@/lib/db';
import { SyncAction, SyncableExpense, SyncableCategory } from '@/types';
import { getPendingActions, markActionComplete, markActionFailed } from './queue';

interface PushResult {
  success: boolean;
  pushed: number;
  failed: number;
  errors: string[];
}

export async function pushChanges(userId: string): Promise<PushResult> {
  const supabase = getSupabaseClient();
  const actions = await getPendingActions();

  const result: PushResult = {
    success: true,
    pushed: 0,
    failed: 0,
    errors: [],
  };

  for (const action of actions) {
    try {
      const success = await pushAction(supabase, userId, action);
      if (success) {
        await markActionComplete(action.id);
        result.pushed++;
      } else {
        const shouldRetry = await markActionFailed(action.id);
        if (!shouldRetry) {
          result.failed++;
          result.errors.push(`Failed to sync ${action.table}:${action.entityId} after max retries`);
        }
      }
    } catch (error) {
      const shouldRetry = await markActionFailed(action.id);
      if (!shouldRetry) {
        result.failed++;
        result.errors.push(
          `Error syncing ${action.table}:${action.entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      result.success = false;
    }
  }

  return result;
}

async function pushAction(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  action: SyncAction
): Promise<boolean> {
  switch (action.table) {
    case 'expenses':
      return pushExpenseAction(supabase, userId, action);
    case 'categories':
      return pushCategoryAction(supabase, userId, action);
    case 'preferences':
      return pushPreferencesAction(supabase, userId, action);
    default:
      return false;
  }
}

async function pushExpenseAction(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  action: SyncAction
): Promise<boolean> {
  const payload = action.payload as Partial<SyncableExpense>;

  switch (action.operation) {
    case 'create':
    case 'update': {
      const { data, error } = await supabase
        .from('expenses')
        .upsert({
          user_id: userId,
          local_id: action.entityId,
          amount: payload.amount,
          currency: payload.currency,
          category: payload.category,
          description: payload.description || '',
          date: payload.date,
          is_recurring: payload.isRecurring || false,
          recurring_frequency: payload.recurringFrequency || null,
          created_at: payload.createdAt,
          updated_at: payload.updatedAt,
          deleted_at: payload._deleted ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,local_id',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error pushing expense:', error);
        return false;
      }

      await updateExpenseSyncStatus(action.entityId, 'synced', data.id);
      return true;
    }

    case 'delete': {
      // Soft delete on server
      const { error } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('local_id', action.entityId);

      if (error) {
        console.error('Error deleting expense:', error);
        return false;
      }

      await updateExpenseSyncStatus(action.entityId, 'synced');
      return true;
    }

    default:
      return false;
  }
}

async function pushCategoryAction(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  action: SyncAction
): Promise<boolean> {
  const payload = action.payload as Partial<SyncableCategory>;

  switch (action.operation) {
    case 'create':
    case 'update': {
      const { data, error } = await supabase
        .from('categories')
        .upsert({
          user_id: userId,
          local_id: action.entityId,
          name: payload.name,
          icon: payload.icon || null,
          color: payload.color || null,
          is_default: payload.isDefault || false,
          is_hidden: payload.isHidden || false,
          sort_order: payload.order || 0,
          deleted_at: payload._deleted ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,local_id',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error pushing category:', error);
        return false;
      }

      await updateCategorySyncStatus(action.entityId, 'synced', data.id);
      return true;
    }

    case 'delete': {
      const { error } = await supabase
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('local_id', action.entityId);

      if (error) {
        console.error('Error deleting category:', error);
        return false;
      }

      await updateCategorySyncStatus(action.entityId, 'synced');
      return true;
    }

    default:
      return false;
  }
}

async function pushPreferencesAction(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  action: SyncAction
): Promise<boolean> {
  const payload = action.payload;

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      date_format: payload.dateFormat as string,
      default_currency: payload.defaultCurrency as string,
      theme: payload.theme as string,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error pushing preferences:', error);
    return false;
  }

  return true;
}
