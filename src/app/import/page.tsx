'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExpenses, usePreferences } from '@/hooks/useDatabase';
import { CSVColumnMapping, Currency, ParsedCSVRow } from '@/types';
import {
  parseCSV,
  detectDelimiter,
  detectDateFormat,
  ParseOptions,
} from '@/lib/import/csv-parser';
import { IMPORT_PRESETS, mapCategory } from '@/lib/import/presets';
import { formatCurrency } from '@/config/currencies';

type ImportStep = 'upload' | 'configure' | 'preview' | 'complete';

export default function ImportPage() {
  const { bulkAdd } = useExpenses();
  const { preferences } = usePreferences();

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [presetId, setPresetId] = useState<string>('generic');
  const [columnMapping, setColumnMapping] = useState<CSVColumnMapping>({
    date: '',
    amount: '',
    category: '',
    description: '',
  });
  const [dateFormat, setDateFormat] = useState('yyyy-MM-dd');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    Array<{ row: number; message: string }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        setFileName(file.name);

        // Auto-detect delimiter
        const detectedDelimiter = detectDelimiter(content);
        setDelimiter(detectedDelimiter);

        // Parse headers
        const firstLine = content.split(/\r?\n/)[0];
        const detectedHeaders = firstLine
          .split(detectedDelimiter)
          .map((h) => h.trim().replace(/^"|"$/g, ''));
        setHeaders(detectedHeaders);

        // Try to detect date format from first few data rows
        const lines = content.split(/\r?\n/).slice(1, 6);
        const sampleDates = lines
          .map((line) => line.split(detectedDelimiter)[0]?.trim().replace(/^"|"$/g, ''))
          .filter(Boolean);
        const detectedFormat = detectDateFormat(sampleDates);
        setDateFormat(detectedFormat);

        setStep('configure');
      };
      reader.readAsText(file);
    },
    []
  );

  const handlePresetChange = (presetId: string) => {
    setPresetId(presetId);
    const preset = IMPORT_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== 'generic') {
      setColumnMapping(preset.columnMapping);
      setDateFormat(preset.dateFormat);
      setDelimiter(preset.delimiter);
      setHasHeader(preset.hasHeader);
    }
  };

  const handleColumnChange = (
    field: keyof CSVColumnMapping,
    value: string
  ) => {
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    const options: ParseOptions = {
      hasHeader,
      delimiter,
      dateFormat,
      columnMapping,
      defaultCurrency: preferences.defaultCurrency,
      amountMultiplier: 100,
    };

    const result = parseCSV(fileContent, options);

    // Apply category mapping
    const mappedRows = result.rows.map((row) => ({
      ...row,
      category: mapCategory(row.rawData[columnMapping.category || ''] || 'other'),
    }));

    setParsedRows(mappedRows);
    setParseErrors(result.errors);
    setStep('preview');
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const expensesToImport = parsedRows.map((row) => ({
        amount: row.amount,
        currency: row.currency,
        category: row.category,
        description: row.description,
        date: row.date,
        isRecurring: false,
      }));

      const count = await bulkAdd(expensesToImport);
      setImportedCount(count);
      setStep('complete');
      toast.success(`Successfully imported ${count} expenses`);
    } catch {
      toast.error('Failed to import expenses');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFileContent('');
    setFileName('');
    setHeaders([]);
    setPresetId('generic');
    setColumnMapping({ date: '', amount: '', category: '', description: '' });
    setParsedRows([]);
    setParseErrors([]);
    setImportedCount(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Import expenses from CSV files exported from YNAB, Mint, or other apps
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'configure', 'preview', 'complete'] as ImportStep[]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : i < ['upload', 'configure', 'preview', 'complete'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          )
        )}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports exports from YNAB, Mint, and generic CSV files
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configure Step */}
      {step === 'configure' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configure Import: {fileName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Selection */}
            <div className="space-y-2">
              <Label>Import Preset</Label>
              <Select value={presetId} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column Mapping */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Column *</Label>
                <Select
                  value={columnMapping.date}
                  onValueChange={(v) => handleColumnChange('date', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Column *</Label>
                <Select
                  value={columnMapping.amount}
                  onValueChange={(v) => handleColumnChange('amount', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category Column</Label>
                <Select
                  value={columnMapping.category || 'none'}
                  onValueChange={(v) =>
                    handleColumnChange('category', v === 'none' ? '' : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Column</Label>
                <Select
                  value={columnMapping.description || 'none'}
                  onValueChange={(v) =>
                    handleColumnChange('description', v === 'none' ? '' : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Format */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="M/d/yyyy">M/D/YYYY</SelectItem>
                    <SelectItem value="d/M/yyyy">D/M/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Delimiter</Label>
                <Select value={delimiter} onValueChange={setDelimiter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (,)</SelectItem>
                    <SelectItem value=";">Semicolon (;)</SelectItem>
                    <SelectItem value="\t">Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasHeader"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hasHeader" className="font-normal">
                First row contains column headers
              </Label>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!columnMapping.date || !columnMapping.amount}
              >
                Preview Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <Badge variant="secondary">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {parsedRows.length} valid rows
              </Badge>
              {parseErrors.length > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {parseErrors.length} errors
                </Badge>
              )}
            </div>

            {/* Errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="font-medium text-destructive mb-2">
                  The following rows could not be parsed:
                </p>
                <ul className="text-sm space-y-1">
                  {parseErrors.slice(0, 5).map((err) => (
                    <li key={err.row}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...and {parseErrors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.amount, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {parsedRows.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Showing 10 of {parsedRows.length} rows
              </p>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('configure')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || isImporting}
              >
                {isImporting
                  ? 'Importing...'
                  : `Import ${parsedRows.length} Expenses`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Successfully imported {importedCount} expenses
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button asChild>
                <a href="/expenses">View Expenses</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
