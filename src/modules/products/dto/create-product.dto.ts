import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, Max, IsUrl, ArrayMaxSize, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['XS', 'S', 'M', 'L', 'XL', 'Free Size'])
    size: string;

    @IsString()
    @IsNotEmpty()
    color: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    stock: number;

    @IsString()
    @IsNotEmpty()
    sku: string;

    @IsArray()
    @IsUrl({}, { each: true })
    @IsOptional()
    images?: string[];
}

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
    @IsUrl({}, { each: true })
    @ArrayMaxSize(8)
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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantDto)
    @IsOptional()
    variants?: VariantDto[];
}
