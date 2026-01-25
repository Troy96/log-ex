import { CSVImportPreset } from '@/types';

export const IMPORT_PRESETS: CSVImportPreset[] = [
  {
    id: 'ynab',
    name: 'YNAB (You Need A Budget)',
    columnMapping: {
      date: 'Date',
      amount: 'Outflow',
      category: 'Category',
      description: 'Memo',
    },
    dateFormat: 'MM/dd/yyyy',
    hasHeader: true,
    delimiter: ',',
    amountMultiplier: 100, // YNAB uses dollars, convert to cents
  },
  {
    id: 'mint',
    name: 'Mint',
    columnMapping: {
      date: 'Date',
      amount: 'Amount',
      category: 'Category',
      description: 'Description',
    },
    dateFormat: 'MM/dd/yyyy',
    hasHeader: true,
    delimiter: ',',
    amountMultiplier: 100,
  },
  {
    id: 'generic',
    name: 'Generic CSV',
    columnMapping: {
      date: '',
      amount: '',
      category: '',
      description: '',
    },
    dateFormat: 'yyyy-MM-dd',
    hasHeader: true,
    delimiter: ',',
    amountMultiplier: 100,
  },
];

export function getPresetById(id: string): CSVImportPreset | undefined {
  return IMPORT_PRESETS.find((p) => p.id === id);
}

// Category mapping from common budget app categories to our categories
export const CATEGORY_MAPPINGS: Record<string, string> = {
  // YNAB common categories
  'immediate obligations': 'utilities',
  'true expenses': 'other',
  'debt payments': 'other',
  'quality of life goals': 'personal',
  'just for fun': 'entertainment',
  'groceries': 'food',
  'restaurants': 'food',
  'dining out': 'food',
  'auto & transport': 'transportation',
  'gas & fuel': 'transportation',
  'parking': 'transportation',
  'public transit': 'transportation',
  'auto insurance': 'transportation',
  'auto maintenance': 'transportation',
  'rent': 'housing',
  'mortgage': 'housing',
  'home insurance': 'housing',
  'home maintenance': 'housing',
  'electricity': 'utilities',
  'gas': 'utilities',
  'water': 'utilities',
  'internet': 'utilities',
  'phone': 'utilities',
  'mobile phone': 'utilities',
  'health insurance': 'healthcare',
  'doctor': 'healthcare',
  'pharmacy': 'healthcare',
  'medical': 'healthcare',
  'gym': 'personal',
  'personal care': 'personal',
  'clothing': 'shopping',
  'shopping': 'shopping',
  'gifts': 'shopping',
  'entertainment': 'entertainment',
  'movies': 'entertainment',
  'music': 'entertainment',
  'games': 'entertainment',
  'hobbies': 'entertainment',
  'vacation': 'entertainment',
  'travel': 'entertainment',
  'education': 'education',
  'books': 'education',
  'tuition': 'education',
  'subscriptions': 'entertainment',

  // Mint common categories (unique ones not already above)
  'food & dining': 'food',
  'bills & utilities': 'utilities',
  'home': 'housing',
  'health & fitness': 'healthcare',
  'uncategorized': 'other',
  'transfer': 'other',
  'income': 'other',
};

export function mapCategory(originalCategory: string): string {
  const normalized = originalCategory.toLowerCase().trim();

  // Direct match
  if (CATEGORY_MAPPINGS[normalized]) {
    return CATEGORY_MAPPINGS[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default to 'other'
  return 'other';
}
