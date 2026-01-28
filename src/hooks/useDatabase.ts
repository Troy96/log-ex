'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  initializeDatabase,
  getAllExpenses,
  getExpensesByDateRange,
  addExpense,
  updateExpense,
  softDeleteExpense,
  getAllCategories,
  getVisibleCategories,
  updateCategory,
  addCategory,
  softDeleteCategory,
  getPreferences,
  updatePreferences,
  bulkAddExpenses,
  getExpenseById,
} from '@/lib/db';
import { queueSyncAction } from '@/lib/sync';
import { Expense, Category, UserPreferences, Currency } from '@/types';

export function useInitDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(() => setIsReady(true))
      .catch((err) => setError(err));
  }, []);

  return { isReady, error };
}

export function useExpenses() {
  const expenses = useLiveQuery(() => getAllExpenses(), []);

  const add = useCallback(
    async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = await addExpense(expense);
      const created = await getExpenseById(id);
      if (created) {
        await queueSyncAction('expenses', 'create', id, { ...created });
      }
      return id;
    },
    []
  );

  const update = useCallback(async (id: string, updates: Partial<Expense>) => {
    await updateExpense(id, updates);
    const updated = await getExpenseById(id);
    if (updated) {
      await queueSyncAction('expenses', 'update', id, { ...updated });
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await softDeleteExpense(id);
    await queueSyncAction('expenses', 'delete', id, { _deleted: true });
  }, []);

  const bulkAdd = useCallback(
    async (expensesList: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const count = await bulkAddExpenses(expensesList);
      // Note: Bulk imports are queued individually when sync is triggered
      return count;
    },
    []
  );

  return {
    expenses: expenses || [],
    isLoading: expenses === undefined,
    add,
    update,
    remove,
    bulkAdd,
  };
}

export function useExpensesByDateRange(startDate: string, endDate: string) {
  const expenses = useLiveQuery(
    () => getExpensesByDateRange(startDate, endDate),
    [startDate, endDate]
  );

  return {
    expenses: expenses || [],
    isLoading: expenses === undefined,
  };
}

export function useCategories() {
  const categories = useLiveQuery(() => getAllCategories(), []);
  const visibleCategories = useLiveQuery(() => getVisibleCategories(), []);

  const update = useCallback(async (id: string, updates: Partial<Category>) => {
    await updateCategory(id, updates);
    const updated = categories?.find((c) => c.id === id);
    if (updated) {
      await queueSyncAction('categories', 'update', id, { ...updated, ...updates });
    }
  }, [categories]);

  const add = useCallback(async (category: Omit<Category, 'id'>) => {
    const id = await addCategory(category);
    await queueSyncAction('categories', 'create', id, { ...category, id });
    return id;
  }, []);

  const reorder = useCallback(
    async (categoryId: string, newOrder: number) => {
      if (!categories) return;

      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      const oldOrder = category.order;
      const updates: Promise<void>[] = [];

      categories.forEach((cat) => {
        if (cat.id === categoryId) {
          updates.push(updateCategory(cat.id, { order: newOrder }));
        } else if (oldOrder < newOrder) {
          // Moving down - shift items up
          if (cat.order > oldOrder && cat.order <= newOrder) {
            updates.push(updateCategory(cat.id, { order: cat.order - 1 }));
          }
        } else {
          // Moving up - shift items down
          if (cat.order >= newOrder && cat.order < oldOrder) {
            updates.push(updateCategory(cat.id, { order: cat.order + 1 }));
          }
        }
      });

      await Promise.all(updates);
    },
    [categories]
  );

  return {
    categories: categories || [],
    visibleCategories: visibleCategories || [],
    isLoading: categories === undefined,
    update,
    add,
    reorder,
  };
}

export function usePreferences() {
  const preferences = useLiveQuery(() => getPreferences(), []);

  const update = useCallback(async (updates: Partial<UserPreferences>) => {
    await updatePreferences(updates);
    await queueSyncAction('preferences', 'update', 'user-preferences', updates);
  }, []);

  return {
    preferences: preferences || {
      id: 'user-preferences',
      dateFormat: 'DD/MM/YYYY' as const,
      defaultCurrency: 'INR' as Currency,
      theme: 'system' as const,
    },
    isLoading: preferences === undefined,
    update,
  };
}
