import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { InfoCache, InfoCacheSchema } from './schemas/info-cache.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: InfoCache.name, schema: InfoCacheSchema }]),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
