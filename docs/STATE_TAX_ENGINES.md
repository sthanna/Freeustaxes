# State Tax Engines (2024)

This document provides an overview of the state tax engines implemented in `UsTaxes`, ported from the OpenTaxSolver (OTS) C codebase.

## Overview

We have successfully ported and verified tax calculation logic for 8 states for the 2024 tax year. Each engine is implemented in TypeScript within `src/lib/tax-engines/<STATE>/Y2024.ts` and verified against OTS "golden file" examples.

## Supported States

| State | Code | Form | Status | Verified Features |
| :--- | :--- | :--- | :--- | :--- |
| **Massachusetts** | MA | Form 1 | ✅ Verified | 5% Flat Tax, No-Tax Status, Limited Income Credit |
| **New York** | NY | IT-201 | ✅ Verified | Progressive Tax, Standard/itemized Deductions, Household Credit |
| **New Jersey** | NJ | NJ-1040 | ✅ Verified | Progressive Tax, 3 Exemption Types, Property Tax Ded/Credit |
| **Pennsylvania** | PA | PA-40 | ✅ Verified | 3.07% Flat Tax, 8 Income Classes, Tax Forgiveness (Sched SP) |
| **California** | CA | 540 | ✅ Verified | Progressive Tax (9 tiers), Schedule CA Adjustments, Exemption Credits |
| **North Carolina** | NC | D-400 | ✅ Verified | 4.5% Flat Tax, Child Deduction, Standard Deduction (MFJ/S/HOH) |
| **Ohio** | OH | IT 1040 | ✅ Verified | Progressive Tax (3 tiers), Income-Tiered Exemptions, Joint Filing Credit |
| **Virginia** | VA | 760 | ✅ Verified | Progressive Tax (4 tiers), Age/Blind Exemptions, Spouse Tax Adjustment |

## Implementation Details

### Common Structure
Each state engine follows the `TaxEngine` interface:
```typescript
interface TaxEngine<Input, Result> {
  calculate(info: Information): Result
}
```
State-specific inputs are defined in `src/core/data/index.ts` (e.g., `MassachusettsInput`, `NewYorkInput`, etc).

### Verification
Each engine has a corresponding test file `src/lib/tax-engines/<STATE>/tests/Y2024.test.ts` that:
1.  Mocks `Information` with data derived from an OTS example file (e.g., `MA_1_2024_example.txt`).
2.  Runs the `calculate` function.
3.  Asserts that key line items (AGI, Taxable Income, Tax Liability, Refund) match the OTS output exactly.

## Future Work
-   **Integration UI**: Connect these engines to the frontend React forms.
-   **Additional States**: Port remaining states from OTS as needed.
-   **Complex Scenarios**: Add tests for edge cases (e.g., Part-Year Residents, specific credits).
