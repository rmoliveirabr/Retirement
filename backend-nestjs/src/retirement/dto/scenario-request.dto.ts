import { IsInt, IsNumber, IsOptional, Min, Max, IsString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class ScenarioRequestDto {
    @IsString()
    @IsMongoId()
    profileId: string;

    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    expectedReturnRate: number = 0.07;

    @IsInt()
    @Min(10)
    @Max(50)
    @Type(() => Number)
    retirementDurationYears: number = 25;

    @IsInt()
    @Min(50)
    @Max(120)
    @Type(() => Number)
    targetAge: number = 100;

    // Optional profile overrides for scenario testing
    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    totalAssets?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    fixedAssets?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    monthlySalaryNet?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    governmentRetirementIncome?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(0.05)
    @Type(() => Number)
    monthlyReturnRate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    fixedAssetsGrowthRate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    investmentTaxRate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    investmentTaxablePercentage?: number;

    @IsOptional()
    @IsString()
    endOfSalaryYears?: string;

    @IsOptional()
    @IsString()
    governmentRetirementStartYears?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(0.1)
    @Type(() => Number)
    governmentRetirementAdjustment?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    monthlyExpenseRecurring?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    rent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    oneTimeAnnualExpense?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    annualInflation?: number;
}
