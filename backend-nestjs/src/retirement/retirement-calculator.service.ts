import { Injectable } from '@nestjs/common';
import { Profile, calculateYearsToRetirement } from '../profiles/entities/profile.entity';

interface TimelineRow {
    year: number;
    age: number;
    period: string;
    value_invested: number;
    total_expenses: number;
    total_income_salary: number;
    total_income_retirement: number;
    total_to_be_added: number;
    taxes_over_investments: number;
    net_cashflow: number;
    final_value: number;
}

export interface RetirementCalculation {
    profileId: string;
    monthlySavings: number;
    totalRetirementFund: number;
    monthlyRetirementIncome: number;
    yearsToRetirement: number;
    calculationDate: Date;
    assumptions: {
        expectedReturnRate: number;
        retirementDurationYears: number;
        inflationRate: number;
        monthlyExpenses: number;
        monthlyGrowthUsed: number;
        retirementStartDate: string;
        endOfSalaryDate: string;
        timeline: TimelineRow[];
        targetAge: number;
        fixedAssetsAtRetirement: number;
        fixedAssetsGrowthRate: number;
    };
}

function addMonthsToDate(d: Date, months: number): Date {
    const month = d.getMonth() + months;
    const year = d.getFullYear() + Math.floor(month / 12);
    const newMonth = month % 12;
    const day = Math.min(d.getDate(), 28);
    return new Date(year, newMonth, day);
}

