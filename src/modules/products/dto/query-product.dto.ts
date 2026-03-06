import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    limit?: number;
}
