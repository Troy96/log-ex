import { v4 as uuidv4 } from 'uuid';
import {
  db,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
} from '@/lib/db';
import { SyncAction, SyncOperation, SyncTable } from '@/types';

const MAX_RETRIES = 3;

export async function queueSyncAction(
  table: SyncTable,
  operation: SyncOperation,
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Check for existing action on this entity
  const queue = await getSyncQueue();
  const existingAction = queue.find(
    (a) => a.table === table && a.entityId === entityId
  );

  if (existingAction) {
    // Merge operations intelligently
    if (operation === 'delete') {
      // Delete supersedes create/update
      if (existingAction.operation === 'create') {
        // If created locally and then deleted, just remove from queue
        await removeFromSyncQueue(existingAction.id);
        return;
      }
      // Update existing action to delete
      await updateSyncQueueItem(existingAction.id, {
        operation: 'delete',
        payload,
        timestamp: new Date().toISOString(),
      });
    } else if (operation === 'update' && existingAction.operation !== 'delete') {
      // Merge update payload
      await updateSyncQueueItem(existingAction.id, {
        payload: { ...existingAction.payload, ...payload },
        timestamp: new Date().toISOString(),
      });
    }
    // If existing is delete and new is update, ignore (can't update deleted)
    return;
  }

  // Add new action to queue
  const action: SyncAction = {
    id: uuidv4(),
    table,
    operation,
    entityId,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  await addToSyncQueue(action);
}

export async function getPendingActions(): Promise<SyncAction[]> {
  return getSyncQueue();
}

export async function markActionComplete(actionId: string): Promise<void> {
  await removeFromSyncQueue(actionId);
}

export async function markActionFailed(actionId: string): Promise<boolean> {
  const queue = await getSyncQueue();
  const action = queue.find((a) => a.id === actionId);

  if (!action) return false;

  const newRetryCount = action.retryCount + 1;

  if (newRetryCount >= MAX_RETRIES) {
    // Max retries exceeded, remove from queue
    await removeFromSyncQueue(actionId);
    return false;
  }

  await updateSyncQueueItem(actionId, {
    retryCount: newRetryCount,
  });

  return true;
}

export async function getQueueCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

export async function clearQueue(): Promise<void> {
  const queue = await getSyncQueue();
  for (const action of queue) {
    await removeFromSyncQueue(action.id);
  }
}
