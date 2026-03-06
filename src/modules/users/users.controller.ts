import { Controller, Get, Post, Body, UseGuards, Req, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req: Request) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('update-profile')
    async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        const userId = req.user.id;
        const updatedUser = await this.usersService.update(userId, updateProfileDto);
        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return {
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            }
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        const userId = req.user.id;
        const user = await this.usersService.findByIdWithPassword(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.oldPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid old password');
        }

        const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.usersService.update(userId, { password: hashedNewPassword });

        return { message: 'Password changed successfully' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin-stats')
    getAdminStats() {
        return {
            message: 'This is a protected route only for admins.',
            stats: { totalUsers: 100 }
        };
    }
}
