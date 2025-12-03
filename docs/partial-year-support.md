# Partial Year 1 Timeline Support

## Overview
The retirement timeline now supports **partial Year 1** that spans from the current month to the retirement start month. Subsequent years align to the retirement anniversary month for consistent year-over-year tracking.

## Example Scenario
- **Current Date**: December 2025
- **Retirement Start Date**: August 2028

### Timeline Structure:
- **Year 1**: 12/2025 → 08/2026 (partial year, 9 months)
- **Year 2**: 08/2026 → 08/2027 (full year, 12 months)
- **Year 3**: 08/2027 → 08/2028 (full year, 12 months)
- **Year 4**: 08/2028 → 08/2029 (retirement year, 12 months)
- And so on...

## Changes Made

### Backend Changes (`backend-nestjs/src/retirement/retirement-calculator.service.ts`)

1. **Modified Year Calculation Logic**
   - **Year 1**: Starts from current month/year, ends at retirement start month/year
   - **Subsequent Years**: Aligned to retirement anniversary (same month each year)

2. **Dynamic Month Calculation**
   - Added `monthsInPeriod` calculation to handle partial years
   - Formula: `Math.round((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44))`
   - Monthly loop now iterates for the actual number of months in the period

3. **Updated Display Periods**
   - Period dates now use actual `yearStart` and `yearEnd` values
   - Correctly reflects partial Year 1 and retirement anniversary alignment

### Code Example

```typescript
if (y === 0) {
    // Year 1: From today to retirement start month
    yearStart = new Date(today.getFullYear(), today.getMonth(), 1);
    yearEnd = new Date(retirementStartDate.getFullYear(), retirementStartDate.getMonth(), 1);
    // Calculate actual months between current month and retirement month
    const yearDiff = yearEnd.getFullYear() - yearStart.getFullYear();
    const monthDiff = yearEnd.getMonth() - yearStart.getMonth();
    monthsInPeriod = yearDiff * 12 + monthDiff;
    // Ensure at least 1 month
    if (monthsInPeriod <= 0) monthsInPeriod = 1;
} else {
    // Subsequent years: Aligned to retirement anniversary
    const anchorMonth = retirementStartDate.getMonth();
    const retirementYear = retirementStartDate.getFullYear();
    yearStart = new Date(retirementYear + y - 1, anchorMonth, 1);
    yearEnd = new Date(retirementYear + y, anchorMonth, 1);
    monthsInPeriod = 12; // Always 12 months for years after Year 1
}

// Monthly loop with dynamic month count
for (let m = 0; m < monthsInPeriod; m++) {
    // ... monthly calculations
}
```

## Benefits

1. **Accurate Partial Year 1**
   - Year 1 spans from current month to retirement month
   - Reflects the actual time until retirement begins
   - Calculations are proportional to actual months

2. **Retirement Anniversary Alignment**
   - All years after Year 1 align to the retirement start month
   - Easy to track annual progress from retirement date
   - Consistent 12-month periods for comparison

3. **Better Financial Planning**
   - Users see exactly how finances evolve from today to retirement
   - Partial year calculations reflect real-world scenarios
   - More accurate projections for mid-year retirements

4. **Consistent with MM/YYYY Format**
   - Works seamlessly with the new retirement start date format
   - Users specify month/year, timeline respects that precision

## Impact on Calculations

### Monthly Calculations (Affected)
- Investment returns (compounded monthly)
- Salary income (if still working)
- Monthly expenses
- Government retirement income (if applicable)

### Yearly Calculations (Affected)
- Total expenses for the year
- Total income for the year
- Net cashflow
- Investment taxes (calculated on annual gains)

### Display (Affected)
- Period column now shows actual date ranges
- Year 1 may show fewer months than 12
- All subsequent years show 12-month periods aligned to retirement month

## Testing Recommendations

1. **Test Partial Year 1**
   - Set current date to December 2025
   - Set retirement to June 2027
   - Verify Year 1 shows 7 months (Dec 2025 → Jun 2026)

2. **Test Full Year Alignment**
   - Verify Year 2+ all show 12-month periods
   - Verify all periods end in June (retirement anniversary month)

3. **Test Edge Cases**
   - Retirement in same month as current month (should show ~12 months for Year 1)
   - Retirement in next month (should show ~1 month for Year 1)
   - Retirement many years in the future

4. **Verify Calculations**
   - Check that expenses/income are proportional to months in period
   - Verify investment returns compound correctly for partial years
   - Ensure taxes are calculated correctly for partial years
