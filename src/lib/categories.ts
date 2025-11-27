import type { Category } from '@/lib/types';

// In a real application, this data would likely come from an off-chain database
// or a configuration management system. For this dApp, we are using a simple
// mock file as the single source of truth for categories.
export const mockCategories: Category[] = [
  { id: '1', name: 'Crypto', icon: 'Bitcoin' },
  { id: '2', name: 'Sports', icon: 'Trophy' },
  { id: '3', name: 'Politics', icon: 'Landmark' },
  { id: '4', name: 'eSports', icon: 'Gamepad2' },
  { id: '5', name: 'Science', icon: 'FlaskConical' },
  { id: '6', name: 'Entertainment', icon: 'Film' },
  { id: '7', name: 'World Events', icon: 'Globe' },
];
