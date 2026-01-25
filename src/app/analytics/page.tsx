'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenses, useCategories, usePreferences } from '@/hooks/useDatabase';
import { formatCurrency } from '@/config/currencies';
import { getCategoryById } from '@/config/categories';
import {
  calculatePersonalInflation,
  calculateCategorySummary,
  calculateMonthlyTrends,
  calculateAverageMonthlySpending,
} from '@/lib/calculations/inflation';
import { SpendingChart } from '@/components/analytics/spending-chart';
import { CategoryChart } from '@/components/analytics/category-chart';

type TimePeriod = 'month' | 'quarter' | 'year';

export default function AnalyticsPage() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { categories } = useCategories();
  const { preferences } = usePreferences();

  const [period, setPeriod] = useState<TimePeriod>('month');

  const now = new Date();

  const periodDates = useMemo(() => {
    switch (period) {
      case 'month':
        return {
          currentStart: startOfMonth(now),
          currentEnd: endOfMonth(now),
          previousStart: startOfMonth(subMonths(now, 1)),
          previousEnd: endOfMonth(subMonths(now, 1)),
        };
      case 'quarter':
        return {
          currentStart: subMonths(startOfMonth(now), 2),
          currentEnd: endOfMonth(now),
          previousStart: subMonths(startOfMonth(now), 5),
          previousEnd: endOfMonth(subMonths(now, 3)),
        };
      case 'year':
        return {
          currentStart: startOfYear(now),
          currentEnd: endOfYear(now),
          previousStart: startOfYear(subYears(now, 1)),
          previousEnd: endOfYear(subYears(now, 1)),
        };
    }
  }, [period, now]);

  const inflationData = useMemo(() => {
    return calculatePersonalInflation(
      expenses,
      periodDates.currentStart,
      periodDates.currentEnd,
      periodDates.previousStart,
      periodDates.previousEnd
    );
  }, [expenses, periodDates]);

  const categorySummary = useMemo(() => {
    return calculateCategorySummary(
      expenses,
      format(periodDates.currentStart, 'yyyy-MM-dd'),
      format(periodDates.currentEnd, 'yyyy-MM-dd')
    );
  }, [expenses, periodDates]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(expenses, 12);
  }, [expenses]);

  const averageMonthly = useMemo(() => {
    return calculateAverageMonthlySpending(expenses);
  }, [expenses]);

  if (expensesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const periodLabels: Record<TimePeriod, { current: string; previous: string }> = {
    month: { current: 'This Month', previous: 'Last Month' },
    quarter: { current: 'This Quarter', previous: 'Last Quarter' },
    year: { current: 'This Year', previous: 'Last Year' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Track your spending patterns and personal inflation
        </p>
        <Select value={period} onValueChange={(v: TimePeriod) => setPeriod(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {periodLabels[period].current}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inflationData.currentPeriod, preferences.defaultCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {periodLabels[period].previous}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inflationData.previousPeriod, preferences.defaultCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Personal Inflation
              {inflationData.inflationRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                inflationData.inflationRate >= 0
                  ? 'text-destructive'
                  : 'text-green-500'
              }`}
            >
              {inflationData.inflationRate >= 0 ? '+' : ''}
              {inflationData.inflationRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageMonthly, preferences.defaultCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrends.length > 0 ? (
              <SpendingChart
                data={monthlyTrends}
                currency={preferences.defaultCurrency}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySummary.length > 0 ? (
              <CategoryChart
                data={categorySummary}
                currency={preferences.defaultCurrency}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Inflation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {inflationData.byCategory.length > 0 ? (
            <div className="space-y-3">
              {inflationData.byCategory.slice(0, 10).map((item) => {
                const category = getCategoryById(item.category);
                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category?.color || '#6b7280' }}
                      />
                      <span className="font-medium">
                        {category?.name || item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {periodLabels[period].previous}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(
                            item.previousAmount,
                            preferences.defaultCurrency
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {periodLabels[period].current}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(
                            item.currentAmount,
                            preferences.defaultCurrency
                          )}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 min-w-20 justify-end ${
                          item.changePercent >= 0
                            ? 'text-destructive'
                            : 'text-green-500'
                        }`}
                      >
                        {item.changePercent >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {Math.abs(item.changePercent).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No data to compare. Add expenses to see category changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
