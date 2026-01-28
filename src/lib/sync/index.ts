import { pushChanges } from './push';
import { pullChanges } from './pull';
import { getQueueCount, clearQueue } from './queue';
import { updateSyncMeta, getSyncMeta, markAllAsPendingSync } from '@/lib/db';

export { queueSyncAction, getPendingActions, getQueueCount, clearQueue } from './queue';
export { pushChanges } from './push';
export { pullChanges } from './pull';

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: {
    expenses: number;
    categories: number;
    preferences: boolean;
  };
  errors: string[];
}

/**
 * Performs a full sync: push local changes, then pull remote changes
 */
export async function sync(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: 0,
    pulled: {
      expenses: 0,
      categories: 0,
      preferences: false,
    },
    errors: [],
  };

  // Push local changes first
  const pushResult = await pushChanges(userId);
  result.pushed = pushResult.pushed;
  if (!pushResult.success) {
    result.success = false;
    result.errors.push(...pushResult.errors);
  }

  // Then pull remote changes
  const pullResult = await pullChanges(userId);
  result.pulled = pullResult.pulled;
  if (!pullResult.success) {
    result.success = false;
    result.errors.push(...pullResult.errors);
  }

  return result;
}

/**
 * Initialize sync for a user (call on first login or when linking account)
 */
export async function initializeSync(userId: string): Promise<void> {
  // Mark all local data as pending sync
  await markAllAsPendingSync();

  // Set user ID in sync meta
  await updateSyncMeta({ userId });
}

/**
 * Clear sync state (call on logout)
 */
export async function clearSyncState(): Promise<void> {
  await clearQueue();
  await updateSyncMeta({ lastSyncAt: null, userId: null });
}

/**
 * Check if there are pending changes to sync
 */
export async function hasPendingChanges(): Promise<boolean> {
  const count = await getQueueCount();
  return count > 0;
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<string | null> {
  const meta = await getSyncMeta();
  return meta?.lastSyncAt || null;
}
