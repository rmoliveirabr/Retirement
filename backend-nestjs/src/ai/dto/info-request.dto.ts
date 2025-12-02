import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InfoRequestDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    prompt: string;

    @IsBoolean()
    @IsOptional()
    forceRefresh?: boolean;
}
