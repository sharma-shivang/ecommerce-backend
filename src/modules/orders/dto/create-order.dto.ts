import { IsNotEmpty, IsString, ValidateNested, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @IsString()
    @IsNotEmpty()
    country: string;
}

export class CreateOrderDto {
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    @IsNotEmpty()
    shippingAddress: ShippingAddressDto;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsOptional()
    @IsString()
    orderNote?: string;
}
