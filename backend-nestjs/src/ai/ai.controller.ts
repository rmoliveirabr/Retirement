import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';

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
}
