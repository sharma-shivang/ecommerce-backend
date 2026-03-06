import {
    IsString, IsOptional, IsBoolean, IsNumber,
    IsNotEmpty, Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSubCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) { }
