import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';

@Controller('api/ai')
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
}
