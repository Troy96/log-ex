import { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'housing',
    name: 'Housing',
    icon: 'Home',
    color: '#3b82f6', // blue-500
    isDefault: true,
    isHidden: false,
    order: 0,
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: 'Car',
    color: '#8b5cf6', // violet-500
    isDefault: true,
    isHidden: false,
    order: 1,
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'UtensilsCrossed',
    color: '#f97316', // orange-500
    isDefault: true,
    isHidden: false,
    order: 2,
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'Zap',
    color: '#eab308', // yellow-500
    isDefault: true,
    isHidden: false,
    order: 3,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'Heart',
    color: '#ef4444', // red-500
    isDefault: true,
    isHidden: false,
    order: 4,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Gamepad2',
    color: '#ec4899', // pink-500
    isDefault: true,
    isHidden: false,
    order: 5,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#14b8a6', // teal-500
    isDefault: true,
    isHidden: false,
    order: 6,
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    color: '#6366f1', // indigo-500
    isDefault: true,
    isHidden: false,
    order: 7,
  },
  {
    id: 'personal',
    name: 'Personal Care',
    icon: 'User',
    color: '#a855f7', // purple-500
    isDefault: true,
    isHidden: false,
    order: 8,
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#6b7280', // gray-500
    isDefault: true,
    isHidden: false,
    order: 9,
  },
];

export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find((cat) => cat.id === id);
};

export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || '#6b7280';
};
