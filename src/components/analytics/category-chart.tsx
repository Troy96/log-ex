'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CategorySummary, Currency } from '@/types';
import { formatCurrency } from '@/config/currencies';
import { getCategoryById } from '@/config/categories';

interface CategoryChartProps {
  data: CategorySummary[];
  currency: Currency;
}

export function CategoryChart({ data, currency }: CategoryChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    name: getCategoryById(item.category)?.name || item.category,
    value: item.total,
    color: getCategoryById(item.category)?.color || '#6b7280',
    percentage: item.percentage,
  }));

  // Add "Other" category if there are more than 8 categories
  if (data.length > 8) {
    const otherTotal = data.slice(8).reduce((sum, item) => sum + item.total, 0);
    const otherPercentage = data.slice(8).reduce((sum, item) => sum + item.percentage, 0);
    chartData.push({
      name: 'Other',
      value: otherTotal,
      color: '#9ca3af',
      percentage: otherPercentage,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(data.value, currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.percentage.toFixed(1)}%
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
