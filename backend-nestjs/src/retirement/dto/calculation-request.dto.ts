import { IsInt, IsNumber, IsOptional, Min, Max, IsString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculationRequestDto {
    @IsString()
    @IsMongoId()
    profileId: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(0.2)
    @Type(() => Number)
    expectedReturnRate?: number = 0.07;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(50)
    @Type(() => Number)
    retirementDurationYears?: number = 25;

    @IsOptional()
    @IsInt()
    @Min(50)
    @Max(120)
    @Type(() => Number)
    targetAge?: number = 100;
}
