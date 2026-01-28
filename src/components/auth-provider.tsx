'use client';

import { createContext, useContext, useEffect, useCallback } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AuthUser, SyncState } from '@/types';

interface AuthContextValue {
  // Auth state
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;

  // Sync state
  sync: SyncState;
  triggerSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const isOnline = useOnlineStatus();
  const syncState = useSync(auth.user?.id ?? null);

  // Initialize sync when user logs in
  useEffect(() => {
    if (auth.user && !auth.isLoading) {
      syncState.initialize();
    }
  }, [auth.user?.id, auth.isLoading]);

  // Clear sync state when user logs out
  const handleSignOut = useCallback(async () => {
    await syncState.clear();
    await auth.signOut();
  }, [auth, syncState]);

  const value: AuthContextValue = {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isOnline,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: handleSignOut,
    resetPassword: auth.resetPassword,
    sync: {
      isSyncing: syncState.isSyncing,
      lastSyncAt: syncState.lastSyncAt,
      pendingCount: syncState.pendingCount,
      error: syncState.error,
    },
    triggerSync: syncState.triggerSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
