export type NwsType = 'needs' | 'wants' | 'savings';

export const PARENT_CATEGORY_NWS: Record<string, NwsType> = {
  Housing: 'needs',
  Utilities: 'needs',
  Groceries: 'needs',
  Health: 'needs',
  Education: 'needs',
  'Bills & Fees': 'needs',
  Insurance: 'needs',
  Taxes: 'needs',
  'Postal & Courier': 'needs',
  'Food & Dining': 'wants',
  Shopping: 'wants',
  Entertainment: 'wants',
  Travel: 'wants',
  'Personal Care': 'wants',
  'Gifts & Donations': 'wants',
  'Sports & Athletics': 'wants',
  Subscriptions: 'wants',
  Investment: 'savings',
  'Loans & Debt': 'savings',
};

const SUBCATEGORY_NWS_OVERRIDES: Record<string, NwsType> = {
  'Car Wash': 'wants',
  'Vehicle Accessories': 'wants',
  Toys: 'wants',
  Grooming: 'wants',
  'Toys & Accessories': 'wants',
  Advertising: 'wants',
  'Business Meals': 'wants',
  'Gym & Fitness': 'wants',
  'Pick-up Games': 'wants',
  'Football & Equipment': 'wants',
};

export function classifyNws(
  categoryName?: string | null,
  subcategoryName?: string | null,
  savingsId?: string | null,
): NwsType | null {
  if (savingsId) return 'savings';

  if (subcategoryName) {
    const override = SUBCATEGORY_NWS_OVERRIDES[subcategoryName];
    if (override) return override;
  }

  if (categoryName) {
    return PARENT_CATEGORY_NWS[categoryName] ?? null;
  }

  return null;
}

export const NWS_DISPLAY: Record<NwsType, { label: string; color: string; lightColor: string }> = {
  needs: { label: 'Need', color: '#4F46E5', lightColor: '#4F46E518' },
  wants: { label: 'Want', color: '#EC4899', lightColor: '#EC489918' },
  savings: { label: 'Savings', color: '#10B981', lightColor: '#10B98118' },
};

export const NWS_OPTIONS = [
  { value: null as NwsType | null, label: 'Auto' },
  { value: 'needs' as NwsType, label: 'Need', color: '#4F46E5' },
  { value: 'wants' as NwsType, label: 'Want', color: '#EC4899' },
  { value: 'savings' as NwsType, label: 'Savings', color: '#10B981' },
] as const;
