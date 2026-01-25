import { Currency, ParsedCSVRow, CSVColumnMapping } from '@/types';
import { parse } from 'date-fns';

export interface ParseOptions {
  hasHeader: boolean;
  delimiter: string;
  dateFormat: string;
  columnMapping: CSVColumnMapping;
  defaultCurrency: Currency;
  amountMultiplier: number;
}

export interface ParseResult {
  rows: ParsedCSVRow[];
  errors: Array<{ row: number; message: string }>;
  headers: string[];
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSV(content: string, options: ParseOptions): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const errors: Array<{ row: number; message: string }> = [];
  const rows: ParsedCSVRow[] = [];

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'Empty file' }], headers: [] };
  }

  const headers = parseCSVLine(lines[0], options.delimiter);
  const dataStartIndex = options.hasHeader ? 1 : 0;

  // If no header, create column indices as headers
  const effectiveHeaders = options.hasHeader
    ? headers
    : headers.map((_, i) => `Column ${i + 1}`);

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line, options.delimiter);
    const rawData: Record<string, string> = {};

    effectiveHeaders.forEach((header, index) => {
      rawData[header] = values[index] || '';
    });

    try {
      // Parse date
      const dateValue = rawData[options.columnMapping.date];
      if (!dateValue) {
        errors.push({ row: i + 1, message: 'Missing date' });
        continue;
      }

      let parsedDate: Date;
      try {
        parsedDate = parse(dateValue, options.dateFormat, new Date());
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        errors.push({ row: i + 1, message: `Invalid date format: ${dateValue}` });
        continue;
      }

      // Parse amount
      const amountValue = rawData[options.columnMapping.amount];
      if (!amountValue) {
        errors.push({ row: i + 1, message: 'Missing amount' });
        continue;
      }

      // Clean amount string - remove currency symbols, handle negative/parentheses
      let cleanAmount = amountValue
        .replace(/[₹$€,\s]/g, '')
        .replace(/\(([^)]+)\)/, '-$1'); // Convert (100) to -100

      const amount = parseFloat(cleanAmount);
      if (isNaN(amount)) {
        errors.push({ row: i + 1, message: `Invalid amount: ${amountValue}` });
        continue;
      }

      // Parse category (optional)
      const category = options.columnMapping.category
        ? rawData[options.columnMapping.category] || 'other'
        : 'other';

      // Parse description (optional)
      const description = options.columnMapping.description
        ? rawData[options.columnMapping.description] || ''
        : '';

      // Parse currency (optional, with default)
      let currency = options.defaultCurrency;
      if (options.columnMapping.currency) {
        const currencyValue = rawData[options.columnMapping.currency]?.toUpperCase();
        if (currencyValue === 'INR' || currencyValue === 'USD' || currencyValue === 'EUR') {
          currency = currencyValue as Currency;
        }
      }

      rows.push({
        date: parsedDate.toISOString().split('T')[0],
        amount: Math.round(Math.abs(amount) * options.amountMultiplier),
        category: category.toLowerCase().replace(/\s+/g, '-'),
        description,
        currency,
        rawData,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { rows, errors, headers: effectiveHeaders };
}

export function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] || '';
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delim;
    }
  }

  return detected;
}

export function detectDateFormat(sampleDates: string[]): string {
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MM-dd-yyyy',
    'dd-MM-yyyy',
    'M/d/yyyy',
    'd/M/yyyy',
  ];

  for (const format of formats) {
    let allValid = true;
    for (const dateStr of sampleDates.slice(0, 5)) {
      try {
        const parsed = parse(dateStr, format, new Date());
        if (isNaN(parsed.getTime())) {
          allValid = false;
          break;
        }
      } catch {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      return format;
    }
  }

  return 'yyyy-MM-dd';
}
