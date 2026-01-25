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
  deleteExpense,
  getAllCategories,
  getVisibleCategories,
  updateCategory,
  addCategory,
  getPreferences,
  updatePreferences,
  bulkAddExpenses,
} from '@/lib/db';
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
      return addExpense(expense);
    },
    []
  );

  const update = useCallback(async (id: string, updates: Partial<Expense>) => {
    return updateExpense(id, updates);
  }, []);

  const remove = useCallback(async (id: string) => {
    return deleteExpense(id);
  }, []);

  const bulkAdd = useCallback(
    async (expensesList: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      return bulkAddExpenses(expensesList);
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
    return updateCategory(id, updates);
  }, []);

  const add = useCallback(async (category: Omit<Category, 'id'>) => {
    return addCategory(category);
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
    return updatePreferences(updates);
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
