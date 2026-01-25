'use client';

import { useState } from 'react';
import { Download, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useExpenses, useCategories } from '@/hooks/useDatabase';
import { exportAllData, clearAllData } from '@/lib/db';
import { Currency, DateFormat, Theme } from '@/types';
import { CURRENCIES, formatCurrency } from '@/config/currencies';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { preferences, update: updatePreferences, isLoading } = usePreferences();
  const { expenses } = useExpenses();
  const { categories } = useCategories();
  const { setTheme, theme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleCurrencyChange = async (currency: Currency) => {
    try {
      await updatePreferences({ defaultCurrency: currency });
      toast.success('Default currency updated');
    } catch {
      toast.error('Failed to update currency');
    }
  };

  const handleDateFormatChange = async (dateFormat: DateFormat) => {
    try {
      await updatePreferences({ dateFormat });
      toast.success('Date format updated');
    } catch {
      toast.error('Failed to update date format');
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    try {
      setTheme(newTheme);
      await updatePreferences({ theme: newTheme });
    } catch {
      toast.error('Failed to update theme');
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const headers = ['Date', 'Amount', 'Currency', 'Category', 'Description', 'Is Recurring', 'Frequency'];
    const rows = expenses.map((e) => {
      const category = categories.find((c) => c.id === e.category);
      return [
        e.date,
        (e.amount / 100).toFixed(2),
        e.currency,
        category?.name || e.category,
        `"${e.description.replace(/"/g, '""')}"`,
        e.isRecurring ? 'Yes' : 'No',
        e.recurringFrequency || '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-ex-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Expenses exported successfully');
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `log-ex-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        'Are you sure you want to delete ALL data? This action cannot be undone.'
      )
    ) {
      return;
    }

    if (
      !confirm(
        'This will permanently delete all expenses, categories, and settings. Are you absolutely sure?'
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllData();
      toast.success('All data cleared');
      window.location.reload();
    } catch {
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-muted-foreground">
        Customize your preferences and manage your data
      </p>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Configure how Log-Ex works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('system')}
                className="flex-1"
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select
              value={preferences.defaultCurrency}
              onValueChange={(v: Currency) => handleCurrencyChange(v)}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              New expenses will use this currency by default
            </p>
          </div>

          <Separator />

          {/* Date Format */}
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={preferences.dateFormat}
              onValueChange={(v: DateFormat) => handleDateFormatChange(v)}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or manage your expense data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Full Backup (JSON)'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Delete All Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total Expenses</dt>
              <dd className="font-medium">{expenses.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Categories</dt>
              <dd className="font-medium">{categories.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total Spent (All Time)</dt>
              <dd className="font-medium">
                {formatCurrency(
                  expenses.reduce((sum, e) => sum + e.amount, 0),
                  preferences.defaultCurrency
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
