'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCategories, usePreferences } from '@/hooks/useDatabase';
import { Expense, Currency, RecurringFrequency } from '@/types';
import { CURRENCIES, toSmallestUnit, toDisplayAmount } from '@/config/currencies';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExpenseFormProps) {
  const { visibleCategories } = useCategories();
  const { preferences } = usePreferences();

  const [date, setDate] = useState<Date>(
    expense ? new Date(expense.date) : new Date()
  );
  const [amount, setAmount] = useState(
    expense ? toDisplayAmount(expense.amount, expense.currency).toString() : ''
  );
  const [currency, setCurrency] = useState<Currency>(
    expense?.currency || preferences.defaultCurrency
  );
  const [category, setCategory] = useState(expense?.category || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    RecurringFrequency | undefined
  >(expense?.recurringFrequency);

  // Update currency when preferences load
  useEffect(() => {
    if (!expense && preferences.defaultCurrency) {
      setCurrency(preferences.defaultCurrency);
    }
  }, [expense, preferences.defaultCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    onSubmit({
      amount: toSmallestUnit(amountValue, currency),
      currency,
      category,
      description,
      date: format(date, 'yyyy-MM-dd'),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
              required
            />
            <Select
              value={currency}
              onValueChange={(value: Currency) => setCurrency(value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {visibleCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Recurring */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="isRecurring" className="font-normal">
            This is a recurring expense
          </Label>
        </div>

        {isRecurring && (
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={recurringFrequency}
              onValueChange={(value: RecurringFrequency) =>
                setRecurringFrequency(value)
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !category || !amount}>
          {isSubmitting ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
