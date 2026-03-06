import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}
