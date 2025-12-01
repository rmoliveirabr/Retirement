import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RetirementCalculatorService } from './retirement-calculator.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CalculationRequestDto } from './dto/calculation-request.dto';
import { ScenarioRequestDto } from './dto/scenario-request.dto';

@Controller('api/retirement')
@UseGuards(AuthGuard('jwt'))
export class RetirementController {
    constructor(
        private readonly calculatorService: RetirementCalculatorService,
        private readonly profilesService: ProfilesService,
    ) { }

    @Post('calculate')
    async calculateRetirement(@Body() request: CalculationRequestDto) {
        console.log('[RetirementController] Calculate request received:', JSON.stringify(request, null, 2));
        const profile = await this.profilesService.findOne(request.profileId);
        console.log('[RetirementController] Profile found:', profile.id, profile.email);
        const result = await this.calculatorService.calculateRetirement(
            profile,
            request.expectedReturnRate ?? 0.07,
            request.retirementDurationYears ?? 25,
            request.targetAge ?? 100,
        );
        console.log('[RetirementController] Calculation completed successfully');
        return result;
    }

    @Get('readiness/:id')
    async getRetirementReadiness(
        @Param('id') id: string,
        @Query('expected_return_rate') expectedReturnRate?: number,
    ) {
        const profile = await this.profilesService.findOne(id);
        return this.calculatorService.calculateRetirementReadiness(
            profile,
            expectedReturnRate || 0.07,
        );
    }

    @Post('scenario')
    async calculateScenario(@Body() request: ScenarioRequestDto) {
        const profile = await this.profilesService.findOne(request.profileId);

        // Apply scenario overrides to profile
        const profileObj = (profile as any).toObject ? (profile as any).toObject() : profile;
        const scenarioProfile = { ...profileObj };
        if (request.startDate !== undefined) scenarioProfile.startDate = request.startDate;
        if (request.totalAssets !== undefined) scenarioProfile.totalAssets = request.totalAssets;
        if (request.fixedAssets !== undefined) scenarioProfile.fixedAssets = request.fixedAssets;
        if (request.monthlySalaryNet !== undefined)
            scenarioProfile.monthlySalaryNet = request.monthlySalaryNet;
        if (request.governmentRetirementIncome !== undefined)
            scenarioProfile.governmentRetirementIncome = request.governmentRetirementIncome;
        if (request.monthlyReturnRate !== undefined)
            scenarioProfile.monthlyReturnRate = request.monthlyReturnRate;
        if (request.fixedAssetsGrowthRate !== undefined)
            scenarioProfile.fixedAssetsGrowthRate = request.fixedAssetsGrowthRate;
        if (request.investmentTaxRate !== undefined)
            scenarioProfile.investmentTaxRate = request.investmentTaxRate;
        if (request.investmentTaxablePercentage !== undefined)
            scenarioProfile.investmentTaxablePercentage = request.investmentTaxablePercentage;
        if (request.endOfSalaryYears !== undefined)
            scenarioProfile.endOfSalaryYears = request.endOfSalaryYears;
        if (request.governmentRetirementStartYears !== undefined)
            scenarioProfile.governmentRetirementStartYears = request.governmentRetirementStartYears;
        if (request.governmentRetirementAdjustment !== undefined)
            scenarioProfile.governmentRetirementAdjustment = request.governmentRetirementAdjustment;
        if (request.monthlyExpenseRecurring !== undefined)
            scenarioProfile.monthlyExpenseRecurring = request.monthlyExpenseRecurring;
        if (request.rent !== undefined) scenarioProfile.rent = request.rent;
        if (request.oneTimeAnnualExpense !== undefined)
            scenarioProfile.oneTimeAnnualExpense = request.oneTimeAnnualExpense;
        if (request.annualInflation !== undefined)
            scenarioProfile.annualInflation = request.annualInflation;

        return this.calculatorService.calculateRetirement(
            scenarioProfile,
            request.expectedReturnRate,
            request.retirementDurationYears,
            request.targetAge,
        );
    }

    @Get('status')
    getStatus() {
        return {
            status: 'operational',
            service: 'retirement-calculator',
            version: '2.0',
        };
    }
}
