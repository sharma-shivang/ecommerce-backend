import { IsMongoId, IsNotEmpty, IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class AddToCartDto {
    @IsMongoId()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsString()
    @IsOptional()
    variantSku?: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    color?: string;
}
