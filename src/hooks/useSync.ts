'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncState } from '@/types';
import {
  sync,
  initializeSync,
  clearSyncState,
  hasPendingChanges,
  getLastSyncTime,
  getQueueCount,
} from '@/lib/sync';
import { useOnlineStatus } from './useOnlineStatus';

const SYNC_INTERVAL = 30000; // 30 seconds

export function useSync(userId: string | null): SyncState & {
  triggerSync: () => Promise<void>;
  initialize: () => Promise<void>;
  clear: () => Promise<void>;
} {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load initial state
  useEffect(() => {
    async function loadState() {
      const [lastSync, count] = await Promise.all([
        getLastSyncTime(),
        getQueueCount(),
      ]);
      if (isMountedRef.current) {
        setLastSyncAt(lastSync);
        setPendingCount(count);
      }
    }
    loadState();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!userId || !isOnline || isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await sync(userId);

      if (isMountedRef.current) {
        if (!result.success && result.errors.length > 0) {
          setError(result.errors[0]);
        }

        const [lastSync, count] = await Promise.all([
          getLastSyncTime(),
          getQueueCount(),
        ]);
        setLastSyncAt(lastSync);
        setPendingCount(count);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [userId, isOnline, isSyncing]);

  const initialize = useCallback(async () => {
    if (!userId) return;
    await initializeSync(userId);
    await triggerSync();
  }, [userId, triggerSync]);

  const clear = useCallback(async () => {
    await clearSyncState();
    setLastSyncAt(null);
    setPendingCount(0);
    setError(null);
  }, []);

  // Auto-sync on interval when online and authenticated
  useEffect(() => {
    if (!userId || !isOnline) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    // Initial sync
    triggerSync();

    // Set up interval
    syncIntervalRef.current = setInterval(() => {
      triggerSync();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [userId, isOnline, triggerSync]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && userId) {
      triggerSync();
    }
  }, [isOnline, userId, triggerSync]);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getQueueCount();
      if (isMountedRef.current) {
        setPendingCount(count);
      }
    };

    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isSyncing,
    lastSyncAt,
    pendingCount,
    error,
    triggerSync,
    initialize,
    clear,
  };
}
