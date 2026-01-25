import { Expense, InflationData, CategorySummary, MonthlyTrend, PeriodComparison } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export function calculatePersonalInflation(
  expenses: Expense[],
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  previousPeriodStart: Date,
  previousPeriodEnd: Date
): InflationData {
  const currentStart = format(currentPeriodStart, 'yyyy-MM-dd');
  const currentEnd = format(currentPeriodEnd, 'yyyy-MM-dd');
  const previousStart = format(previousPeriodStart, 'yyyy-MM-dd');
  const previousEnd = format(previousPeriodEnd, 'yyyy-MM-dd');

  const currentExpenses = expenses.filter(
    (e) => e.date >= currentStart && e.date <= currentEnd
  );
  const previousExpenses = expenses.filter(
    (e) => e.date >= previousStart && e.date <= previousEnd
  );

  const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate by category
  const currentByCategory: Record<string, number> = {};
  const previousByCategory: Record<string, number> = {};

  currentExpenses.forEach((e) => {
    currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
  });

  previousExpenses.forEach((e) => {
    previousByCategory[e.category] = (previousByCategory[e.category] || 0) + e.amount;
  });

  // Get all unique categories
  const allCategories = new Set([
    ...Object.keys(currentByCategory),
    ...Object.keys(previousByCategory),
  ]);

  const byCategory = Array.from(allCategories).map((category) => {
    const currentAmount = currentByCategory[category] || 0;
    const previousAmount = previousByCategory[category] || 0;
    const changePercent =
      previousAmount > 0
        ? ((currentAmount - previousAmount) / previousAmount) * 100
        : currentAmount > 0
        ? 100
        : 0;

    return {
      category,
      currentAmount,
      previousAmount,
      changePercent,
    };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const inflationRate =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  return {
    currentPeriod: currentTotal,
    previousPeriod: previousTotal,
    inflationRate,
    byCategory,
  };
}

export function calculateCategorySummary(
  expenses: Expense[],
  startDate: string,
  endDate: string
): CategorySummary[] {
  const filteredExpenses = expenses.filter(
    (e) => e.date >= startDate && e.date <= endDate
  );

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals: Record<string, { total: number; count: number }> = {};

  filteredExpenses.forEach((e) => {
    if (!categoryTotals[e.category]) {
      categoryTotals[e.category] = { total: 0, count: 0 };
    }
    categoryTotals[e.category].total += e.amount;
    categoryTotals[e.category].count += 1;
  });

  return Object.entries(categoryTotals)
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculateMonthlyTrends(
  expenses: Expense[],
  months: number = 12
): MonthlyTrend[] {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, months - 1));
  const endDate = endOfMonth(now);

  const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });

  return monthsInRange.map((monthDate) => {
    const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    const month = format(monthDate, 'yyyy-MM');

    const monthExpenses = expenses.filter(
      (e) => e.date >= monthStart && e.date <= monthEnd
    );

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return { month, total, byCategory };
  });
}

export function calculatePeriodComparison(
  expenses: Expense[],
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): PeriodComparison {
  const period1Expenses = expenses.filter(
    (e) => e.date >= period1Start && e.date <= period1End
  );
  const period2Expenses = expenses.filter(
    (e) => e.date >= period2Start && e.date <= period2End
  );

  const period1Total = period1Expenses.reduce((sum, e) => sum + e.amount, 0);
  const period2Total = period2Expenses.reduce((sum, e) => sum + e.amount, 0);

  const change = period1Total - period2Total;
  const changePercent =
    period2Total > 0 ? ((period1Total - period2Total) / period2Total) * 100 : 0;

  return {
    period1: { start: period1Start, end: period1End, total: period1Total },
    period2: { start: period2Start, end: period2End, total: period2Total },
    change,
    changePercent,
  };
}

export function getTopSpendingCategories(
  expenses: Expense[],
  limit: number = 5
): Array<{ category: string; amount: number }> {
  const categoryTotals: Record<string, number> = {};

  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function calculateAverageMonthlySpending(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;

  const monthlyTotals: Record<string, number> = {};

  expenses.forEach((e) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
  });

  const months = Object.keys(monthlyTotals).length;
  const total = Object.values(monthlyTotals).reduce((sum, v) => sum + v, 0);

  return months > 0 ? total / months : 0;
}
