import { IsString, IsObject, IsArray, IsOptional } from 'class-validator';

export class AiRequestDto {
    @IsString()
    question: string;

    @IsObject()
    profile: Record<string, any>;

    @IsArray()
    results: Record<string, any>[];

    @IsOptional()
    @IsArray()
    history?: Array<{ role: string; content: string }>;
}
