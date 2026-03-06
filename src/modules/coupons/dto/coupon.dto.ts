import {
    IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional,
    IsBoolean, IsDateString, IsInt, Max,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DiscountType } from '../schemas/coupon.schema';

export class CreateCouponDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEnum(DiscountType)
    discountType: DiscountType;

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minOrderAmount?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxUses?: number;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) { }

export class ValidateCouponDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsNumber()
    @Min(0)
    orderSubtotal: number;
}
