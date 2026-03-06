import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
    CREATED_AT = 'createdAt',
    TOTAL = 'total',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class AdminOrdersQueryDto {
    @IsOptional()
    @IsString()
    categoryId?: string;          // category name string (matches products.category)

    @IsOptional()
    @IsString()
    subCategoryId?: string;       // subcategoryId ObjectId string

    @IsOptional()
    @IsEnum(SortBy)
    sortBy?: SortBy = SortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder = SortOrder.DESC;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
