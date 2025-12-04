import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { InfoCache, InfoCacheSchema } from './schemas/info-cache.schema';
import { RetirementModule } from '../retirement/retirement.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: InfoCache.name, schema: InfoCacheSchema }]),
        RetirementModule,
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
