import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    @IsOptional()
    variantSku?: string;
}
