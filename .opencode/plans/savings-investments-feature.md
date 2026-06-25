# Savings & Investments Feature Implementation Plan

## 1. New File: `src/config/investmentTypes.ts`

Defines `InvestmentType` enum, metadata, field configs, and auto-calculation formulas.

**Investment types:** `mutual_fund`, `gold`, `fd`, `stocks`, `ppf_epf`, `real_estate`

**Fields per type:**
- All: `name`, `tenure` (years), `return_rate`
- SIP types (MF, Gold, Stocks): `sip` (monthly amount)
- Lumpsum types (FD, Real Estate): `lumpsum` (principal)
- PPF/EPF: `annual_contribution`

**Formulas:**
- SIP: `FV = P × [((1 + r)^n - 1) / r] × (1 + r)` — proper SIP formula
- Lumpsum (FD, Real Estate): `FV = P × (1 + r/100)^t`
- PPF/EPF: Yearly loop with compound + annual contribution

## 2. New Migration: `supabase/migrations/20260625_add_investment_fields.sql`

```sql
ALTER TABLE savings ADD COLUMN IF NOT EXISTS is_investment boolean DEFAULT false;
ALTER TABLE savings ADD COLUMN IF NOT EXISTS investment_type text;
ALTER TABLE savings ADD COLUMN IF NOT EXISTS tenure_years numeric;
```

## 3. Modify: `src/hooks/useSavings.ts`

- Add `is_investment`, `investment_type`, `tenure_years` to `SavingsGoal` interface
- Add `projectedMaturity?: number` as a computed field
- Add `calculateProjectedMaturity(goal: SavingsGoal): number` public method
- Update `SavingsGoalInsert` to omit new fields

## 4. Modify: `src/screens/QSCreateSavingScreen.tsx` (Major)

**Flow:**
1. Type toggle at top: "Saving" | "Investment" (pill buttons)
2. If Investment → show 3×2 grid of investment type cards (icon + label + color)
3. Dynamic form below based on selected type:
   - Name field
   - Tenure (years) field (only for investments)
   - Expected return rate (pre-filled with default, editable)
   - Type-specific amount field (SIP / lumpsum / annual)
   - Target amount (auto-calculated, user can override)
   - Auto-calc card showing projected maturity, updated in real-time
4. Existing fields for regular savings stay unchanged

## 5. Modify: `src/screens/QSProfileScreen.tsx`

- Change section title: "Savings Goals" → "Savings & Investments"
- In each horizontal card, show a type badge:
  - Regular saving: grey `"Saving"` badge
  - Investment: colored badge with investment type label
- Use `investment_type` field to determine badge styling

## 6. Modify: `src/screens/QSSavingDetailsScreen.tsx`

- Show investment type badge in overview
- Display tenure, expected return, projected maturity for investments
- Use icon/color from `INVESTMENT_TYPE_META`

## 7. Styles Updates

**`QSProfile.styles.ts`**: Add `badgeSaving`, `badgeInvestment`, `badgeText` styles
**`QSCreateSaving.styles.ts`**: Add `typeToggle`, `typeGrid`, `typeCard`, `autoCalcCard` styles
**`QSSavingDetails.styles.ts`**: Add investment info section styles
