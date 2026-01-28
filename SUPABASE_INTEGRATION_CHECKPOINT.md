# Supabase Integration Checkpoint

**Last Updated**: 2026-01-28
**Status**: In Progress (Task 7 of 14)

## Completed Tasks

### Task 1: Install Supabase dependencies ✅
- Installed `@supabase/supabase-js` and `@supabase/ssr`

### Task 2: Create environment variables template ✅
- Created `.env.local.example` with Supabase URL and anon key placeholders

### Task 3: Create Supabase client files ✅
- Created `/src/lib/supabase/client.ts` - Browser client with singleton
- Created `/src/lib/supabase/server.ts` - Server client for middleware

### Task 4: Add sync-related types ✅
- Added to `/src/types/index.ts`:
  - `SyncStatus`, `SyncMetadata`, `SyncOperation`, `SyncTable`
  - `SyncAction` interface
  - `SyncableExpense`, `SyncableCategory` (extended types)
  - `AuthUser`, `AuthState`, `SyncState`

### Task 5: Extend Dexie schema for sync ✅
- Updated `/src/lib/db/index.ts`:
  - Added version 2 schema with sync fields
  - Added `syncQueue` and `syncMeta` tables
  - Added sync queue operations (`addToSyncQueue`, `getSyncQueue`, etc.)
  - Added sync status update functions
  - Added soft delete functions
  - Added `markAllAsPendingSync()` for first-time login
  - Updated `getAllExpenses`, `getExpensesByDateRange`, `getExpensesByCategory`, `getAllCategories`, `getVisibleCategories` to filter deleted items

### Task 6: Create sync library ✅
- Created `/src/lib/sync/queue.ts` - Queue management with intelligent merging
- Created `/src/lib/sync/push.ts` - Push local changes to Supabase
- Created `/src/lib/sync/pull.ts` - Pull remote changes with conflict resolution
- Created `/src/lib/sync/index.ts` - Main sync orchestration and exports

## Remaining Tasks

### Task 7: Create auth hooks and provider
- Create `useAuth.ts`, `useOnlineStatus.ts`, `useSync.ts`
- Create `auth-provider.tsx`

### Task 8: Create auth UI components
- Create `login-form.tsx`
- Create `signup-form.tsx`

### Task 9: Create auth pages and routes
- Create `/src/app/(auth)/login/page.tsx`
- Create `/src/app/(auth)/signup/page.tsx`
- Create `/src/app/(auth)/layout.tsx`
- Create `/src/app/auth/callback/route.ts`

### Task 10: Create middleware for auth
- Create `/src/middleware.ts`

### Task 11: Update useDatabase hooks with sync
- Modify `/src/hooks/useDatabase.ts` to queue sync actions

### Task 12: Update providers with auth and sync
- Add `AuthProvider` and `SyncProvider` to `/src/components/providers.tsx`

### Task 13: Update header with auth UI
- Add user menu, login button, sync status indicator

### Task 14: Update settings page with account section
- Add account section, manual sync button, last sync time

## SQL Schema (Run in Supabase SQL Editor)

```sql
-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('INR', 'USD', 'EUR')),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, local_id)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, local_id)
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  default_currency TEXT NOT NULL DEFAULT 'INR',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_user_updated ON public.expenses(user_id, updated_at);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_timestamp BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_preferences_timestamp BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## To Resume

Run: `Tell Claude to continue from SUPABASE_INTEGRATION_CHECKPOINT.md`

The next step is to create the sync library files in `/src/lib/sync/`.
