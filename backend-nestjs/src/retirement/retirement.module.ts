import { Module } from '@nestjs/common';
import { RetirementController } from './retirement.controller';
import { RetirementCalculatorService } from './retirement-calculator.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
    imports: [ProfilesModule],
    controllers: [RetirementController],
    providers: [RetirementCalculatorService],
    exports: [RetirementCalculatorService],
})
export class RetirementModule { }
