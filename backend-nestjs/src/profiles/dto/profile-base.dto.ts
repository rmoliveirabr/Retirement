import {
    IsEmail,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Max,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProfileBaseDto {
    @IsEmail()
    email: string;

    @IsInt()
    @Min(18)
    @Max(100)
    @Type(() => Number)
    baseAge: number;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    totalAssets: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @ValidateIf((o) => o.fixedAssets <= o.totalAssets, {
        message: 'Fixed assets cannot exceed total assets',
    })
    fixedAssets: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    monthlySalaryNet: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    governmentRetirementIncome: number;

    @IsNumber()
    @Min(0)
    @Max(0.05)
    @Type(() => Number)
    monthlyReturnRate: number;

    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    fixedAssetsGrowthRate: number = 0.04;

    @IsNumber()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    investmentTaxRate: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    investmentTaxablePercentage: number = 1.0;

    @IsInt()
    @Min(0)
    @Max(50)
    @Type(() => Number)
    endOfSalaryYears: number;

    @IsInt()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    governmentRetirementStartYears: number;

    @IsNumber()
    @Min(0)
    @Max(0.1)
    @Type(() => Number)
    governmentRetirementAdjustment: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    monthlyExpenseRecurring: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    rent: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    oneTimeAnnualExpense: number;

    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    annualInflation: number;
}