@Injectable()
export class RetirementCalculatorService {
    calculateRetirement(
        profile: Profile,
        expectedReturnRate: number = 0.07,
        retirementDurationYears: number = 25,
        targetAge: number = 100,
    ): RetirementCalculation {
        // Determine years to retirement using the helper function
        const yearsToRetirement = calculateYearsToRetirement(profile);

        // base dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Determine timeline_start_date (when retirement planning/self-funded retirement begins)
        let timelineStartDate: Date;
        if (profile.startDate) {
            try {
                timelineStartDate = new Date(profile.startDate);
            } catch (e) {
                timelineStartDate = new Date(today.getFullYear(), 0, 1);
            }
        } else {
            timelineStartDate = new Date(today.getFullYear(), 0, 1);
        }

        // Determine government_retirement_start_date (when government pension/retirement income starts)
        const governmentRetirementStartYears = profile.governmentRetirementStartYears || 0;
        const governmentRetirementStartDate = new Date(
            timelineStartDate.getFullYear() + governmentRetirementStartYears,
            timelineStartDate.getMonth(),
            timelineStartDate.getDate(),
        );

        // For compatibility, retirement_start_date refers to timeline start
        const retirementStartDate = timelineStartDate;

        // Determine a base year aligned to retirement_start_date
        let baseYear: number;
        if (retirementStartDate) {
            const daysToRetirement =
                (retirementStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            const actualYearsToRetirement = daysToRetirement / 365.25;
            if (Math.abs(actualYearsToRetirement - yearsToRetirement) > 0.5) {
                baseYear = retirementStartDate.getFullYear() - Math.floor(actualYearsToRetirement);
            } else {
                baseYear = retirementStartDate.getFullYear() - yearsToRetirement;
            }
        } else {
            baseYear = today.getFullYear();
        }

        // Salary end date measured from TODAY
        const endOfSalaryDate = new Date(
            today.getFullYear() + profile.endOfSalaryYears,
            today.getMonth(),
            today.getDate(),
        );

        // Initial investment value (liquid)
        const investment = Math.max(0.0, profile.totalAssets - profile.fixedAssets);

        // monthly constants
        const monthlyExpensesBase = profile.monthlyExpenseRecurring + profile.rent;
        const monthlyReturnRate = profile.monthlyReturnRate;
        const investmentTaxRate = profile.investmentTaxRate;
        const investmentTaxablePercentage = profile.investmentTaxablePercentage || 1.0;
        const fixedAssetsGrowthRate = profile.fixedAssetsGrowthRate || 0.04;

        // determine monthly growth used for the projection
        let monthlyGrowthUsed: number;
        if (profile.monthlyReturnRate != null && profile.monthlyReturnRate > 0) {
            monthlyGrowthUsed = profile.monthlyReturnRate;
        } else if (expectedReturnRate > 0) {
            monthlyGrowthUsed = expectedReturnRate / 12.0;
        } else {
            monthlyGrowthUsed = 0.0;
        }

        // timeline list
        const timeline: TimelineRow[] = [];

        // starting values at retirement start
        let currentValue = investment;
        let pendingTax = 0.0;

        // Track the fund value at retirement start
        let retirementStartFundValue: number | null = null;

        // projected_monthly_retirement represents GOVERNMENT pension
        let projectedMonthlyRetirement = profile.governmentRetirementIncome;

        // Simulate year-by-year
        const maxYears = 200;
        let y = 0;

        while (y < maxYears) {
            const anchorMonth = retirementStartDate.getMonth();
            const yearStart = new Date(baseYear + y, anchorMonth, 1);
            const yearEnd = new Date(baseYear + y + 1, anchorMonth, 1);

            const age = profile.baseAge + y;
            if (age > targetAge) {
                break;
            }

            // Check if funds are depleted at the START of the year
            // If currentValue <= 0, we've run out of money
            if (currentValue <= 0 && y > 0) {
                break;
            }

            // Yearly accumulators
            let totalExpensesYear = 0.0;
            let totalIncomeSalaryYear = 0.0;
            let totalIncomeRetirementYear = 0.0;

            // Calculate years since retirement start for inflation purposes
            const currentYear = baseYear + y;
            const startYear = retirementStartDate.getFullYear();
            const yearsSinceRetirementStart = Math.max(0, currentYear - startYear);
            const isInRetirement = currentYear >= startYear;

            // monthly loop to compound monthly changes
            let monthlyValue = currentValue;
            for (let m = 0; m < 12; m++) {
                const monthDate = addMonthsToDate(yearStart, m);

                const inflationYears = isInRetirement ? yearsSinceRetirementStart : y;

                // monthly expenses adjusted
                const monthlyExpense =
                    monthlyExpensesBase * Math.pow(1 + profile.annualInflation, inflationYears);
                const monthlyOneTime =
                    (profile.oneTimeAnnualExpense *
                        Math.pow(1 + profile.annualInflation, inflationYears)) /
                    12.0;
                const totalMonthlyExpense = monthlyExpense + monthlyOneTime;

                // monthly income: salary if active
                let monthlySalary = 0.0;
                if (monthDate < endOfSalaryDate) {
                    monthlySalary =
                        profile.monthlySalaryNet * Math.pow(1 + profile.annualInflation, inflationYears);
                }

                // retirement income projection
                const monthlyRetirementProjection = projectedMonthlyRetirement;

                // whether retirement income is actually received this month (government pension)
                const retirementReceived = monthDate >= governmentRetirementStartDate;
                const monthlyRetirementIncome = retirementReceived
                    ? monthlyRetirementProjection
                    : 0.0;

                // monthly net contribution
                const monthlyNet =
                    monthlySalary + monthlyRetirementIncome - totalMonthlyExpense;

                // apply monthly investment growth
                if (monthlyGrowthUsed > 0) {
                    monthlyValue = monthlyValue * (1 + monthlyGrowthUsed) + monthlyNet;
                } else {
                    monthlyValue = monthlyValue + monthlyNet;
                }

                totalExpensesYear += totalMonthlyExpense;
                totalIncomeSalaryYear += monthlySalary;
                totalIncomeRetirementYear += monthlyRetirementIncome;
            }

            // final value before applying taxes paid this year
            const finalValueBeforeTax = monthlyValue;

            // taxes_paid this year are the pending_tax computed from last year's gains
            const taxesPaid = pendingTax;

            // subtract taxes_paid from the final value
            const finalValue = finalValueBeforeTax - taxesPaid;

            // total change in invested value during the year
            const totalToBeAdded = finalValueBeforeTax - currentValue;
            const netCashflow =
                totalIncomeSalaryYear + totalIncomeRetirementYear - totalExpensesYear;

            // Capture retirement start fund value at the BEGINNING of retirement year
            if (currentYear === startYear && retirementStartFundValue === null) {
                retirementStartFundValue = currentValue;
                pendingTax = 0.0;
            }

            // Append to timeline only from retirement_start_date onward
            if (isInRetirement) {
                const yearsSinceRetirement = currentYear - startYear;

                // Use the actual retirement start date for calculating display periods
                const displayStart = new Date(retirementStartDate);
                displayStart.setFullYear(startYear + yearsSinceRetirement);

                const displayEnd = new Date(retirementStartDate);
                displayEnd.setFullYear(startYear + yearsSinceRetirement + 1);

                timeline.push({
                    year: yearsSinceRetirement + 1,
                    age: age,
                    period: `${this.formatDate(displayStart)} -> ${this.formatDate(displayEnd)}`,
                    value_invested: Math.round(currentValue * 100) / 100,
                    total_expenses: Math.round(totalExpensesYear * 100) / 100,
                    total_income_salary: Math.round(totalIncomeSalaryYear * 100) / 100,
                    total_income_retirement: Math.round(totalIncomeRetirementYear * 100) / 100,
                    total_to_be_added: Math.round(totalToBeAdded * 100) / 100,
                    taxes_over_investments: Math.round(taxesPaid * 100) / 100,
                    net_cashflow: Math.round(netCashflow * 100) / 100,
                    final_value: Math.round(finalValue * 100) / 100,
                });
            }

            // Compute tax on this year's investment gains, to be paid next year
            const gain = finalValueBeforeTax - currentValue - netCashflow;
            const taxThisYear =
                Math.max(0.0, gain) * investmentTaxRate * investmentTaxablePercentage;

            // Prepare for next year
            currentValue = finalValue;

            // project government retirement monthly amount grows by retirement_adjustment (COLA)
            projectedMonthlyRetirement =
                projectedMonthlyRetirement * (1 + profile.governmentRetirementAdjustment);

            // set pending tax to be paid next year
            pendingTax = taxThisYear;

            y++;
        }

        // Compute monthly_savings simple
        const monthlyExpenses = monthlyExpensesBase;
        const monthlySavings = profile.monthlySalaryNet - monthlyExpenses;

        // Total retirement fund at retirement start
        const totalRetirementFund =
            retirementStartFundValue !== null ? retirementStartFundValue : currentValue;

        // Calculate fixed assets value at retirement start
        const fixedAssetsAtRetirement =
            profile.fixedAssets * Math.pow(1 + fixedAssetsGrowthRate, yearsToRetirement);

        // Use actual government retirement income from profile
        const monthlyRetirementIncome = profile.governmentRetirementIncome;

        return {
            profileId: profile.id,
            monthlySavings: monthlySavings,
            totalRetirementFund: totalRetirementFund,
            monthlyRetirementIncome: monthlyRetirementIncome,
            yearsToRetirement: yearsToRetirement,
            calculationDate: new Date(),
            assumptions: {
                expectedReturnRate: expectedReturnRate,
                retirementDurationYears: retirementDurationYears,
                inflationRate: profile.annualInflation,
                monthlyExpenses: monthlyExpenses,
                monthlyGrowthUsed: monthlyGrowthUsed,
                retirementStartDate: retirementStartDate.toISOString(),
                endOfSalaryDate: endOfSalaryDate.toISOString(),
                timeline: timeline,
                targetAge: targetAge,
                fixedAssetsAtRetirement: fixedAssetsAtRetirement,
                fixedAssetsGrowthRate: fixedAssetsGrowthRate,
            },
        };
    }

    calculateRequiredSavings(
        targetMonthlyIncome: number,
        yearsToRetirement: number,
        expectedReturnRate: number = 0.07,
        inflationRate: number = 0.03,
    ): any {
        // Adjust target income for inflation
        const inflationAdjustment = Math.pow(1 + inflationRate, yearsToRetirement);
        const targetAnnualIncome = targetMonthlyIncome * 12 * inflationAdjustment;

        // Calculate required retirement fund (using 4% rule)
        const safeWithdrawalRate = 0.04;
        const requiredFund = targetAnnualIncome / safeWithdrawalRate;

        // Calculate required monthly savings
        let requiredMonthlySavings: number;
        if (expectedReturnRate > 0) {
            const monthlyRate = expectedReturnRate / 12;
            requiredMonthlySavings =
                requiredFund /
                ((Math.pow(1 + monthlyRate, yearsToRetirement * 12) - 1) / monthlyRate);
        } else {
            requiredMonthlySavings = requiredFund / (yearsToRetirement * 12);
        }

        return {
            requiredMonthlySavings: requiredMonthlySavings,
            requiredRetirementFund: requiredFund,
            targetMonthlyIncome: targetMonthlyIncome,
            targetAnnualIncome: targetAnnualIncome,
            yearsToRetirement: yearsToRetirement,
            assumptions: {
                expectedReturnRate: expectedReturnRate,
                inflationRate: inflationRate,
                safeWithdrawalRate: safeWithdrawalRate,
            },
        };
    }

    calculateRetirementReadiness(
        profile: Profile,
        expectedReturnRate: number = 0.07,
    ): any {
        const calculation = this.calculateRetirement(profile, expectedReturnRate);

        // Calculate current savings rate
        const monthlyExpenses = profile.monthlyExpenseRecurring + profile.rent;
        const monthlySavings = profile.monthlySalaryNet - monthlyExpenses;
        const savingsRate =
            profile.monthlySalaryNet > 0 ? monthlySavings / profile.monthlySalaryNet : 0;

        // Calculate recommended savings rate
        const recommendedSavingsRate = 0.15;

        // Derive coverage metrics from the calculated timeline
        const tl = calculation.assumptions.timeline || [];
        const depletionIndex = tl.findIndex((row) => row.final_value < 0);
        const lastIndex = tl.length - 1;

        const ageWhenDeplete =
            depletionIndex >= 0
                ? tl[depletionIndex].age
                : lastIndex >= 0
                    ? tl[lastIndex].age
                    : profile.baseAge;

        const neededYears = Math.max(1, 100 - profile.baseAge);
        const coveredYears = Math.max(0, ageWhenDeplete - profile.baseAge);
        const coverageRatio = Math.max(0.0, Math.min(1.0, coveredYears / neededYears));

        // Leftover funds at the end
        let lastFinalValue = 0.0;
        if (tl.length > 0) {
            if (depletionIndex >= 0) {
                lastFinalValue = 0.0;
            } else {
                lastFinalValue = tl[lastIndex].final_value || 0.0;
            }
        }

        const yearlyExpensesNow = (profile.monthlyExpenseRecurring + profile.rent) * 12.0;
        const bufferTarget = Math.max(1.0, yearlyExpensesNow * 2.0);
        const leftoverRatio = Math.max(0.0, Math.min(1.0, lastFinalValue / bufferTarget));

        // Calculate readiness score (0-100)
        const monthlyExpensesTotal = profile.monthlyExpenseRecurring + profile.rent;
        const emergencyFundTarget = Math.max(monthlyExpensesTotal * 6, 1.0);
        const emergencyFundRatio = Math.min(1.0, profile.totalAssets / emergencyFundTarget);

        const readinessScore = Math.min(
            100.0,
            Math.max(
                0.0,
                Math.min(40.0, Math.max(0.0, (savingsRate / recommendedSavingsRate) * 40.0)) +
                Math.min(20.0, emergencyFundRatio * 20.0) +
                coverageRatio * 30.0 +
                leftoverRatio * 10.0,
            ),
        );

        // Generate recommendations
        const recommendations: string[] = [];
        if (savingsRate < recommendedSavingsRate) {
            recommendations.push(
                'Increase your monthly savings rate to at least 15% of your income',
            );
        }
        if (profile.totalAssets < profile.monthlySalaryNet * 6) {
            recommendations.push('Build an emergency fund of 3-6 months of expenses');
        }
        if (calculation.monthlyRetirementIncome < monthlyExpenses * 0.8) {
            recommendations.push(
                'Consider increasing your retirement savings or working longer',
            );
        }
        if (coverageRatio < 1.0) {
            recommendations.push(
                'Funds may not last to age 100—consider reducing expenses, increasing savings, or delaying retirement',
            );
        }
        if (leftoverRatio < 0.5 && depletionIndex < 0) {
            recommendations.push(
                'End-of-horizon reserves are low—aim for a larger buffer (e.g., 2 years of expenses)',
            );
        }

        return {
            readinessScore: readinessScore,
            currentSavingsRate: savingsRate,
            recommendedSavingsRate: recommendedSavingsRate,
            monthlySavings: monthlySavings,
            projectedRetirementIncome: calculation.monthlyRetirementIncome,
            currentMonthlyExpenses: monthlyExpenses,
            recommendations: recommendations,
            calculation: calculation,
        };
    }

    private formatDate(date: Date): string {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${year}`;
    }
}
