import { Currency } from '@/types';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  smallestUnit: number; // cents = 100, paise = 100
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    smallestUnit: 100, // paise
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    smallestUnit: 100, // cents
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ',',
    smallestUnit: 100, // cents
  },
};

export const formatCurrency = (
  amountInSmallestUnit: number,
  currency: Currency
): string => {
  const config = CURRENCIES[currency];
  const amount = amountInSmallestUnit / config.smallestUnit;

  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  // Replace separators based on currency config
  let result = formattedNumber;
  if (config.thousandsSeparator !== ',' || config.decimalSeparator !== '.') {
    result = formattedNumber
      .replace(/,/g, 'THOUSANDS')
      .replace(/\./g, config.decimalSeparator)
      .replace(/THOUSANDS/g, config.thousandsSeparator);
  }

  return config.symbolPosition === 'before'
    ? `${config.symbol}${result}`
    : `${result} ${config.symbol}`;
};

export const parseAmount = (value: string, currency: Currency): number => {
  const config = CURRENCIES[currency];
  // Remove currency symbol and separators
  const cleanValue = value
    .replace(config.symbol, '')
    .replace(new RegExp(`\\${config.thousandsSeparator}`, 'g'), '')
    .replace(config.decimalSeparator, '.')
    .trim();

  const numericValue = parseFloat(cleanValue);
  if (isNaN(numericValue)) return 0;

  // Convert to smallest unit
  return Math.round(numericValue * config.smallestUnit);
};

export const toDisplayAmount = (
  amountInSmallestUnit: number,
  currency: Currency
): number => {
  const config = CURRENCIES[currency];
  return amountInSmallestUnit / config.smallestUnit;
};

export const toSmallestUnit = (displayAmount: number, currency: Currency): number => {
  const config = CURRENCIES[currency];
  return Math.round(displayAmount * config.smallestUnit);
};
