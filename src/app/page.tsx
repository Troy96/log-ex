'use client';

import { useExpenses, useCategories, usePreferences } from '@/hooks/useDatabase';
import { formatCurrency } from '@/config/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Receipt, Tags, Plus } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function Dashboard() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { preferences, isLoading: preferencesLoading } = usePreferences();

  const isLoading = expensesLoading || categoriesLoading || preferencesLoading;

  // Calculate current month totals
  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

  const currentMonthExpenses = expenses.filter(
    (e) => e.date >= currentMonthStart && e.date <= currentMonthEnd
  );
  const lastMonthExpenses = expenses.filter(
    (e) => e.date >= lastMonthStart && e.date <= lastMonthEnd
  );

  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthOverMonthChange =
    lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

  // Get category breakdown
  const categoryTotals = currentMonthExpenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, total]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        name: category?.name || categoryId,
        total,
        color: category?.color || '#6b7280',
      };
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/expenses?action=add">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/import">Import CSV</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthTotal, preferences.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(lastMonthTotal, preferences.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastMonthExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Change</CardTitle>
            {monthOverMonthChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                monthOverMonthChange >= 0 ? 'text-destructive' : 'text-green-500'
              }`}
            >
              {monthOverMonthChange >= 0 ? '+' : ''}
              {monthOverMonthChange.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryTotals).length}
            </div>
            <p className="text-xs text-muted-foreground">active this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No expenses recorded this month. Start by adding an expense or
              importing data.
            </p>
          ) : (
            <div className="space-y-4">
              {topCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(cat.total, preferences.defaultCurrency)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: cat.color,
                          width: `${(cat.total / currentMonthTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Expenses</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No expenses yet. Add your first expense to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => {
                const category = categories.find(
                  (c) => c.id === expense.category
                );
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: category?.color || '#6b7280',
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {expense.description || category?.name || 'Expense'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
