import { IsInt, IsNotEmpty, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(10, { message: 'Review must be at least 10 characters' })
    @MaxLength(1000)
    comment: string;
}

export class ModerateReviewDto {
    @IsString()
    @IsNotEmpty()
    status: 'approved' | 'rejected';
}
