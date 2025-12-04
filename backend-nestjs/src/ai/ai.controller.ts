import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';
import { InfoRequestDto } from './dto/info-request.dto';

@Controller('api/ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('ask')
    async askAi(@Body() request: AiRequestDto) {
        return this.aiService.generateAiResponse(
            request.profile,
            request.results,
            request.question,
            request.history,
        );
    }



    @Post('info')
    async getInfo(@Body() request: InfoRequestDto) {
        return this.aiService.getInfo(
            request.key,
            request.prompt,
            request.forceRefresh,
        );
    }

}
