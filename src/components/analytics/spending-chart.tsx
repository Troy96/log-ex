'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MonthlyTrend } from '@/types';
import { Currency } from '@/types';
import { formatCurrency, toDisplayAmount } from '@/config/currencies';
import { format, parseISO } from 'date-fns';

interface SpendingChartProps {
  data: MonthlyTrend[];
  currency: Currency;
}

export function SpendingChart({ data, currency }: SpendingChartProps) {
  const chartData = data.map((item) => ({
    month: format(parseISO(`${item.month}-01`), 'MMM yyyy'),
    total: toDisplayAmount(item.total, currency),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => `${currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$'}${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <p className="font-medium">{payload[0].payload.month}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(data[chartData.indexOf(payload[0].payload)]?.total || 0, currency)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
