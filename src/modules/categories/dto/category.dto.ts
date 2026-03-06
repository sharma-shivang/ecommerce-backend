import {
    IsString, IsOptional, IsBoolean, IsNumber,
    IsNotEmpty, IsArray, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) { }

export class ReorderItemDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsNumber()
    @Min(0)
    displayOrder: number;
}

export class ReorderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItemDto)
    items: ReorderItemDto[];
}
