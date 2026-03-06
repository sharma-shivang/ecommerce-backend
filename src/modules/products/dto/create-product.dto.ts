import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    stock?: number;

    @IsNumber()
    @Min(0)
    @Max(5)
    @IsOptional()
    @Type(() => Number)
    rating?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    @Type(() => Number)
    discountPercent?: number;

    @IsOptional()
    isFeatured?: boolean;
}
